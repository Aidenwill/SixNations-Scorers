# SixNations-Scorers

Six Nations rugby scoring project with scripts + static web app game.

## Repository Layout

- `web-app/`: static front-end (Duel mode + Daily mode)
- `*.ps1`: data extraction/scoring scripts
- `*.json`: generated data snapshots and intermediate artifacts

Primary app entrypoint: [web-app/index.html](web-app/index.html)

## Web App Docs

Use the dedicated documentation in:

- [web-app/README.md](web-app/README.md)
- [web-app/ARCHITECTURE.md](web-app/ARCHITECTURE.md)
- [web-app/QA_CHECKLIST.md](web-app/QA_CHECKLIST.md)

## Run Locally

```powershell
cd web-app
python -m http.server 8080
```

Open `http://localhost:8080`.

## Tests

```powershell
cd web-app
npm test
npm run test:e2e
```

## Deployment

GitHub Pages deployment is automated via:

- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)
