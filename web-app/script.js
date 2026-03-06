const DATA_FILE = 'players.json';
const SCORE_KEY = 'sixNationsWebHighScores';
const MAX_STAY = 2;

// Team emblems and colors
const TEAM_CONFIG = {
  'England': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/England_national_rugby_union_team_logo.svg/120px-England_national_rugby_union_team_logo.svg.png',
    color: '#ffffff',
    accent: '#d71920'
  },
  'France': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/14/French_Rugby_Federation_logo.svg/120px-French_Rugby_Federation_logo.svg.png',
    color: '#0055a4',
    accent: '#ef4135'
  },
  'Wales': {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/WRU_logo.svg/120px-WRU_logo.svg.png',
    color: '#d71920',
    accent: '#ffffff'
  },
  'Scotland': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bc/Scottish_Rugby_Union.svg/120px-Scottish_Rugby_Union.svg.png',
    color: '#00337f',
    accent: '#ffffff'
  },
  'Ireland': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/IRFU_logo.svg/120px-IRFU_logo.svg.png',
    color: '#169b62',
    accent: '#ffffff'
  },
  'Italy': {
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/89/Federazione_Italiana_Rugby_logo.svg/120px-Federazione_Italiana_Rugby_logo.svg.png',
    color: '#009246',
    accent: '#0066cc'
  }
};

let players = [];
let currentPlayer = null;
let opponentPlayer = null;
let streak = 0;
let bestStreak = 0;
let roundsPlayed = 0;
let consecutiveRounds = 0;
let playerName = '';
let highScores = [];

const ui = {
  playerInputSection: document.getElementById('player-input'),
  gamePlaySection: document.getElementById('game-play'),
  gameOverSection: document.getElementById('game-over'),
  resultSection: document.getElementById('result-section'),
  highScoresList: document.getElementById('high-scores-list'),
  startBtn: document.getElementById('start-game'),
  nextRoundBtn: document.getElementById('next-round'),
  playAgainBtn: document.getElementById('play-again'),
  exportScoresBtn: document.getElementById('export-scores'),
  playerNameInput: document.getElementById('player-name'),
  roundNumber: document.getElementById('round-number'),
  currentStreak: document.getElementById('current-streak'),
  bestStreak: document.getElementById('best-streak'),
  player1Name: document.getElementById('player1-name'),
  player1Team: document.getElementById('player1-team'),
  player2Name: document.getElementById('player2-name'),
  player2Team: document.getElementById('player2-team'),
  resultMessage: document.getElementById('result-message'),
  resultDetail: document.getElementById('result-detail'),
  finalStats: document.getElementById('final-stats')
};

async function initGame() {
  try {
    const response = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Impossible de charger les joueurs: ' + response.status);
    }

    const rawPlayers = await response.json();
    players = normalizePlayers(rawPlayers);

    if (!Array.isArray(players) || players.length < 2) {
      throw new Error('Donnees insuffisantes: minimum 2 joueurs');
    }

    loadHighScores();
    displayHighScores();
    setupEventListeners();
  } catch (err) {
    ui.highScoresList.innerHTML = '<p>Erreur au chargement des donnees.</p>';
    console.error(err);
  }
}

function normalizePlayers(rawPlayers) {
  return (rawPlayers || [])
    .map((p) => ({
      id: String(p.id ?? p.Id ?? ''),
      name: p.name ?? p.Name ?? 'Unknown',
      team: p.team ?? p.Team ?? 'Unknown',
      total: Number(p.total ?? p.Total ?? 0),
      details: p.details ?? p.Details ?? []
    }))
    .filter((p) => p.id && Number.isFinite(p.total));
}

function setupEventListeners() {
  ui.startBtn.addEventListener('click', startGame);
  ui.nextRoundBtn.addEventListener('click', goToNextRound);
  ui.playAgainBtn.addEventListener('click', resetToStart);

  document.querySelectorAll('.choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = Number(btn.dataset.choice);
      evaluateChoice(choice);
    });
  });

  ui.playerNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      startGame();
    }
  });
}

