const DATA_FILE = 'players.json';
const MAX_STAY = 2;

const SUPPORTED_LANGUAGES = ['fr', 'en', 'it', 'cy', 'ga', 'gd'];
const LANGUAGE_STORAGE_KEY = 'sixnations_language';
const ACTIVITY_VISIBILITY_STORAGE_KEY = 'sixnations_show_activity';

const I18N = {
  fr: {
    languageLabel: 'Langue',
    title: 'Scoring Duel',
    subtitle: 'Choisis le joueur qui a marque le plus de points.',
    infoText: 'Matchs inclus : du 01-01-1971 au 09-03-2026. Avant 1992, un essai valait 4 points.',
    round: 'Manche',
    streak: 'Serie',
    bestStreak: 'Meilleure serie',
    choosePlayer: 'Choisir ce joueur',
    details: 'Details',
    nextRound: 'Manche suivante',
    gameOver: 'Partie terminee',
    playAgain: 'Rejouer',
    resultCorrect: 'Correct !',
    resultWrong: 'Faux !',
    resultDetail: '{name} ({team}) a {total} points.',
    noMoreDuels: 'Plus de duel possible avec les donnees actuelles.',
    unableNewDuel: 'Impossible de trouver un nouveau duel.',
    roundsPlayed: 'Manches jouees',
    finalStreak: 'Serie finale',
    activityLabel: 'Activite',
    activityNA: 'Activite : N/A',
    activityHidden: 'Activite : masquee',
    showActivity: 'Afficher activite',
    share: 'Partager',
    copied: 'Copie !',
    copyFailed: 'Echec copie',
    activityVisibleState: 'affichee',
    activityHiddenState: 'masquee',
    bestFlagsLabel: 'nations',
    noFlags: 'aucune',
    shareSummary: 'Six Nations Scoring Duel - manche {round}, serie {streak}, meilleure serie {bestStreak}, activite {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Inconnu',
    playerDetailsTitle: 'Details du joueur',
    totalPoints: 'Total des points',
    scoringHistory: 'Historique des points',
    noScoringHistory: 'Aucun historique detaille disponible',
    close: 'Fermer',
    pointsWord: 'points',
    teamEngland: 'Angleterre',
    teamFrance: 'France',
    teamWales: 'Pays de Galles',
    teamScotland: 'Ecosse',
    teamIreland: 'Irlande',
    teamItaly: 'Italie',
    try: 'essai',
    tries: 'essais',
    penalty: 'penalite',
    penalties: 'penalites',
    conversion: 'transformation',
    conversions: 'transformations',
    dropGoal: 'drop goal',
    dropGoals: 'drop goals'
  },
  en: {
    languageLabel: 'Language',
    title: 'Scoring Duel',
    subtitle: 'Choose the player with the most scored points.',
    infoText: 'Matches included: from 01-01-1971 to 09-03-2026. Before 1992, a try was worth 4 points.',
    round: 'Round',
    streak: 'Streak',
    bestStreak: 'Best Streak',
    choosePlayer: 'Choose this player',
    details: 'Details',
    nextRound: 'Next Round',
    gameOver: 'Game Over',
    playAgain: 'Play Again',
    resultCorrect: 'Correct!',
    resultWrong: 'Wrong!',
    resultDetail: '{name} ({team}) has {total} points.',
    noMoreDuels: 'No more duels possible with current data.',
    unableNewDuel: 'Unable to find a new duel.',
    roundsPlayed: 'Rounds played',
    finalStreak: 'Final streak',
    activityLabel: 'Activity',
    activityNA: 'Activity: N/A',
    activityHidden: 'Activity: hidden',
    showActivity: 'Show activity',
    share: 'Share',
    copied: 'Copied!',
    copyFailed: 'Copy failed',
    activityVisibleState: 'visible',
    activityHiddenState: 'hidden',
    bestFlagsLabel: 'nations',
    noFlags: 'none',
    shareSummary: 'Six Nations Scoring Duel - round {round}, streak {streak}, best streak {bestStreak}, activity {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Unknown',
    playerDetailsTitle: 'Player details',
    totalPoints: 'Total Points',
    scoringHistory: 'Scoring History',
    noScoringHistory: 'No detailed scoring history available',
    close: 'Close',
    pointsWord: 'points',
    teamEngland: 'England',
    teamFrance: 'France',
    teamWales: 'Wales',
    teamScotland: 'Scotland',
    teamIreland: 'Ireland',
    teamItaly: 'Italy',
    try: 'try',
    tries: 'tries',
    penalty: 'penalty',
    penalties: 'penalties',
    conversion: 'conversion',
    conversions: 'conversions',
    dropGoal: 'drop goal',
    dropGoals: 'drop goals'
  },
  it: {
    languageLabel: 'Lingua',
    title: 'Scoring Duel',
    subtitle: 'Scegli il giocatore con piu punti segnati.',
    infoText: 'Partite incluse: dal 01-01-1971 al 09-03-2026. Prima del 1992, una meta valeva 4 punti.',
    round: 'Turno',
    streak: 'Serie',
    bestStreak: 'Serie migliore',
    choosePlayer: 'Scegli questo giocatore',
    details: 'Dettagli',
    nextRound: 'Turno successivo',
    gameOver: 'Partita finita',
    playAgain: 'Rigioca',
    resultCorrect: 'Corretto!',
    resultWrong: 'Sbagliato!',
    resultDetail: '{name} ({team}) ha {total} punti.',
    noMoreDuels: 'Nessun altro duello possibile con i dati correnti.',
    unableNewDuel: 'Impossibile trovare un nuovo duello.',
    roundsPlayed: 'Turni giocati',
    finalStreak: 'Serie finale',
    activityLabel: 'Attivita',
    activityNA: 'Attivita: N/A',
    activityHidden: 'Attivita: nascosta',
    showActivity: 'Mostra attivita',
    share: 'Condividi',
    copied: 'Copiato!',
    copyFailed: 'Copia fallita',
    activityVisibleState: 'visibile',
    activityHiddenState: 'nascosta',
    bestFlagsLabel: 'nazioni',
    noFlags: 'nessuna',
    shareSummary: 'Six Nations Scoring Duel - turno {round}, serie {streak}, serie migliore {bestStreak}, attivita {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Sconosciuto',
    playerDetailsTitle: 'Dettagli giocatore',
    totalPoints: 'Punti totali',
    scoringHistory: 'Storico punteggi',
    noScoringHistory: 'Nessuno storico dettagliato disponibile',
    close: 'Chiudi',
    pointsWord: 'punti',
    teamEngland: 'Inghilterra',
    teamFrance: 'Francia',
    teamWales: 'Galles',
    teamScotland: 'Scozia',
    teamIreland: 'Irlanda',
    teamItaly: 'Italia',
    try: 'meta',
    tries: 'mete',
    penalty: 'calcio di punizione',
    penalties: 'calci di punizione',
    conversion: 'trasformazione',
    conversions: 'trasformazioni',
    dropGoal: 'drop goal',
    dropGoals: 'drop goals'
  },
  cy: {
    languageLabel: 'Iaith',
    title: 'Scoring Duel',
    subtitle: "Dewisa'r chwaraewr gyda'r mwyaf o bwyntiau.",
    infoText: 'Gemau wedi eu cynnwys: o 01-01-1971 i 09-03-2026. Cyn 1992, roedd cais yn werth 4 pwynt.',
    round: 'Rownd',
    streak: 'Cyfres',
    bestStreak: 'Cyfres orau',
    choosePlayer: "Dewis y chwaraewr hwn",
    details: 'Manylion',
    nextRound: 'Rownd nesaf',
    gameOver: 'Gêm drosodd',
    playAgain: 'Chwarae eto',
    resultCorrect: 'Cywir!',
    resultWrong: 'Anghywir!',
    resultDetail: 'Mae gan {name} ({team}) {total} pwynt.',
    noMoreDuels: "Dim mwy o ddeuawdau posibl gyda'r data presennol.",
    unableNewDuel: 'Methu dod o hyd i ddeuawd newydd.',
    roundsPlayed: 'Rowndiau wedi eu chwarae',
    finalStreak: 'Cyfres derfynol',
    activityLabel: 'Gweithgaredd',
    activityNA: 'Gweithgaredd: D/A',
    activityHidden: 'Gweithgaredd: cudd',
    showActivity: 'Dangos gweithgaredd',
    share: 'Rhannu',
    copied: 'Wedi copïo!',
    copyFailed: 'Methodd y copi',
    activityVisibleState: 'gweladwy',
    activityHiddenState: 'cudd',
    bestFlagsLabel: 'cenhedloedd',
    noFlags: 'dim',
    shareSummary: 'Six Nations Scoring Duel - rownd {round}, cyfres {streak}, cyfres orau {bestStreak}, gweithgaredd {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Anhysbys',
    playerDetailsTitle: 'Manylion y chwaraewr',
    totalPoints: 'Cyfanswm pwyntiau',
    scoringHistory: 'Hanes sgorio',
    noScoringHistory: 'Dim hanes sgorio manwl ar gael',
    close: 'Cau',
    pointsWord: 'pwyntiau',
    teamEngland: 'Lloegr',
    teamFrance: 'Ffrainc',
    teamWales: 'Cymru',
    teamScotland: 'Yr Alban',
    teamIreland: 'Iwerddon',
    teamItaly: 'Yr Eidal',
    try: 'cais',
    tries: 'ceisiadau',
    penalty: 'cosb',
    penalties: 'cosbau',
    conversion: 'trosi',
    conversions: 'trosiadau',
    dropGoal: 'gôl ostwng',
    dropGoals: 'goliau ostwng'
  },
  ga: {
    languageLabel: 'Teanga',
    title: 'Scoring Duel',
    subtitle: 'Roghnaigh an t-imreoir leis na pointi is mo.',
    infoText: 'Cluichi san aireamh: o 01-01-1971 go 09-03-2026. Roimh 1992, bhi triail ar luach 4 phointe.',
    round: 'Babhta',
    streak: 'Sraith',
    bestStreak: 'An tsraith is fearr',
    choosePlayer: 'Roghnaigh an t-imreoir seo',
    details: 'Sonrai',
    nextRound: 'An chead bhabhta eile',
    gameOver: 'Cluiche thart',
    playAgain: 'Imir aris',
    resultCorrect: 'Ceart!',
    resultWrong: 'Micheart!',
    resultDetail: 'Ta {total} pointe ag {name} ({team}).',
    noMoreDuels: 'Níl aon dulaiochta eile indanta leis na sonrai reatha.',
    unableNewDuel: 'Niorbh fhéidir duliocht nua a aimsiu.',
    roundsPlayed: 'Babhtai imeartha',
    finalStreak: 'Sraith dheiridh',
    activityLabel: 'Gniomhaiocht',
    activityNA: 'Gniomhaiocht: N/A',
    activityHidden: 'Gniomhaiocht: folaithe',
    showActivity: 'Taispeain gniomhaiocht',
    share: 'Roinn',
    copied: 'Coipealaithe!',
    copyFailed: 'Theip ar an gcoipeail',
    activityVisibleState: 'le feiceail',
    activityHiddenState: 'folaithe',
    bestFlagsLabel: 'naisiuin',
    noFlags: 'gan cheann',
    shareSummary: 'Six Nations Scoring Duel - babhta {round}, sraith {streak}, an tsraith is fearr {bestStreak}, gniomhaiocht {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Anaithnid',
    playerDetailsTitle: 'Sonrai an imreora',
    totalPoints: 'Pointi iomlani',
    scoringHistory: 'Stair scoralai',
    noScoringHistory: 'Níl stair mionsonraithe scoralai ar fail',
    close: 'Dun',
    pointsWord: 'pointi',
    teamEngland: 'Sasana',
    teamFrance: 'An Fhrainc',
    teamWales: 'An Bhreatain Bheag',
    teamScotland: 'Albain',
    teamIreland: 'Eire',
    teamItaly: 'An Iodail',
    try: 'triail',
    tries: 'trialacha',
    penalty: 'pionos',
    penalties: 'pionois',
    conversion: 'tiontu',
    conversions: 'tiontaithe',
    dropGoal: 'cic tite',
    dropGoals: 'ciceanna tite'
  },
  gd: {
    languageLabel: 'Canan',
    title: 'Scoring Duel',
    subtitle: 'Tagh an cluicheadair leis na puingean as motha.',
    infoText: 'Geamannan air an toirt a-steach: bho 01-01-1971 gu 09-03-2026. Ro 1992, bha luach 4 puingean air try.',
    round: 'Cuairt',
    streak: 'Sreath',
    bestStreak: 'An t-sreath as fhearr',
    choosePlayer: 'Tagh an cluicheadair seo',
    details: 'Mion-fhiosrachadh',
    nextRound: 'An ath chuairt',
    gameOver: 'Geam seachad',
    playAgain: 'Cluich a-rithist',
    resultCorrect: 'Ceart!',
    resultWrong: 'Cearr!',
    resultDetail: 'Tha {total} puing aig {name} ({team}).',
    noMoreDuels: 'Chan eil duel sam bith eile comasach leis an data làithreach.',
    unableNewDuel: 'Cha b urrainn duel ur a lorg.',
    roundsPlayed: 'Cuairtean air an cluich',
    finalStreak: 'Sreath dheireannach',
    activityLabel: 'Gniomhachd',
    activityNA: 'Gniomhachd: N/A',
    activityHidden: 'Gniomhachd: falaichte',
    showActivity: 'Seall gniomhachd',
    share: 'Co-roinn',
    copied: 'Air a chopaigeadh!',
    copyFailed: 'Dh fhàillig an copaidh',
    activityVisibleState: 'ri fhaicinn',
    activityHiddenState: 'falaichte',
    bestFlagsLabel: 'duthchannan',
    noFlags: 'chan eil gin',
    shareSummary: 'Six Nations Scoring Duel - cuairt {round}, sreath {streak}, an t-sreath as fhearr {bestStreak}, gniomhachd {activity}, {bestFlagsLabel} {flags}.',
    unknown: 'Neo-aithnichte',
    playerDetailsTitle: 'Mion-fhiosrachadh cluicheadair',
    totalPoints: 'Puingean iomlan',
    scoringHistory: 'Eachdraidh sgoraidh',
    noScoringHistory: 'Chan eil eachdraidh sgoraidh mhionaideach ri fhaighinn',
    close: 'Dun',
    pointsWord: 'puingean',
    teamEngland: 'Sasainn',
    teamFrance: 'An Fhraing',
    teamWales: 'A Chuimrigh',
    teamScotland: 'Alba',
    teamIreland: 'Eirinn',
    teamItaly: 'An Eadailt',
    try: 'try',
    tries: 'trys',
    penalty: 'peanas',
    penalties: 'peanasan',
    conversion: 'tionndadh',
    conversions: 'tionndaidhean',
    dropGoal: 'drop goal',
    dropGoals: 'drop goals'
  }
};

