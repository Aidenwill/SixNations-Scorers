import { getLanguageFlagConfig } from './i18n.js';

/**
 * Apply all static UI label translations that don't depend on game state.
 * Call this whenever the language changes.
 */
export function applyStaticLabels(ui, language, showActivity, t) {
  document.documentElement.lang = language;
  if (ui.languageSelect) ui.languageSelect.value = language;
  if (ui.currentLanguageFlag) {
    const flag = getLanguageFlagConfig(language);
    ui.currentLanguageFlag.src = flag.src;
    ui.currentLanguageFlag.alt = flag.alt;
    ui.currentLanguageFlag.title = flag.alt;
  }

  const idMap = [
    ['language-label', 'languageLabel'],
    ['title-text', 'title'],
    ['subtitle-text', 'subtitle'],
    ['info-text', 'infoText'],
    ['label-round', 'round'],
    ['label-streak', 'streak'],
    ['label-best-streak', 'bestStreak'],
    ['game-over-title', 'gameOver'],
    ['choose-player-1', 'choosePlayer'],
    ['choose-player-2', 'choosePlayer'],
    ['activity-toggle-label', 'showActivity']
  ];
  idMap.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  });

  if (ui.activityVisibilityToggle) {
    ui.activityVisibilityToggle.checked = showActivity;
    ui.activityVisibilityToggle.setAttribute('aria-label', t('showActivity'));
  }
  if (ui.detailBtn1) ui.detailBtn1.textContent = t('details');
  if (ui.detailBtn2) ui.detailBtn2.textContent = t('details');
  if (ui.nextRoundBtn) ui.nextRoundBtn.textContent = t('nextRound');
  if (ui.playAgainBtn) ui.playAgainBtn.textContent = t('playAgain');
  if (ui.shareScoreBtn) ui.shareScoreBtn.textContent = t('share');

  const tabDuel  = document.getElementById('tab-btn-duel');
  const tabDaily = document.getElementById('tab-btn-daily');
  const tabDailyGrid = document.getElementById('tab-btn-daily-grid');
  if (tabDuel)  tabDuel.textContent  = t('duelTabLabel');
  if (tabDaily) tabDaily.textContent = t('dailyTabLabel');
  if (tabDailyGrid) tabDailyGrid.textContent = t('dailyGridTabLabel');
}

export function createUIBindings(doc = document) {
  return {
    gamePlaySection: doc.getElementById('game-play'),
    gameOverSection: doc.getElementById('game-over'),
    resultSection: doc.getElementById('result-section'),
    nextRoundBtn: doc.getElementById('next-round'),
    playAgainBtn: doc.getElementById('play-again'),
    player1Score: doc.getElementById('player1-score'),
    player2Score: doc.getElementById('player2-score'),
    player1Years: doc.getElementById('player1-years'),
    player2Years: doc.getElementById('player2-years'),
    roundNumber: doc.getElementById('round-number'),
    currentStreak: doc.getElementById('current-streak'),
    bestStreak: doc.getElementById('best-streak'),
    player1Name: doc.getElementById('player1-name'),
    player1Team: doc.getElementById('player1-team'),
    player2Name: doc.getElementById('player2-name'),
    player2Team: doc.getElementById('player2-team'),
    resultMessage: doc.getElementById('result-message'),
    resultDetail: doc.getElementById('result-detail'),
    finalStats: doc.getElementById('final-stats'),
    detailBtn1: doc.querySelector('.details[data-player="1"]'),
    detailBtn2: doc.querySelector('.details[data-player="2"]'),
    languageSelect: doc.getElementById('language-select'),
    currentLanguageFlag: doc.getElementById('current-language-flag'),
    activityVisibilityToggle: doc.getElementById('activity-visibility-toggle'),
    shareScoreBtn: doc.getElementById('share-score'),
    filtersPanel: doc.getElementById('filters-panel'),
    filtersToggleBtn: doc.getElementById('filters-toggle'),
    filtersTitle: doc.getElementById('filters-title'),
    filtersSummary: doc.getElementById('filters-summary'),
    filterYearsLabel: doc.getElementById('filter-years-label'),
    filterYearStartLabel: doc.getElementById('filter-year-start-label'),
    filterYearEndLabel: doc.getElementById('filter-year-end-label'),
    filterTeamsLabel: doc.getElementById('filter-teams-label'),
    yearStartInput: doc.getElementById('year-start'),
    yearEndInput: doc.getElementById('year-end'),
    yearStartValue: doc.getElementById('year-start-value'),
    yearEndValue: doc.getElementById('year-end-value'),
    teamsAllBtn: doc.getElementById('teams-all'),
    filtersResetBtn: doc.getElementById('filters-reset'),
    teamFiltersContainer: doc.getElementById('team-filters')
  };
}

export function queryById(id, doc = document) {
  return doc.getElementById(id);
}

export function getChoiceButtons(doc = document) {
  return Array.from(doc.querySelectorAll('.choice'));
}

export function getDetailButtons(doc = document) {
  return Array.from(doc.querySelectorAll('.details'));
}

export function getDuelCards(doc = document) {
  return {
    card1: doc.querySelector('.card:first-of-type'),
    card2: doc.querySelector('.card:last-of-type'),
    badge1: doc.getElementById('badge1'),
    badge2: doc.getElementById('badge2')
  };
}
