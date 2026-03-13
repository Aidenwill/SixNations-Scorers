import {
  DATA_FILE,
  MAX_STAY,
  LANGUAGE_STORAGE_KEY,
  ACTIVITY_VISIBILITY_STORAGE_KEY,
  TEAM_CONFIG
} from './js/constants.js';
import { SUPPORTED_LANGUAGES, getLanguageFlagConfig, translate } from './js/i18n.js';
import {
  getLocalizedTeamName,
  getCanonicalTeamName,
  getTeamFlagEmoji,
  getTeamConfig
} from './js/teams.js';
import {
  computeYearRange,
  computeActivityYearsLabel,
  getActivityYearsText,
  getRandomPlayer,
  getRandomDifferentPlayer,
  escapeHtml,
  normalizeScoreType,
  formatScoreType
} from './js/game-utils.js';
import { pickWinner, isChoiceCorrect, getNextRoundState } from './js/game-engine.js';
import { createFiltersController } from './js/filters.js';
import { showPlayerDetailsModal } from './js/player-details-modal.js';
import { createShareController } from './js/share.js';
import { createGameState, resetRoundState } from './js/state-store.js';
import {
  createUIBindings,
  applyStaticLabels,
  getChoiceButtons,
  getDetailButtons,
  getDuelCards
} from './js/ui.js';
import { createDailyGameController } from './js/daily-game.js';
import { createDailyGridGameController } from './js/daily-grid-game.js';

const state = createGameState();
let filtersController = null;
let shareController = null;
let dailyGameController = null;
let dailyGridGameController = null;

const ui = createUIBindings();

function resolveInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
    return savedLanguage;
  }

  const browserLanguage = String(navigator.language || 'fr').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : 'fr';
}

function resolveInitialActivityVisibility() {
  const stored = localStorage.getItem(ACTIVITY_VISIBILITY_STORAGE_KEY);
  if (stored === null) {
    return true;
  }
  return stored === 'true';
}

function t(key, replacements = {}) {
  return translate(state.currentLanguage, key, replacements);
}

function applyTranslations() {
  applyStaticLabels(ui, state.currentLanguage, state.showActivity, t);

  if (filtersController) {
    filtersController.updateTranslations();
  }

  if (dailyGameController) {
    dailyGameController.updateTranslations();
  }

  if (dailyGridGameController) {
    dailyGridGameController.updateTranslations();
  }

  if (state.currentPlayer && state.opponentPlayer) {
    ui.player1Team.textContent = getLocalizedTeamName(state.currentPlayer.team, t);
    ui.player2Team.textContent = getLocalizedTeamName(state.opponentPlayer.team, t);
    ui.player1Years.textContent = getActivityYearsText(state.currentPlayer.details, state.showActivity, t);
    ui.player2Years.textContent = getActivityYearsText(state.opponentPlayer.details, state.showActivity, t);
    updateRevealUI();
  }
}

function updateLanguage(language) {
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'fr';
  state.currentLanguage = nextLanguage;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  applyTranslations();
}

function updateActivityVisibility(isVisible) {
  const previousVisibility = state.showActivity;
  state.showActivity = Boolean(isVisible);
  localStorage.setItem(ACTIVITY_VISIBILITY_STORAGE_KEY, String(state.showActivity));

  // Any change in activity visibility resets the game to keep scoring comparable.
  if (previousVisibility !== state.showActivity) {
    resetToStart();
    return;
  }

  if (state.currentPlayer && state.opponentPlayer) {
    ui.player1Years.textContent = getActivityYearsText(state.currentPlayer.details, state.showActivity, t);
    ui.player2Years.textContent = getActivityYearsText(state.opponentPlayer.details, state.showActivity, t);
  }
}

async function initGame() {
  try {
    state.currentLanguage = resolveInitialLanguage();
    state.showActivity = resolveInitialActivityVisibility();
    applyTranslations();

    const response = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load players: ' + response.status);
    }

    const rawPlayers = await response.json();
    state.allPlayers = normalizePlayers(rawPlayers);
    filtersController = createFiltersController({
      teamConfig: TEAM_CONFIG,
      ui,
      t,
      escapeHtml,
      getLocalizedTeamName,
      getCanonicalTeamName,
      onFilteredPlayersChange: (nextPlayers, restartGame) => {
        state.players = nextPlayers;
        if (restartGame) {
          resetToStart();
        }
      }
    });
    filtersController.initialize(state.allPlayers);
    state.players = filtersController.getFilteredPlayers();

    shareController = createShareController({
      ui,
      t,
      getBestStreakFlagsSummary,
      getStateSnapshot: () => ({
        roundsPlayed: state.roundsPlayed,
        streak: state.streak,
        bestStreak: state.bestStreak,
        showActivity: state.showActivity
      })
    });

    if (!Array.isArray(state.allPlayers) || state.allPlayers.length < 2) {
      throw new Error('Insufficient data: minimum 2 players required');
    }

    setupEventListeners();
    filtersController.bindEvents();
    shareController.bindEvents();

    dailyGameController = createDailyGameController({
      allPlayers: state.allPlayers,
      t,
      escapeHtml,
      getLocalizedTeamName,
      onOpenPlayerDetails: (player) => showPlayerDetailsModal({
        player,
        t,
        escapeHtml,
        getLocalizedTeamName,
        normalizeScoreType,
        formatScoreType
      })
    });
    dailyGameController.init();

    dailyGridGameController = createDailyGridGameController({
      allPlayers: state.allPlayers,
      t,
      escapeHtml,
      getLocalizedTeamName
    });
    dailyGridGameController.init();

    setupTabSwitching();
    startGame();
  } catch (err) {
    console.error(err);
  }
}