// Team emblems and colors
const TEAM_CONFIG = {
  'England': {
    logo: 'assets/flags/gb-eng.png',
    color: '#ffffff',
    accent: '#d71920'
  },
  'France': {
    logo: 'assets/flags/fr.png',
    color: '#0055a4',
    accent: '#ef4135'
  },
  'Wales': {
    logo: 'assets/flags/gb-wls.png',
    color: '#d71920',
    accent: '#ffffff'
  },
  'Scotland': {
    logo: 'assets/flags/gb-sct.png',
    color: '#00337f',
    accent: '#ffffff'
  },
  'Ireland': {
    logo: 'assets/flags/ie.png',
    color: '#169b62',
    accent: '#ffffff'
  },
  'Italy': {
    logo: 'assets/flags/it.png',
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
let currentLanguage = 'fr';
let showActivity = true;
let shareButtonFeedbackTimeout = null;
let currentStreakTeams = [];
let bestStreakTeams = [];

const TEAM_FLAG_EMOJIS = {
  England: '🏴 ENG',
  France: '🇫🇷',
  Wales: '🏴 WAL',
  Scotland: '🏴 SCO',
  Ireland: '🇮🇪',
  Italy: '🇮🇹'
};

const ui = {
  gamePlaySection: document.getElementById('game-play'),
  gameOverSection: document.getElementById('game-over'),
  resultSection: document.getElementById('result-section'),
  nextRoundBtn: document.getElementById('next-round'),
  playAgainBtn: document.getElementById('play-again'),
  player1Score: document.getElementById('player1-score'),
  player2Score: document.getElementById('player2-score'),
  player1Years: document.getElementById('player1-years'),
  player2Years: document.getElementById('player2-years'),
  roundNumber: document.getElementById('round-number'),
  currentStreak: document.getElementById('current-streak'),
  bestStreak: document.getElementById('best-streak'),
  player1Name: document.getElementById('player1-name'),
  player1Team: document.getElementById('player1-team'),
  player2Name: document.getElementById('player2-name'),
  player2Team: document.getElementById('player2-team'),
  resultMessage: document.getElementById('result-message'),
  resultDetail: document.getElementById('result-detail'),
  finalStats: document.getElementById('final-stats'),
  detailBtn1: document.querySelector('.details[data-player="1"]'),
  detailBtn2: document.querySelector('.details[data-player="2"]'),
  languageSelect: document.getElementById('language-select'),
  currentLanguageFlag: document.getElementById('current-language-flag'),
  activityVisibilityToggle: document.getElementById('activity-visibility-toggle'),
  shareScoreBtn: document.getElementById('share-score')
};

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
  const dict = I18N[currentLanguage] || I18N.en;
  let message = dict[key] ?? I18N.en[key] ?? key;
  Object.entries(replacements).forEach(([token, value]) => {
    message = message.replaceAll(`{${token}}`, String(value));
  });
  return message;
}

function getLanguageFlagConfig(language) {
  const flagConfig = {
    fr: { src: 'assets/flags/fr.png', alt: 'Francais' },
    en: { src: 'assets/flags/gb-eng.png', alt: 'English' },
    it: { src: 'assets/flags/it.png', alt: 'Italiano' },
    cy: { src: 'assets/flags/gb-wls.png', alt: 'Cymraeg' },
    ga: { src: 'assets/flags/ie.png', alt: 'Gaeilge' },
    gd: { src: 'assets/flags/gb-sct.png', alt: 'Gaidhlig' }
  };

  return flagConfig[language] || flagConfig.fr;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage;
  if (ui.languageSelect) ui.languageSelect.value = currentLanguage;
  if (ui.currentLanguageFlag) {
    const flag = getLanguageFlagConfig(currentLanguage);
    ui.currentLanguageFlag.src = flag.src;
    ui.currentLanguageFlag.alt = flag.alt;
    ui.currentLanguageFlag.title = flag.alt;
  }

  const byId = (id) => document.getElementById(id);

  const languageLabel = byId('language-label');
  if (languageLabel) languageLabel.textContent = t('languageLabel');

  const title = byId('title-text');
  if (title) title.textContent = t('title');

  const subtitle = byId('subtitle-text');
  if (subtitle) subtitle.textContent = t('subtitle');

  const infoText = byId('info-text');
  if (infoText) infoText.textContent = t('infoText');

  const labelRound = byId('label-round');
  if (labelRound) labelRound.textContent = t('round');

  const labelStreak = byId('label-streak');
  if (labelStreak) labelStreak.textContent = t('streak');

  const labelBestStreak = byId('label-best-streak');
  if (labelBestStreak) labelBestStreak.textContent = t('bestStreak');

  const activityToggleLabel = byId('activity-toggle-label');
  if (activityToggleLabel) activityToggleLabel.textContent = t('showActivity');
  if (ui.activityVisibilityToggle) {
    ui.activityVisibilityToggle.checked = showActivity;
    ui.activityVisibilityToggle.setAttribute('aria-label', t('showActivity'));
  }

  const choose1 = byId('choose-player-1');
  if (choose1) choose1.textContent = t('choosePlayer');

  const choose2 = byId('choose-player-2');
  if (choose2) choose2.textContent = t('choosePlayer');

  if (ui.detailBtn1) ui.detailBtn1.textContent = t('details');
  if (ui.detailBtn2) ui.detailBtn2.textContent = t('details');
  if (ui.nextRoundBtn) ui.nextRoundBtn.textContent = t('nextRound');
  if (ui.playAgainBtn) ui.playAgainBtn.textContent = t('playAgain');
  if (ui.shareScoreBtn) ui.shareScoreBtn.textContent = t('share');

  const gameOverTitle = byId('game-over-title');
  if (gameOverTitle) gameOverTitle.textContent = t('gameOver');

  if (currentPlayer && opponentPlayer) {
    ui.player1Team.textContent = getLocalizedTeamName(currentPlayer.team);
    ui.player2Team.textContent = getLocalizedTeamName(opponentPlayer.team);
    ui.player1Years.textContent = getActivityYearsText(currentPlayer.details);
    ui.player2Years.textContent = getActivityYearsText(opponentPlayer.details);
    updateRevealUI();
  }
}

function updateLanguage(language) {
  const nextLanguage = SUPPORTED_LANGUAGES.includes(language) ? language : 'fr';
  currentLanguage = nextLanguage;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  applyTranslations();
}

function updateActivityVisibility(isVisible) {
  const previousVisibility = showActivity;
  showActivity = Boolean(isVisible);
  localStorage.setItem(ACTIVITY_VISIBILITY_STORAGE_KEY, String(showActivity));

  // Any change in activity visibility resets the game to keep scoring comparable.
  if (previousVisibility !== showActivity) {
    resetToStart();
    return;
  }

  if (currentPlayer && opponentPlayer) {
    ui.player1Years.textContent = getActivityYearsText(currentPlayer.details);
    ui.player2Years.textContent = getActivityYearsText(opponentPlayer.details);
  }
}

function buildShareSummary() {
  return t('shareSummary', {
    round: roundsPlayed,
    streak: streak,
    bestStreak: bestStreak,
    activity: showActivity ? t('activityVisibleState') : t('activityHiddenState'),
    bestFlagsLabel: t('bestFlagsLabel'),
    flags: getBestStreakFlagsSummary()
  });
}

function setShareButtonFeedback(labelKey) {
  if (!ui.shareScoreBtn) {
    return;
  }

  ui.shareScoreBtn.textContent = t(labelKey);
  if (shareButtonFeedbackTimeout) {
    clearTimeout(shareButtonFeedbackTimeout);
  }

  shareButtonFeedbackTimeout = setTimeout(() => {
    ui.shareScoreBtn.textContent = t('share');
    shareButtonFeedbackTimeout = null;
  }, 1600);
}

async function shareCurrentScore() {
  const summary = buildShareSummary();

  try {
    await navigator.clipboard.writeText(summary);
    setShareButtonFeedback('copied');
  } catch (error) {
    console.error(error);
    setShareButtonFeedback('copyFailed');
  }
}

async function initGame() {
  try {
    currentLanguage = resolveInitialLanguage();
    showActivity = resolveInitialActivityVisibility();
    applyTranslations();

    const response = await fetch(DATA_FILE, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load players: ' + response.status);
    }

    const rawPlayers = await response.json();
    players = normalizePlayers(rawPlayers);

    if (!Array.isArray(players) || players.length < 2) {
      throw new Error('Insufficient data: minimum 2 players required');
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
      name: p.name ?? p.Name ?? t('unknown'),
      team: p.team ?? p.Team ?? t('unknown'),
      total: Number(p.total ?? p.Total ?? 0),
      details: p.details ?? p.Details ?? []
    }))
    .map((p) => ({
      ...p,
      activityYearsLabel: computeActivityYearsLabel(p.details)
    }))
    .filter((p) => p.id && Number.isFinite(p.total));
}

