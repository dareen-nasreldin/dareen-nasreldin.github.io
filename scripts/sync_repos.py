#!/usr/bin/env python3
"""Sync new public GitHub repos to projects.html using the first image found in each repo."""
import json
import os
import re
import urllib.request
from pathlib import Path

USERNAME = os.environ.get("GH_USERNAME", "dareen-nasreldin")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
PROJECTS_HTML = "projects.html"
IMAGES_DIR = Path("images/repos")
SYNC_MARKER = "<!-- SYNC:END -->"
IMAGE_RE = re.compile(r"\.(png|jpg|jpeg|gif|webp)$", re.IGNORECASE)

# Repos to never add
SKIP_REPOS = {
    "dareen-nasreldin.github.io",      # the portfolio site itself
    "dareen-nasreldin",                # GitHub profile README repo
    "Leetcode-Questions",              # not a showcase project
    "flappy-bird-fpga-engine",         # duplicate — flappy-FPGA-verilog is canonical
    "flappy-Verilog-FPGA-source-code", # duplicate source-code archive
}


def api_get(url: str) -> list | dict | None:
    try:
        req = urllib.request.Request(url)
        req.add_header("Accept", "application/vnd.github+json")
        if TOKEN:
            req.add_header("Authorization", f"Bearer {TOKEN}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception:
        return None


def fetch_repos() -> list[dict]:
    url = f"https://api.github.com/users/{USERNAME}/repos?per_page=100&sort=updated"
    return api_get(url) or []


def find_first_repo_image(repo_name: str) -> str | None:
    """Use the recursive Git Trees API to find the first image in the entire repo."""
    tree_url = f"https://api.github.com/repos/{USERNAME}/{repo_name}/git/trees/HEAD?recursive=1"
    data = api_get(tree_url)
    if not isinstance(data, dict):
        return None

    tree = data.get("tree", [])
    # Prefer files whose path looks like a screenshot/preview (prioritise shallower paths)
    images = [
        item for item in tree
        if item.get("type") == "blob" and IMAGE_RE.search(item.get("path", ""))
    ]
    if not images:
        return None

    # Sort by path depth so root-level images come first, then alphabetically
    images.sort(key=lambda i: (i["path"].count("/"), i["path"]))
    chosen = images[0]["path"]
    return f"https://raw.githubusercontent.com/{USERNAME}/{repo_name}/HEAD/{chosen}"


def download_image(download_url: str, repo_name: str) -> str | None:
    """Download an image from a GitHub raw URL; returns relative path for HTML."""
    try:
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        ext = download_url.rsplit(".", 1)[-1].split("?")[0].lower()
        if ext not in ("png", "jpg", "jpeg", "gif", "webp"):
            ext = "png"
        img_path = IMAGES_DIR / f"{repo_name}.{ext}"
        req = urllib.request.Request(download_url)
        with urllib.request.urlopen(req, timeout=15) as resp:
            img_path.write_bytes(resp.read())
        print(f"  Image saved: {img_path}")
        return f"images/repos/{repo_name}.{ext}"
    except Exception as exc:
        print(f"  Image download failed: {exc}")
        return None


def make_card(repo: dict, img_path: str | None) -> str:
    title = repo["name"].replace("-", " ").replace("_", " ").title()
    url = repo["html_url"]
    desc = (repo.get("description") or "A project on GitHub.").replace("<", "&lt;").replace(">", "&gt;")
    lang = repo.get("language") or "Code"

    img_block = ""
    if img_path:
        img_block = (
            f'        <img class="proj-img" src="{img_path}" alt="{title} preview"'
            f' onerror="this.style.display=\'none\'" loading="lazy"'
            f' style="width:100%;height:160px;object-fit:cover;object-position:top;'
            f'border-radius:6px;margin-bottom:16px;">\n'
        )

    return (
        f'\n      <a href="{url}" target="_blank" class="archive-card gsap-card">\n'
        f"{img_block}"
        f'        <div class="card-top">\n'
        f'          <span class="folder-icon">\U0001f4c1</span>\n'
        f'          <span class="github-link">↗</span>\n'
        f"        </div>\n"
        f'        <div class="card-title">{title}</div>\n'
        f'        <div class="card-desc">{desc}</div>\n'
        f'        <div class="proj-stack">\n'
        f'          <span class="stack-tag">{lang}</span>\n'
        f"        </div>\n"
        f"      </a>"
    )


def main() -> None:
    with open(PROJECTS_HTML, encoding="utf-8") as f:
        html = f.read()

    if SYNC_MARKER not in html:
        print(f"ERROR: '{SYNC_MARKER}' not found in {PROJECTS_HTML}.")
        raise SystemExit(1)

    existing_urls = set(re.findall(r'href="(https://github\.com/[^"]+)"', html))

    repos = fetch_repos()
    new_cards: list[str] = []

    for repo in repos:
        if repo["fork"] or repo["archived"] or repo["private"]:
            continue
        if repo["name"] in SKIP_REPOS:
            continue
        if repo["html_url"] in existing_urls:
            continue

        print(f"New repo: {repo['name']}")
        img_url = find_first_repo_image(repo["name"])
        img_path = download_image(img_url, repo["name"]) if img_url else None
        if not img_url:
            print(f"  No image found in {repo['name']}")
        new_cards.append(make_card(repo, img_path))

    if not new_cards:
        print("No new repos to add.")
        return

    insertion = "\n".join(new_cards) + "\n\n      " + SYNC_MARKER
    html = html.replace(SYNC_MARKER, insertion, 1)

    with open(PROJECTS_HTML, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Done — added {len(new_cards)} repo(s) to {PROJECTS_HTML}.")


if __name__ == "__main__":
    main()