function normalizePlayers(rawPlayers) {
  return (rawPlayers || [])
    .map((p) => ({
      id: String(p.id ?? p.Id ?? ''),
      name: p.name ?? p.Name ?? t('unknown'),
      team: p.team ?? p.Team ?? t('unknown'),
      total: Number(p.total ?? p.Total ?? 0),
      details: p.details ?? p.Details ?? []
    }))
    .map((p) => {
      const yearRange = computeYearRange(p.details);
      return {
        ...p,
        activityStartYear: yearRange.start,
        activityEndYear: yearRange.end,
        activityYearsLabel: computeActivityYearsLabel(p.details, t)
      };
    })
    .filter((p) => p.id && Number.isFinite(p.total));
}

function getBestStreakFlagsSummary() {
  const flags = state.bestStreakTeams
    .map((teamName) => getTeamFlagEmoji(teamName))
    .filter(Boolean)
    .join(' ');

  return flags || t('noFlags');
}

function setupEventListeners() {
  ui.nextRoundBtn.addEventListener('click', goToNextRound);
  ui.playAgainBtn.addEventListener('click', resetToStart);
  if (ui.languageSelect) {
    ui.languageSelect.addEventListener('change', (event) => {
      updateLanguage(event.target.value);
    });
  }
  if (ui.activityVisibilityToggle) {
    ui.activityVisibilityToggle.addEventListener('change', (event) => {
      updateActivityVisibility(event.target.checked);
    });
  }
  getChoiceButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = Number(btn.dataset.choice);
      evaluateChoice(choice);
    });
  });

  getDetailButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerNum = Number(btn.dataset.player);
      showPlayerDetails(playerNum);
    });
  });
}

function startGame() {
  if (!Array.isArray(state.players) || state.players.length < 2) {
    ui.gameOverSection.classList.add('hidden');
    ui.gamePlaySection.classList.remove('hidden');
    ui.resultSection.classList.remove('hidden');
    ui.resultMessage.textContent = t('gameOver');
    ui.resultMessage.style.color = '#af3f2b';
    ui.resultDetail.textContent = t('notEnoughPlayersForFilters');
    if (ui.nextRoundBtn) ui.nextRoundBtn.classList.add('hidden');
    lockChoices(true);
    return;
  }

  resetRoundState(state);

  ui.gameOverSection.classList.add('hidden');
  ui.gamePlaySection.classList.remove('hidden');
  ui.resultSection.classList.add('hidden');
  if (ui.nextRoundBtn) ui.nextRoundBtn.classList.remove('hidden');
  lockChoices(false);

  prepareRound();
}

function prepareRound() {
  state.roundsPlayed += 1;

  if (!state.currentPlayer || !state.opponentPlayer) {
    state.currentPlayer = getRandomPlayer(state.players);
    state.opponentPlayer = getRandomDifferentPlayer(state.players, state.currentPlayer);
    state.consecutiveRounds = 1;
  }

  if (!state.opponentPlayer) {
    endGame(t('noMoreDuels'));
    return;
  }

  updateScoreboard();
  updateDuelCards();
}

function evaluateChoice(choice) {
  if (!state.currentPlayer || !state.opponentPlayer) {
    return;
  }

  const winner = pickWinner(state.currentPlayer, state.opponentPlayer);
  const isCorrect = isChoiceCorrect(choice, winner, state.currentPlayer, state.opponentPlayer);

  if (isCorrect) {
    state.streak += 1;
    state.currentStreakTeams.push(winner.team);
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    if (state.streak === state.bestStreak) {
      state.bestStreakTeams = [...state.currentStreakTeams];
    }
    ui.resultMessage.textContent = t('resultCorrect');
    ui.resultMessage.style.color = '#1f6a5f';
  } else {
    state.streak = 0;
    state.currentStreakTeams = [];
    ui.resultMessage.textContent = t('resultWrong');
    ui.resultMessage.style.color = '#af3f2b';
  }

  ui.resultDetail.textContent = t('resultDetail', {
    name: winner.name,
    team: getLocalizedTeamName(winner.team, t),
    total: winner.total
  });
  ui.resultSection.classList.remove('hidden');
  updateScoreboard();

  lockChoices(true);
  state.revealedPlayerIds.add(state.currentPlayer.id);
  state.revealedPlayerIds.add(state.opponentPlayer.id);
  updateRevealUI();
}

