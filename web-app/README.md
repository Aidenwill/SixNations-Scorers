# Six Nations Scoring Duel - Web App

Interactive web application to guess which Six Nations player scored the most points.

## Features

### Multilingual Interface
- Language selector in the header (FR / EN / IT)
- Interface texts update instantly without reloading
- Selected language is saved in localStorage

### Player Details
- **Details Button**: Click "Details" on any player card to see their complete scoring history
- **Modal Display**: Shows all tries, conversions, penalties, and drop goals with dates
- **Full Statistics**: View total points and breakdown by match

### Score Management
- **Local High Scores**: Top 10 scores saved in browser localStorage
- **JSON Export**: Export your high scores to a downloadable JSON file
- **Note**: GitHub Pages is static, so server-side storage isn't available. The export feature allows you to save and share your scores manually.

### UX Design
- **Team Emblems**: Each player card displays their team's official logo
- **Team Colors**: Cards use gradients based on official team colors
- **Accent Borders**: Colored borders matching each team
- **Subtle Rugby Pattern**: Background with geometric pattern

### Animations
- Card hover effect (elevation + shadow)
- Slide-in animation for results
- Smooth transitions on all buttons
- Pulse effect on statistics

### Responsive
- Adaptive layout for mobile/desktop
- Grid switches to column layout on small screens
- Scalable typography with clamp()

## Team Configuration

Colors and logos are defined in `script.js`:

```javascript
const TEAM_CONFIG = {
  'England': { logo: '...', color: '#ffffff', accent: '#d71920' },
  'France': { logo: '...', color: '#0055a4', accent: '#ef4135' },
  // etc.
}
```

## Logo Sources

All logos from Wikimedia Commons under free license.

## Local Development

```bash
cd web-app
python -m http.server 8080
```

Then open http://localhost:8080

## Server-Side Storage Note

GitHub Pages hosts static sites only. For true server-side score storage, you would need:
- A backend API (Node.js, Python Flask, etc.)
- A database (MongoDB, PostgreSQL, etc.)
- Hosting service (Heroku, Railway, AWS, etc.)

The current implementation uses localStorage + JSON export as a practical workaround.