function startGame() {
  playerName = ui.playerNameInput.value.trim();
  if (!playerName) {
    alert('Entre ton nom pour commencer.');
    return;
  }

  streak = 0;
  bestStreak = 0;
  roundsPlayed = 0;
  consecutiveRounds = 0;
  currentPlayer = null;
  opponentPlayer = null;

  ui.playerInputSection.classList.add('hidden');
  ui.gameOverSection.classList.add('hidden');
  ui.gamePlaySection.classList.remove('hidden');
  ui.resultSection.classList.add('hidden');

  prepareRound();
}

function prepareRound() {
  roundsPlayed += 1;

  if (!currentPlayer || !opponentPlayer) {
    currentPlayer = getRandomPlayer();
    opponentPlayer = getRandomDifferentPlayer(currentPlayer);
    consecutiveRounds = 1;
  }

  if (!opponentPlayer) {
    endGame('No more duels possible with current data.');
    return;
  }

  updateScoreboard();
  updateDuelCards();
}

function evaluateChoice(choice) {
  if (!currentPlayer || !opponentPlayer) {
    return;
  }

  const winner = currentPlayer.total >= opponentPlayer.total ? currentPlayer : opponentPlayer;
  const isCorrect = (choice === 1 && winner.id === currentPlayer.id) || (choice === 2 && winner.id === opponentPlayer.id);

  if (isCorrect) {
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    ui.resultMessage.textContent = 'Correct!';
    ui.resultMessage.style.color = '#1f6a5f';
  } else {
    streak = 0;
    ui.resultMessage.textContent = 'Wrong!';
    ui.resultMessage.style.color = '#af3f2b';
  }

  ui.resultDetail.textContent = winner.name + ' (' + winner.team + ') has ' + winner.total + ' points.';
  ui.resultSection.classList.remove('hidden');
  updateScoreboard();

  lockChoices(true);
}

function goToNextRound() {
  if (!currentPlayer || !opponentPlayer) {
    return;
  }

  const previousWinner = currentPlayer.total >= opponentPlayer.total ? currentPlayer : opponentPlayer;
  const previousCurrentWon = previousWinner.id === currentPlayer.id;

  if (previousCurrentWon) {
    if (consecutiveRounds >= MAX_STAY) {
      // Winner reached max stay, force replacement for both spots.
      currentPlayer = getRandomDifferentPlayer(previousWinner);
      opponentPlayer = currentPlayer ? getRandomDifferentPlayer(currentPlayer) : null;
      consecutiveRounds = 1;
    } else {
      // Current winner stays.
      currentPlayer = previousWinner;
      opponentPlayer = getRandomDifferentPlayer(currentPlayer);
      consecutiveRounds += 1;
    }
  } else {
    // Challenger won and becomes current player.
    currentPlayer = previousWinner;
    opponentPlayer = getRandomDifferentPlayer(currentPlayer);
    consecutiveRounds = 1;
  }

  if (!currentPlayer || !opponentPlayer) {
    endGame('Unable to find a new duel.');
    return;
  }

  ui.resultSection.classList.add('hidden');
  lockChoices(false);
  prepareRound();
}

function lockChoices(lock) {
  document.querySelectorAll('.choice').forEach((btn) => {
    btn.disabled = lock;
  });
}

function updateScoreboard() {
  ui.roundNumber.textContent = String(roundsPlayed);
  ui.currentStreak.textContent = String(streak);
  ui.bestStreak.textContent = String(bestStreak);
}

function updateDuelCards() {
  ui.player1Name.textContent = currentPlayer.name;
  ui.player1Team.textContent = currentPlayer.team;
  ui.player2Name.textContent = opponentPlayer.name;
  ui.player2Team.textContent = opponentPlayer.team;

  // Update card backgrounds with team colors
  const card1 = document.querySelector('.card:first-of-type');
  const card2 = document.querySelector('.card:last-of-type');
  const badge1 = document.getElementById('badge1');
  const badge2 = document.getElementById('badge2');
  
  if (card1 && TEAM_CONFIG[currentPlayer.team]) {
    card1.style.borderColor = TEAM_CONFIG[currentPlayer.team].accent;
    card1.style.background = `linear-gradient(135deg, ${TEAM_CONFIG[currentPlayer.team].color}15, #f7f8f5)`;
    if (badge1) {
      badge1.style.backgroundImage = `url('${TEAM_CONFIG[currentPlayer.team].logo}')`;
    }
  }
  
  if (card2 && TEAM_CONFIG[opponentPlayer.team]) {
    card2.style.borderColor = TEAM_CONFIG[opponentPlayer.team].accent;
    card2.style.background = `linear-gradient(135deg, ${TEAM_CONFIG[opponentPlayer.team].color}15, #f7f8f5)`;
    if (badge2) {
      badge2.style.backgroundImage = `url('${TEAM_CONFIG[opponentPlayer.team].logo}')`;
    }
  }
}

