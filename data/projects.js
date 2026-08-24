window.PROJECTS = [
  {
    "url": "https://github.com/dareen-nasreldin/GIS-Routing-Engine",
    "title": "Scalable GIS Routing Engine",
    "description": "Built 'Essential Services GIS,' a crisis-first mapping tool for transit-dependent pedestrians that prioritizes hospitals, shelters, and food banks over the driver-centric assumptions of standard map apps. A one-tap Hospitals toggle floods the map with 1,500+ matched facilities in under a second, backed by an A* + min-heap pathfinding engine benchmarked up to 2.1x faster than Dijkstra across Toronto's 120,000+ intersections. Also engineered a parallelized courier-routing solver (8 threads, 6.8x speedup) that beat the course's TA benchmark by 5.93% on a 100+-stop logistics problem.",
    "stack": ["C++", "Parallel Systems", "Data Processing"],
    "image": { "src": "images/gis.png", "alt": "Scalable GIS Routing Engine preview", "imgY": "50%" }
  },
  {
    "url": "https://github.com/dareen-nasreldin/flappy-FPGA-verilog",
    "title": "Bare-Metal FPGA Game Engine",
    "description": "Architected a fully deterministic, zero-latency game engine in Verilog on an Altera DE1-SoC FPGA, operating entirely without a CPU or operating system. Engineered a multi-module FSM to handle collision detection and 640x480 VGA sprite rendering across a 50MHz clock domain, with bare-metal PS/2 drivers and custom LFSR-based RNG for the hex displays.",
    "stack": ["Verilog", "Hardware Architecture", "ModelSim"],
    "image": { "src": "images/repos/flappy-FPGA-verilog.gif", "alt": "Bare-Metal FPGA Game Engine preview", "imgY": "20%" }
  },
  {
    "url": "https://github.com/dareen-nasreldin/VGA-Music-Sequencer",
    "title": "Embedded VGA Music Sequencer",
    "description": "Programmed a real-time digital synthesizer with zero-jitter audio playback by driving an 8kHz polling loop through memory-mapped I/O. Managed multi-page sheet music state with an optimized flat C struct for O(1) array deletion, and generated interactive square-wave audio using 16-bit PCM arrays and fixed-point phase accumulators.",
    "stack": ["C", "Embedded Systems", "Real-Time Processing"],
    "image": { "src": "images/repos/VGA-Music-Sequencer.png", "alt": "Embedded VGA Music Sequencer preview", "imgY": "0%" }
  },
  {
    "url": "https://dareen-nasreldin.github.io",
    "title": "Interactive Developer Portfolio",
    "description": "Built this fully responsive personal portfolio from scratch using vanilla JavaScript, CSS, and GSAP for scroll-driven animations, including a custom animated PowerShell-style terminal widget with a live command-line interface. Deployment is automated via GitHub Actions directly to GitHub Pages.",
    "stack": ["JavaScript", "CSS", "GSAP"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin",
    "title": "Surgical Biomodel Design (ESP II)",
    "description": "Collaborated with Sunnybrook Hospital surgeons to architect and prototype a bilaminar skin flap biomodel for facial reconstruction training. Validated the biomodel's anatomical realism and mechanical behavior through rigorous physical tensile testing, and delivered a comprehensive technical report on final design specifications and material cost-efficiency.",
    "stack": ["Prototyping", "Materials Testing", "Client Management"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin",
    "title": "Bahen Courtyard Optimization (ESP I)",
    "description": "Translated ambiguous client problem statements into strict, measurable engineering requirements to optimize the spatial flow and functionality of a university courtyard. Iterated on conceptual designs using engineering matrices to quantitatively balance environmental, societal, and human factors.",
    "stack": ["Systems Design", "Requirements Gathering"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin/UniTrack",
    "title": "UniTrack",
    "description": "A full-stack task and internship application tracker built for university life. Lets you capture opportunities on the fly and organize them later — built with a clean Python/Flask backend and a lightweight local-hosted frontend.",
    "stack": ["Python", "Flask", "Web App"],
    "image": { "src": "images/repos/UniTrack.png", "alt": "UniTrack preview", "imgY": "0%" }
  },
  {
    "url": "https://github.com/dareen-nasreldin/linkedin_notion_tool",
    "title": "LinkedIn-to-Notion Automation Pipeline",
    "description": "Engineered a Python automation suite to scrape and aggregate job postings, then sync them securely into a Notion database via RESTful APIs with resilient error handling and structured data parsing.",
    "stack": ["Python", "REST APIs", "Automation"],
    "image": { "src": "images/repos/linkedin_notion_tool.png", "alt": "LinkedIn-to-Notion Automation Pipeline preview", "imgY": "0%" }
  },
  {
    "url": "https://github.com/dareen-nasreldin",
    "title": "sEMG Exoskeleton Control Software",
    "description": "Real-time signal processing pipelines and ML models trained to classify noisy sEMG/EEG biosignals for tremor detection, driving a motorized rehabilitative exoskeleton arm designed for Parkinson's patients.",
    "stack": ["Python", "Machine Learning", "Signal Processing"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin/NOMinEAT",
    "title": "NOMinEAT",
    "description": "A mobile-first group decision web app that solves the \"where should we eat?\" problem. Members nominate restaurants and cast weighted votes; the top pick is revealed when the host ends the session. Designed with a clean REST API boundary for future React Native expansion.",
    "stack": ["JavaScript", "Node.js", "REST APIs"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin/Biathlon_Coach_Deploy",
    "title": "Biathlon Coach",
    "description": "A C++ coaching analytics tool for biathlon athletes — tracking shooting accuracy, training loads, and performance trends to support data-driven coaching decisions.",
    "stack": ["C++", "Analytics", "Sports Tech"],
    "image": null
  },
  {
    "url": "https://github.com/dareen-nasreldin/CircuitMind",
    "title": "Circuitmind",
    "description": "A project on GitHub.",
    "stack": ["JavaScript"],
    "image": { "src": "images/repos/CircuitMind.png", "alt": "Circuitmind preview", "imgY": "0%" }
  },
  {
    "url": "https://github.com/dareen-nasreldin/TREE",
    "title": "Tree",
    "description": "A project on GitHub.",
    "stack": ["TypeScript"],
    "image": null
  }
];