function getTeamTranslationKey(teamName) {
  const normalized = String(teamName || '').trim().toLowerCase();
  const aliasMap = {
    england: 'teamEngland',
    france: 'teamFrance',
    wales: 'teamWales',
    scotland: 'teamScotland',
    ireland: 'teamIreland',
    italy: 'teamItaly'
  };

  if (aliasMap[normalized]) {
    return aliasMap[normalized];
  }

  const matchedKey = Object.keys(aliasMap).find((key) => normalized.includes(key));
  return matchedKey ? aliasMap[matchedKey] : null;
}

function getLocalizedTeamName(teamName) {
  const translationKey = getTeamTranslationKey(teamName);
  return translationKey ? t(translationKey) : String(teamName || t('unknown'));
}

function getCanonicalTeamName(teamName) {
  const normalized = String(teamName || '').trim().toLowerCase();
  const aliasMap = {
    england: 'England',
    france: 'France',
    wales: 'Wales',
    scotland: 'Scotland',
    ireland: 'Ireland',
    italy: 'Italy'
  };

  if (aliasMap[normalized]) {
    return aliasMap[normalized];
  }

  const matchedKey = Object.keys(aliasMap).find((key) => normalized.includes(key));
  return matchedKey ? aliasMap[matchedKey] : null;
}

