# SixNations-Scorers
A small game about choosing the better scorer of two Six Nations rugby players

## Web app

The web version is in [web-app](web-app).

Files:
- [web-app/index.html](web-app/index.html)
- [web-app/styles.css](web-app/styles.css)
- [web-app/script.js](web-app/script.js)
- [web-app/players.json](web-app/players.json)

## Run locally

From the repository root, run:

```powershell
cd web-app
python -m http.server 8080
```

Then open:
- http://localhost:8080

## GitHub Pages deployment

Automatic deployment is configured with:
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

When you push to `main`, GitHub Actions deploys [web-app](web-app) to GitHub Pages.
