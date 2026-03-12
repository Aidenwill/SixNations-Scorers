# Six Nations Scoring Duel - Web App

Interactive web application to guess which Six Nations player scored the most points.

## Features

### Multilingual Interface
- Language selector in the header (FR / EN / IT)
- Interface texts update instantly without reloading
- Team names are translated with the selected language
- Selected language is saved in localStorage

### Player Details
- **Details Button**: Click "Details" on any player card to see their complete scoring history
- **Modal Display**: Shows all tries, conversions, penalties, and drop goals with dates
- **Full Statistics**: View total points and breakdown by match

### Duel Rotation
- One player is carried over to the next round
- The returning player is matched against one newly selected player
- To avoid the same anchor staying forever, the anchor rotates after two consecutive rounds

### UX Design
- **Team Emblems**: Each player card displays their team's official logo
- **Team Colors**: Cards use gradients based on official team colors
- **Accent Borders**: Colored borders matching each team
- **Subtle Rugby Pattern**: Background with geometric pattern

### Animations
- Card hover effect (elevation + shadow)
- Slide-in animation for results
- Smooth transitions on all buttons

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

## Notes

- The app is fully static and works on GitHub Pages.
- The selected language is stored in localStorage.
