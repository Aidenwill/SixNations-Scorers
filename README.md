# SixNations-Scorers
A small game about choosing the better scorer of two Six Nations rugby players.

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

## Web-app README (merged)

### Features

#### Player Details
- Details Button: click Details on any player card to see complete scoring history
- Modal Display: shows tries, conversions, penalties, and drop goals with dates
- Full Statistics: view total points and per-match breakdown

#### Score Management
- Local High Scores: top scores saved in browser localStorage
- JSON Export: export high scores to a downloadable JSON file
- Note: GitHub Pages is static, so server-side storage is not available

#### UX Design
- Team Emblems: each player card displays team logo
- Team Colors: cards use gradients based on team colors
- Accent Borders: colored borders matching each team
- Subtle Rugby Pattern: geometric background pattern

#### Animations
- Card hover effect (elevation + shadow)
- Slide-in animation for results
- Smooth transitions on buttons

#### Responsive
- Adaptive layout for mobile/desktop
- Grid switches to column layout on small screens
- Scalable typography with clamp()

### Team configuration

Colors and logos are defined in [web-app/script.js](web-app/script.js).

### Logo sources

All logos are from Wikimedia Commons under free license.

### Local development

```bash
cd web-app
python -m http.server 8080
```

Then open http://localhost:8080

### Server-side storage note

GitHub Pages hosts static sites only. For true server-side score storage, you would need:
- A backend API (Node.js, Python Flask, etc.)
- A database (MongoDB, PostgreSQL, etc.)
- A hosting service (Heroku, Railway, AWS, etc.)

The current implementation uses localStorage plus JSON export as a practical workaround.
