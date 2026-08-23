#!/usr/bin/env python3
"""Sync new public GitHub repos into data/projects.js using the first image found in each repo."""
import json
import os
import re
import urllib.request
from pathlib import Path

USERNAME = os.environ.get("GH_USERNAME", "dareen-nasreldin")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
PROJECTS_JS = Path("data/projects.js")
IMAGES_DIR = Path("images/repos")
JS_PREFIX = "window.PROJECTS = "
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
    """Download an image from a GitHub raw URL; returns relative path for the data file."""
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


def make_entry(repo: dict, img_path: str | None) -> dict:
    title = repo["name"].replace("-", " ").replace("_", " ").title()
    desc = repo.get("description") or "A project on GitHub."
    lang = repo.get("language") or "Code"

    image = None
    if img_path:
        image = {"src": img_path, "alt": f"{title} preview", "imgY": "0%"}

    return {
        "url": repo["html_url"],
        "title": title,
        "description": desc,
        "stack": [lang],
        "image": image,
    }


def load_projects() -> list[dict]:
    text = PROJECTS_JS.read_text(encoding="utf-8")
    if not text.startswith(JS_PREFIX):
        raise SystemExit(f"ERROR: {PROJECTS_JS} does not start with '{JS_PREFIX}'.")
    json_str = text[len(JS_PREFIX):].rstrip().rstrip(";")
    return json.loads(json_str)


def save_projects(projects: list[dict]) -> None:
    body = json.dumps(projects, indent=2, ensure_ascii=False)
    PROJECTS_JS.write_text(JS_PREFIX + body + ";\n", encoding="utf-8")


def main() -> None:
    if not PROJECTS_JS.exists():
        print(f"ERROR: {PROJECTS_JS} not found.")
        raise SystemExit(1)

    projects = load_projects()
    existing_urls = {p["url"] for p in projects}

    repos = fetch_repos()
    new_entries: list[dict] = []

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
        new_entries.append(make_entry(repo, img_path))

    if not new_entries:
        print("No new repos to add.")
        return

    save_projects(projects + new_entries)
    print(f"Done — added {len(new_entries)} repo(s) to {PROJECTS_JS}.")


if __name__ == "__main__":
    main()