function goToNextRound() {
  if (!state.currentPlayer || !state.opponentPlayer) {
    return;
  }

  const previousWinner = pickWinner(state.currentPlayer, state.opponentPlayer);
  const next = getNextRoundState({
    currentPlayer: state.currentPlayer,
    opponentPlayer: state.opponentPlayer,
    previousWinner,
    consecutiveRounds: state.consecutiveRounds,
    maxStay: MAX_STAY,
    getRandomOpponent: (player) => getRandomDifferentPlayer(state.players, player)
  });
  state.currentPlayer = next.currentPlayer;
  state.opponentPlayer = next.opponentPlayer;
  state.consecutiveRounds = next.consecutiveRounds;

  if (!state.currentPlayer || !state.opponentPlayer) {
    endGame(t('unableNewDuel'));
    return;
  }

  // Show only the returning player's score (position 1) going into the next round
  state.revealedPlayerIds = new Set([state.currentPlayer.id]);

  ui.resultSection.classList.add('hidden');
  lockChoices(false);
  prepareRound();
}

function lockChoices(lock) {
  getChoiceButtons().forEach((btn) => {
    btn.disabled = lock;
  });
}

function updateScoreboard() {
  ui.roundNumber.textContent = String(state.roundsPlayed);
  ui.currentStreak.textContent = String(state.streak);
  ui.bestStreak.textContent = String(state.bestStreak);
}

function updateDuelCards() {
  ui.player1Name.textContent = state.currentPlayer.name;
  ui.player1Team.textContent = getLocalizedTeamName(state.currentPlayer.team, t);
  ui.player1Years.textContent = getActivityYearsText(state.currentPlayer.details, state.showActivity, t);
  ui.player2Name.textContent = state.opponentPlayer.name;
  ui.player2Team.textContent = getLocalizedTeamName(state.opponentPlayer.team, t);
  ui.player2Years.textContent = getActivityYearsText(state.opponentPlayer.details, state.showActivity, t);

  // Update card backgrounds with team colors
  const { card1, card2, badge1, badge2 } = getDuelCards();
  const team1 = getTeamConfig(state.currentPlayer.team);
  const team2 = getTeamConfig(state.opponentPlayer.team);

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
  const score1Revealed = state.revealedPlayerIds.has(state.currentPlayer.id);
  const score2Revealed = state.revealedPlayerIds.has(state.opponentPlayer.id);

  ui.player1Score.textContent = score1Revealed ? state.currentPlayer.total + ' ' + t('pointsWord') : '';
  ui.player1Score.classList.toggle('hidden', !score1Revealed);

  ui.player2Score.textContent = score2Revealed ? state.opponentPlayer.total + ' ' + t('pointsWord') : '';
  ui.player2Score.classList.toggle('hidden', !score2Revealed);

  if (ui.detailBtn1) ui.detailBtn1.classList.toggle('hidden', !score1Revealed);
  if (ui.detailBtn2) ui.detailBtn2.classList.toggle('hidden', !score2Revealed);
}

function endGame(reason) {
  ui.gamePlaySection.classList.add('hidden');
  ui.gameOverSection.classList.remove('hidden');

  ui.finalStats.innerHTML =
    '<p>' + t('roundsPlayed') + ': <strong>' + state.roundsPlayed + '</strong></p>' +
    '<p>' + t('finalStreak') + ': <strong>' + state.streak + '</strong></p>' +
    '<p>' + t('bestStreak') + ': <strong>' + state.bestStreak + '</strong></p>' +
    '<p>' + reason + '</p>';

}

function resetToStart() {
  startGame();
}

function setupTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panelDuel  = document.getElementById('panel-duel');
  const panelDaily = document.getElementById('panel-daily');
  const panelDailyGrid = document.getElementById('panel-daily-grid');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => {
        const isActive = b.dataset.tab === tab;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
      });
      if (panelDuel)  panelDuel.classList.toggle('hidden',  tab !== 'duel');
      if (panelDaily) panelDaily.classList.toggle('hidden', tab !== 'daily');
      if (panelDailyGrid) panelDailyGrid.classList.toggle('hidden', tab !== 'daily-grid');
    });
  });

  // Update tab labels with current language on first render
  const duelBtn  = document.getElementById('tab-btn-duel');
  const dailyBtn = document.getElementById('tab-btn-daily');
  const dailyGridBtn = document.getElementById('tab-btn-daily-grid');
  if (duelBtn)  duelBtn.textContent  = t('duelTabLabel');
  if (dailyBtn) dailyBtn.textContent = t('dailyTabLabel');
  if (dailyGridBtn) dailyGridBtn.textContent = t('dailyGridTabLabel');
}

// Show player scoring details
function showPlayerDetails(playerNum) {
  const player = playerNum === 1 ? state.currentPlayer : state.opponentPlayer;
  showPlayerDetailsModal({
    player,
    t,
    escapeHtml,
    getLocalizedTeamName,
    normalizeScoreType,
    formatScoreType
  });
}

document.addEventListener('DOMContentLoaded', initGame);