function getRandomPlayer() {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomDifferentPlayer(excludedPlayer) {
  const maxAttempts = 100;
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = getRandomPlayer();
    const isDifferentId = candidate.id !== excludedPlayer.id;
    const isDifferentScore = candidate.total !== excludedPlayer.total;
    if (isDifferentId && isDifferentScore) {
      return candidate;
    }
  }
  return null;
}

function endGame(reason) {
  ui.gamePlaySection.classList.add('hidden');
  ui.gameOverSection.classList.remove('hidden');

  ui.finalStats.innerHTML =
    '<p>Rounds joues: <strong>' + roundsPlayed + '</strong></p>' +
    '<p>Serie finale: <strong>' + streak + '</strong></p>' +
    '<p>Meilleure serie: <strong>' + bestStreak + '</strong></p>' +
    '<p>' + reason + '</p>';

  if (bestStreak > 0) {
    saveHighScore(playerName, bestStreak);
  }
}

function resetToStart() {
  ui.gameOverSection.classList.add('hidden');
  ui.playerInputSection.classList.remove('hidden');
  ui.playerNameInput.value = playerName;
}

function loadHighScores() {
  try {
    const raw = localStorage.getItem(SCORE_KEY);
    highScores = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(highScores)) {
      highScores = [];
    }
  } catch {
    highScores = [];
  }
}

function saveHighScore(name, score) {
  highScores.push({
    name,
    score,
    date: new Date().toISOString().replace('T', ' ').slice(0, 19)
  });

  highScores.sort((a, b) => b.score - a.score);
  highScores = highScores.slice(0, 10);
  localStorage.setItem(SCORE_KEY, JSON.stringify(highScores));
  displayHighScores();
}

function displayHighScores() {
  if (!highScores.length) {
    ui.highScoresList.innerHTML = '<p>No high scores yet. Be the first!</p>';
    return;
  }

  const items = highScores
    .map((entry) => '<li><strong>' + escapeHtml(entry.name) + '</strong> - ' + entry.score + ' (' + entry.date + ')</li>')
    .join('');
  ui.highScoresList.innerHTML = '<ol>' + items + '</ol>';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Show player scoring details
function showPlayerDetails(playerNum) {
  const player = playerNum === 1 ? currentPlayer : opponentPlayer;
  if (!player) return;

  let detailsHTML = `
    <div class="player-details-modal">
      <div class="modal-content">
        <h3>${escapeHtml(player.name)} (${escapeHtml(player.team)})</h3>
        <p><strong>Total Points:</strong> ${player.total}</p>
  `;
  
  if (player.details && Array.isArray(player.details) && player.details.length > 0) {
    detailsHTML += '<h4>Scoring History:</h4><ul>';
    player.details.forEach(d => {
      const date = d.date || d.Date || 'N/A';
      const points = d.points || d.Points || 0;
      const type = d.type || d.Type || 'Unknown';
      detailsHTML += `<li>${escapeHtml(date)}: ${points} points (${escapeHtml(type)})</li>`;
    });
    detailsHTML += '</ul>';
  } else {
    detailsHTML += '<p><em>No detailed scoring history available</em></p>';
  }
  
  detailsHTML += `
        <button class="btn primary close-modal">Close</button>
      </div>
    </div>
  `;
  
  // Remove any existing modal
  const existingModal = document.querySelector('.player-details-modal');
  if (existingModal) existingModal.remove();
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', detailsHTML);
  
  // Add close handler
  document.querySelector('.close-modal').addEventListener('click', () => {
    document.querySelector('.player-details-modal').remove();
  });
}

// Export high scores to JSON file
function exportScoresToJSON() {
  if (highScores.length === 0) {
    alert('No scores to export yet!');
    return;
  }
  
  const dataStr = JSON.stringify(highScores, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'six-nations-high-scores-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', initGame);
