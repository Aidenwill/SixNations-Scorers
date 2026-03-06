const DATA_FILE = 'players.json';
const SCORE_KEY = 'sixNationsWebHighScores';
const MAX_STAY = 2;

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
      total: Number(p.total ?? p.Total ?? 0)
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
    endGame('Plus de duel possible avec les donnees actuelles.');
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
    ui.resultMessage.textContent = 'Bonne reponse';
    ui.resultMessage.style.color = '#1f6a5f';
  } else {
    streak = 0;
    ui.resultMessage.textContent = 'Mauvaise reponse';
    ui.resultMessage.style.color = '#af3f2b';
  }

  ui.resultDetail.textContent = winner.name + ' (' + winner.team + ') a ' + winner.total + ' points.';
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
    endGame('Impossible de trouver un nouveau duel.');
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
    ui.highScoresList.innerHTML = '<p>Aucun score pour le moment.</p>';
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

document.addEventListener('DOMContentLoaded', initGame);