function getTeamFlagEmoji(teamName) {
  const canonicalTeamName = getCanonicalTeamName(teamName);
  return canonicalTeamName ? TEAM_FLAG_EMOJIS[canonicalTeamName] : null;
}

function getBestStreakFlagsSummary() {
  const flags = bestStreakTeams
    .map((teamName) => getTeamFlagEmoji(teamName))
    .filter(Boolean)
    .join(' ');

  return flags || t('noFlags');
}

function setupEventListeners() {
  ui.nextRoundBtn.addEventListener('click', goToNextRound);
  ui.playAgainBtn.addEventListener('click', resetToStart);
  if (ui.shareScoreBtn) {
    ui.shareScoreBtn.addEventListener('click', () => {
      shareCurrentScore();
    });
  }
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
  currentStreakTeams = [];
  bestStreakTeams = [];

  ui.gameOverSection.classList.add('hidden');
  ui.gamePlaySection.classList.remove('hidden');
  ui.resultSection.classList.add('hidden');
  lockChoices(false);

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
    endGame(t('noMoreDuels'));
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
    currentStreakTeams.push(winner.team);
    bestStreak = Math.max(bestStreak, streak);
    if (streak === bestStreak) {
      bestStreakTeams = [...currentStreakTeams];
    }
    ui.resultMessage.textContent = t('resultCorrect');
    ui.resultMessage.style.color = '#1f6a5f';
  } else {
    streak = 0;
    currentStreakTeams = [];
    ui.resultMessage.textContent = t('resultWrong');
    ui.resultMessage.style.color = '#af3f2b';
  }

  ui.resultDetail.textContent = t('resultDetail', {
    name: winner.name,
    team: getLocalizedTeamName(winner.team),
    total: winner.total
  });
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
      // Winner reached max stay, switch anchor to the previous challenger so only one player changes.
      currentPlayer = opponentPlayer;
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
    endGame(t('unableNewDuel'));
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
  ui.player1Team.textContent = getLocalizedTeamName(currentPlayer.team);
  ui.player1Years.textContent = getActivityYearsText(currentPlayer.details);
  ui.player2Name.textContent = opponentPlayer.name;
  ui.player2Team.textContent = getLocalizedTeamName(opponentPlayer.team);
  ui.player2Years.textContent = getActivityYearsText(opponentPlayer.details);

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

  ui.player1Score.textContent = score1Revealed ? currentPlayer.total + ' ' + t('pointsWord') : '';
  ui.player1Score.classList.toggle('hidden', !score1Revealed);

  ui.player2Score.textContent = score2Revealed ? opponentPlayer.total + ' ' + t('pointsWord') : '';
  ui.player2Score.classList.toggle('hidden', !score2Revealed);

  if (ui.detailBtn1) ui.detailBtn1.classList.toggle('hidden', !score1Revealed);
  if (ui.detailBtn2) ui.detailBtn2.classList.toggle('hidden', !score2Revealed);
}

