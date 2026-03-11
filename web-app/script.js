const DATA_FILE = 'players.json';
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
let revealedPlayerIds = new Set();

const ui = {
  gamePlaySection: document.getElementById('game-play'),
  gameOverSection: document.getElementById('game-over'),
  resultSection: document.getElementById('result-section'),
  nextRoundBtn: document.getElementById('next-round'),
  playAgainBtn: document.getElementById('play-again'),
  player1Score: document.getElementById('player1-score'),
  player2Score: document.getElementById('player2-score'),
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

    setupEventListeners();
    startGame();
  } catch (err) {
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
  ui.nextRoundBtn.addEventListener('click', goToNextRound);
  ui.playAgainBtn.addEventListener('click', resetToStart);

  document.querySelectorAll('.choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = Number(btn.dataset.choice);
      evaluateChoice(choice);
    });
  });

  document.querySelectorAll('.details').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerNum = Number(btn.dataset.player);
      showPlayerDetails(playerNum);
    });
  });
}

function startGame() {
  streak = 0;
  bestStreak = 0;
  roundsPlayed = 0;
  consecutiveRounds = 0;
  currentPlayer = null;
  opponentPlayer = null;
  revealedPlayerIds = new Set();

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
  revealedPlayerIds.add(currentPlayer.id);
  revealedPlayerIds.add(opponentPlayer.id);
  updateRevealUI();
}

function goToNextRound() {
  if (!currentPlayer || !opponentPlayer) {
    return;
  }

  const previousWinner = currentPlayer.total >= opponentPlayer.total ? currentPlayer : opponentPlayer;
  const previousCurrentWon = previousWinner.id === currentPlayer.id;
  let hasReturningPlayer = true;

  if (previousCurrentWon) {
    if (consecutiveRounds >= MAX_STAY) {
      // Winner reached max stay, force replacement for both spots.
      currentPlayer = getRandomDifferentPlayer(previousWinner);
      opponentPlayer = currentPlayer ? getRandomDifferentPlayer(currentPlayer) : null;
      consecutiveRounds = 1;
      hasReturningPlayer = false;
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

  // Retain score visibility only for the returning player (always at pos 1)
  revealedPlayerIds = hasReturningPlayer ? new Set([currentPlayer.id]) : new Set();

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
  const team1 = getTeamConfig(currentPlayer.team);
  const team2 = getTeamConfig(opponentPlayer.team);
  
  if (card1 && team1) {
    card1.style.borderColor = team1.accent;
    card1.style.background = `linear-gradient(135deg, ${team1.color}22, #f7f8f5)`;
    if (badge1) {
      badge1.style.backgroundImage = `url('${team1.logo}')`;
    }
  } else if (badge1) {
    badge1.style.backgroundImage = 'none';
  }
  
  if (card2 && team2) {
    card2.style.borderColor = team2.accent;
    card2.style.background = `linear-gradient(135deg, ${team2.color}22, #f7f8f5)`;
    if (badge2) {
      badge2.style.backgroundImage = `url('${team2.logo}')`;
    }
  } else if (badge2) {
    badge2.style.backgroundImage = 'none';
  }

  updateRevealUI();
}

function updateRevealUI() {
  const score1Revealed = revealedPlayerIds.has(currentPlayer.id);
  const score2Revealed = revealedPlayerIds.has(opponentPlayer.id);

  ui.player1Score.textContent = score1Revealed ? currentPlayer.total + ' pts' : '';
  ui.player1Score.classList.toggle('hidden', !score1Revealed);

  ui.player2Score.textContent = score2Revealed ? opponentPlayer.total + ' pts' : '';
  ui.player2Score.classList.toggle('hidden', !score2Revealed);

  document.querySelector('.details[data-player="1"]').classList.toggle('hidden', !score1Revealed);
  document.querySelector('.details[data-player="2"]').classList.toggle('hidden', !score2Revealed);
}

function getTeamConfig(teamName) {
  const normalized = String(teamName || '').trim().toLowerCase();
  const aliasMap = {
    england: 'England',
    france: 'France',
    wales: 'Wales',
    scotland: 'Scotland',
    ireland: 'Ireland',
    italy: 'Italy'
  };

  const canonical = aliasMap[normalized];
  if (canonical) {
    return TEAM_CONFIG[canonical];
  }

  const matchedKey = Object.keys(TEAM_CONFIG).find((key) => normalized.includes(key.toLowerCase()));
  return matchedKey ? TEAM_CONFIG[matchedKey] : null;
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

}

function resetToStart() {
  startGame();
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

document.addEventListener('DOMContentLoaded', initGame);
