# Retro Atlas

`Retro Atlas` is an engineer-focused learning platform that turns real postmortems into structured incident knowledge and interactive resolution practice.

## MVP (First Push)

This first version is a **static MVP** backed by curated JSON data.

### Included

- Filterable and paginated incident list
- Single incident page with a consistent structure:
  - what happened
  - impact
  - key learnings
  - canonical resolution sequence
- Incident-specific simulator with:
  - decision paths
  - detours
  - run stats
  - post-run comparison of:
    - your decision chain
    - optimal decision chain
    - overlap across required steps

### Current Data Layer

- Static datasets:
  - `mock-ui/data/incidents.json`
  - `mock-ui/data/simulators.json`

## Project Structure

```text
mock-ui/
  index.html
  incident/index.html
  simulator/index.html
  styles.css
  script.js
  incident.js
  simulator.js
  data-loader.js
  data/
    incidents.json
    simulators.json
```

## Run Locally

```bash
npm run dev
```

Then open:

- `http://localhost:5173/`

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow that deploys `mock-ui/` to Pages on push to `main`.

### One-time GitHub settings

1. Go to `Settings -> Pages`
2. Set `Source` to `GitHub Actions`

After that, pushes to `main` will deploy automatically.

## Backlog

- Create a functional data pipeline with adapters to multiple sources
- Optimize simulator data so optimal steps map directly to actual documented resolution steps
- Create layered detour steps grounded in each incident’s real timeline and failure modes
- Add user auth and progress tracking for learning paths
- Add layered system design and architecture concepts per incident
- Add incident quality scoring and source confidence metadata
- Add authoring/review tooling for incident and simulator curation
- Add search indexing and semantic retrieval across incidents and learnings
- Add team/organization dashboards for learning analytics
- Add export APIs for integration into internal L&D platforms