function computeActivityYearsLabel(detailsInput) {
  const details = Array.isArray(detailsInput) ? detailsInput : [];
  const years = details
    .map((d) => String(d.date || d.Date || '').slice(0, 4))
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year) && year >= 1883 && year <= 2100);

  if (!years.length) {
    return t('activityNA');
  }

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  return minYear === maxYear
    ? t('activityLabel') + ': ' + minYear
    : t('activityLabel') + ': ' + minYear + ' - ' + maxYear;
}

function getActivityYearsText(detailsInput) {
  if (!showActivity) {
    return t('activityHidden');
  }
  return computeActivityYearsLabel(detailsInput);
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
    '<p>' + t('roundsPlayed') + ': <strong>' + roundsPlayed + '</strong></p>' +
    '<p>' + t('finalStreak') + ': <strong>' + streak + '</strong></p>' +
    '<p>' + t('bestStreak') + ': <strong>' + bestStreak + '</strong></p>' +
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

function normalizeScoreType(type) {
  const raw = String(type || 'Unknown').trim().toLowerCase();
  if (!raw) return 'unknown';

  const compact = raw.replace(/[^a-z]/g, '');
  const aliases = {
    con: 'conversion',
    conversion: 'conversion',
    conversions: 'conversion',
    pen: 'penalty',
    penalty: 'penalty',
    penalties: 'penalty',
    dropgoal: 'drop goal',
    dropgoals: 'drop goal',
    dg: 'drop goal',
    try: 'try',
    tries: 'try'
  };

  return aliases[compact] || raw;
}

function formatScoreType(type, count) {
  const normalized = normalizeScoreType(type);
  const plural = count > 1;

  let label = normalized;
  if (normalized === 'try') label = plural ? t('tries') : t('try');
  else if (normalized === 'penalty') label = plural ? t('penalties') : t('penalty');
  else if (normalized === 'conversion') label = plural ? t('conversions') : t('conversion');
  else if (normalized === 'drop goal') label = plural ? t('dropGoals') : t('dropGoal');
  else if (plural) label = normalized + 's';

  return plural ? count + ' ' + label : label;
}

// Show player scoring details
function showPlayerDetails(playerNum) {
  const player = playerNum === 1 ? currentPlayer : opponentPlayer;
  if (!player) return;

  let detailsHTML = `
    <div class="player-details-modal">
      <div class="modal-content">
        <h3>${escapeHtml(t('playerDetailsTitle'))}: ${escapeHtml(player.name)} (${escapeHtml(getLocalizedTeamName(player.team))})</h3>
        <p><strong>${escapeHtml(t('totalPoints'))}:</strong> ${player.total}</p>
  `;
  
  if (player.details && Array.isArray(player.details) && player.details.length > 0) {
    // Group by date, aggregate points and count types
    const byDate = new Map();
    player.details.forEach(d => {
      const date = d.date || d.Date || 'N/A';
      const points = Number(d.points || d.Points || 0);
      const type = normalizeScoreType(d.type || d.Type || 'Unknown');
      if (!byDate.has(date)) byDate.set(date, { total: 0, types: new Map() });
      const entry = byDate.get(date);
      entry.total += points;
      entry.types.set(type, (entry.types.get(type) || 0) + 1);
    });

    detailsHTML += '<h4>' + escapeHtml(t('scoringHistory')) + ':</h4><ul>';
    byDate.forEach((entry, date) => {
      const typeSummary = Array.from(entry.types.entries())
        .map(([type, count]) => formatScoreType(type, count))
        .join(', ');
      detailsHTML += `<li>${escapeHtml(date)}: ${entry.total} ${escapeHtml(t('pointsWord'))} (${escapeHtml(typeSummary)})</li>`;
    });
    detailsHTML += '</ul>';
  } else {
    detailsHTML += '<p><em>' + escapeHtml(t('noScoringHistory')) + '</em></p>';
  }
  
  detailsHTML += `
        <button class="btn primary close-modal">${escapeHtml(t('close'))}</button>
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
