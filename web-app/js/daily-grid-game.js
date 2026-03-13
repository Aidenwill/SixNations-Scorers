import { getCanonicalTeamName } from './teams.js';

const GRID_SIZE = 3;
const DAILY_GRID_DATE_KEY = 'sixnations_daily_grid_date';
const DAILY_GRID_PLACEMENTS_KEY = 'sixnations_daily_grid_placements';

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed) {
  let state = (seed >>> 0) || 1;
  return function rng() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalizeScoreType(typeRaw) {
  const t = String(typeRaw || '').toLowerCase().trim();
  if (t === 'try' || t === 'tries') return 'try';
  if (t === 'drop' || t === 'drop goal' || t === 'dropgoal' || t === 'dg') return 'dropGoal';
  if (t === 'conversion' || t === 'con') return 'conversion';
  if (t === 'penalty' || t === 'pen' || t === 'penalite') return 'penalty';
  return t;
}

function getScoreTypeCount(player, scoreType) {
  const details = Array.isArray(player?.details) ? player.details : [];
  return details.reduce((sum, entry) => {
    const rawType = entry?.type ?? entry?.Type;
    const normalizedType = normalizeScoreType(rawType);
    if (normalizedType !== scoreType) return sum;

    const countRaw = entry?.count ?? entry?.Count;
    const parsedCount = Number(countRaw);
    const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
    return sum + count;
  }, 0);
}

function getRuleThresholdCount(players, testFn) {
  const n = players.filter(testFn).length;
  return n >= 5 && n <= players.length - 3;
}

export function evaluateRule(player, rule) {
  const start = Number(player.activityStartYear);
  const end = Number(player.activityEndYear);
  const total = Number(player.total);

  if (rule.kind === 'team') {
    const team = getCanonicalTeamName(player.team) || String(player.team || '');
    return team === rule.team;
  }
  if (rule.kind === 'startBefore') {
    return Number.isFinite(start) && start < rule.year;
  }
  if (rule.kind === 'startAfter') {
    return Number.isFinite(start) && start >= rule.year;
  }
  if (rule.kind === 'pointsAtLeast') {
    return Number.isFinite(total) && total >= rule.value;
  }
  if (rule.kind === 'pointsAtMost') {
    return Number.isFinite(total) && total <= rule.value;
  }
  if (rule.kind === 'endBefore') {
    return Number.isFinite(end) && end < rule.year;
  }
  if (rule.kind === 'endAfter') {
    return Number.isFinite(end) && end >= rule.year;
  }
  if (rule.kind === 'scoreTypeAtLeast') {
    return getScoreTypeCount(player, rule.scoreType) >= rule.value;
  }
  return false;
}

function buildRuleCandidates(players) {
  const rules = [];
  const seen = new Set();

  function pushRule(rule, testFn) {
    if (!rule || !rule.id || seen.has(rule.id)) return;
    if (!getRuleThresholdCount(players, testFn)) return;
    seen.add(rule.id);
    rules.push(rule);
  }

  const teams = Array.from(
    new Set(
      players
        .map((p) => getCanonicalTeamName(p.team) || String(p.team || ''))
        .filter(Boolean)
    )
  );

  teams.forEach((team) => {
    pushRule(
      { id: `team:${team}`, kind: 'team', team },
      (p) => evaluateRule(p, { kind: 'team', team })
    );
  });

  [1985, 1990, 1995, 2000].forEach((year) => {
    pushRule(
      { id: `startBefore:${year}`, kind: 'startBefore', year },
      (p) => evaluateRule(p, { kind: 'startBefore', year })
    );
    pushRule(
      { id: `startAfter:${year}`, kind: 'startAfter', year },
      (p) => evaluateRule(p, { kind: 'startAfter', year })
    );
  });

  [80, 120, 160, 220].forEach((value) => {
    pushRule(
      { id: `pointsAtLeast:${value}`, kind: 'pointsAtLeast', value },
      (p) => evaluateRule(p, { kind: 'pointsAtLeast', value })
    );
    pushRule(
      { id: `pointsAtMost:${value}`, kind: 'pointsAtMost', value },
      (p) => evaluateRule(p, { kind: 'pointsAtMost', value })
    );
  });

  [1995, 2000, 2005, 2010].forEach((year) => {
    pushRule(
      { id: `endBefore:${year}`, kind: 'endBefore', year },
      (p) => evaluateRule(p, { kind: 'endBefore', year })
    );
    pushRule(
      { id: `endAfter:${year}`, kind: 'endAfter', year },
      (p) => evaluateRule(p, { kind: 'endAfter', year })
    );
  });

  [
    { scoreType: 'try', value: 1 },
    { scoreType: 'try', value: 5 },
    { scoreType: 'dropGoal', value: 1 },
    { scoreType: 'conversion', value: 1 }
  ].forEach(({ scoreType, value }) => {
    pushRule(
      { id: `scoreTypeAtLeast:${scoreType}:${value}`, kind: 'scoreTypeAtLeast', scoreType, value },
      (p) => evaluateRule(p, { kind: 'scoreTypeAtLeast', scoreType, value })
    );
  });

  return rules;
}

function pickDistinct(rules, count, rng) {
  const pool = [...rules];
  const picked = [];
  while (pool.length > 0 && picked.length < count) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

export function hasUniqueAssignment(candidatesByCell) {
  const ordered = [...candidatesByCell]
    .map((ids, idx) => ({ idx, ids: [...new Set(ids)] }))
    .sort((a, b) => a.ids.length - b.ids.length);

  if (ordered.some((entry) => entry.ids.length === 0)) return false;

  const used = new Set();

  function dfs(pos) {
    if (pos === ordered.length) return true;
    const { ids } = ordered[pos];
    for (const id of ids) {
      if (used.has(id)) continue;
      used.add(id);
      if (dfs(pos + 1)) return true;
      used.delete(id);
    }
    return false;
  }

  return dfs(0);
}

export function generateDailyGridDefinition(players, dateStr) {
  if (!Array.isArray(players) || players.length < 15) return null;

  const rules = buildRuleCandidates(players);
  if (rules.length < 8) return null;

  const rng = createSeededRng(hashString(dateStr));

  for (let attempt = 0; attempt < 700; attempt++) {
    const rows = pickDistinct(rules, GRID_SIZE, rng);
    const rowIds = new Set(rows.map((r) => r.id));
    const colsPool = rules.filter((rule) => !rowIds.has(rule.id));
    const cols = pickDistinct(colsPool, GRID_SIZE, rng);
    if (rows.length < GRID_SIZE || cols.length < GRID_SIZE) continue;

    const candidatesByCell = [];
    let hasEmptyCell = false;

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const rowRule = rows[r];
        const colRule = cols[c];
        const ids = players
          .filter((p) => evaluateRule(p, rowRule) && evaluateRule(p, colRule))
          .map((p) => p.id);

        candidatesByCell.push(ids);
        if (ids.length === 0) {
          hasEmptyCell = true;
          break;
        }
      }
      if (hasEmptyCell) break;
    }

    if (hasEmptyCell) continue;
    if (!hasUniqueAssignment(candidatesByCell)) continue;

    return { rows, cols };
  }

  return null;
}

function getCellKey(r, c) {
  return `${r}-${c}`;
}

export function buildRuleLabel(rule, t, getLocalizedTeamName) {
  if (rule.kind === 'team') {
    return t('dailyGridRuleTeam', { team: getLocalizedTeamName(rule.team, t) });
  }
  if (rule.kind === 'startBefore') return t('dailyGridRuleStartBefore', { year: rule.year });
  if (rule.kind === 'startAfter') return t('dailyGridRuleStartAfter', { year: rule.year });
  if (rule.kind === 'pointsAtLeast') return t('dailyGridRulePointsAtLeast', { value: rule.value });
  if (rule.kind === 'pointsAtMost') return t('dailyGridRulePointsAtMost', { value: rule.value });
  if (rule.kind === 'endBefore') return t('dailyGridRuleEndBefore', { year: rule.year });
  if (rule.kind === 'endAfter') return t('dailyGridRuleEndAfter', { year: rule.year });
  if (rule.kind === 'scoreTypeAtLeast') {
    if (rule.scoreType === 'try') return t('dailyGridRuleTryAtLeast', { value: rule.value });
    if (rule.scoreType === 'dropGoal') return t('dailyGridRuleDropGoalAtLeast', { value: rule.value });
    if (rule.scoreType === 'conversion') return t('dailyGridRuleConversionAtLeast', { value: rule.value });
    if (rule.scoreType === 'penalty') return t('dailyGridRulePenaltyAtLeast', { value: rule.value });
  }
  return rule.id;
}

export function createDailyGridGameController({ allPlayers, t, escapeHtml, getLocalizedTeamName }) {
  let todayStr = '';
  let definition = null;
  let selectedCell = null;
  let placements = {};
  let suggestions = [];
  let activeSuggestionIndex = -1;
  let shareTimeout = null;

  let el = {};

  function init() {
    el = {
      title: document.getElementById('daily-grid-title'),
      subtitle: document.getElementById('daily-grid-subtitle'),
      instructions: document.getElementById('daily-grid-instructions'),
      progress: document.getElementById('daily-grid-progress'),
      selectedRule: document.getElementById('daily-grid-selected-rule'),
      message: document.getElementById('daily-grid-message'),
      board: document.getElementById('daily-grid-board'),
      searchInput: document.getElementById('daily-grid-search-input'),
      suggestionList: document.getElementById('daily-grid-suggestions'),
      resetBtn: document.getElementById('daily-grid-reset'),
      shareBtn: document.getElementById('daily-grid-share')
    };

    todayStr = getTodayDateString();
    definition = generateDailyGridDefinition(allPlayers, todayStr);
    if (!definition) return;

    loadState();
    if (!selectedCell) selectedCell = findFirstEmptyCell();
    bindEvents();
    render();
  }

  function loadState() {
    const savedDate = localStorage.getItem(DAILY_GRID_DATE_KEY);
    if (savedDate !== todayStr) {
      resetForNewDay();
      return;
    }

    const rawPlacements = safeParseJson(localStorage.getItem(DAILY_GRID_PLACEMENTS_KEY) || '{}', {});
    const nextPlacements = {};

    Object.entries(rawPlacements).forEach(([cellKey, playerId]) => {
      const [r, c] = String(cellKey).split('-').map(Number);
      if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return;
      const player = allPlayers.find((p) => p.id === String(playerId));
      if (!player) return;
      const rowRule = definition.rows[r];
      const colRule = definition.cols[c];
      if (!evaluateRule(player, rowRule) || !evaluateRule(player, colRule)) return;
      nextPlacements[cellKey] = player.id;
    });

    placements = nextPlacements;
  }

  function resetForNewDay() {
    localStorage.setItem(DAILY_GRID_DATE_KEY, todayStr);
    localStorage.removeItem(DAILY_GRID_PLACEMENTS_KEY);
    placements = {};
    selectedCell = null;
  }

  function saveState() {
    localStorage.setItem(DAILY_GRID_DATE_KEY, todayStr);
    localStorage.setItem(DAILY_GRID_PLACEMENTS_KEY, JSON.stringify(placements));
  }

  function countPlacedCells() {
    return Object.keys(placements).length;
  }

  function isCompleted() {
    return countPlacedCells() === GRID_SIZE * GRID_SIZE;
  }

  function findFirstEmptyCell() {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = getCellKey(r, c);
        if (!placements[key]) return key;
      }
    }
    return null;
  }

  function getPlayerById(playerId) {
    return allPlayers.find((p) => p.id === playerId) || null;
  }

  function isPlayerAlreadyUsed(playerId, excludedCellKey = null) {
    return Object.entries(placements).some(([cellKey, id]) => cellKey !== excludedCellKey && id === playerId);
  }

  function setSelectedCellByKey(cellKey) {
    selectedCell = cellKey;
    renderSelectedRule();
    renderBoard();
  }

  function renderBoard() {
    if (!el.board || !definition) return;

    const colHeaders = definition.cols
      .map((rule, idx) => `<div class="daily-grid-col-header" title="${escapeHtml(buildRuleLabel(rule, t, getLocalizedTeamName))}" data-col="${idx}">${escapeHtml(buildRuleLabel(rule, t, getLocalizedTeamName))}</div>`)
      .join('');

    const rows = definition.rows
      .map((rowRule, r) => {
        const cells = Array.from({ length: GRID_SIZE }, (_, c) => {
          const key = getCellKey(r, c);
          const player = getPlayerById(placements[key]);
          const isSelected = selectedCell === key;
          const classes = [
            'daily-grid-cell',
            player ? 'filled' : 'empty',
            isSelected ? 'selected' : ''
          ].filter(Boolean).join(' ');
          const value = player ? escapeHtml(player.name) : escapeHtml(t('dailyGridCellEmpty'));
          const team = player ? ` <span class="daily-grid-cell-team">${escapeHtml(getLocalizedTeamName(player.team, t))}</span>` : '';
          return `<button type="button" class="${classes}" data-row="${r}" data-col="${c}">${value}${team}</button>`;
        }).join('');

        return `
          <div class="daily-grid-row-header" title="${escapeHtml(buildRuleLabel(rowRule, t, getLocalizedTeamName))}">${escapeHtml(buildRuleLabel(rowRule, t, getLocalizedTeamName))}</div>
          ${cells}
        `;
      })
      .join('');

    el.board.innerHTML = `
      <div class="daily-grid-corner"></div>
      ${colHeaders}
      ${rows}
    `;
  }

  function renderSelectedRule() {
    if (!el.selectedRule || !definition) return;

    if (!selectedCell) {
      el.selectedRule.textContent = t('dailyGridSelectCell');
      return;
    }

    const [r, c] = selectedCell.split('-').map(Number);
    const rowRule = definition.rows[r];
    const colRule = definition.cols[c];
    el.selectedRule.textContent = t('dailyGridSelectedRules', {
      row: buildRuleLabel(rowRule, t, getLocalizedTeamName),
      col: buildRuleLabel(colRule, t, getLocalizedTeamName)
    });
  }

  function setMessage(key, replacements = {}, tone = 'info') {
    if (!el.message) return;
    el.message.textContent = t(key, replacements);
    el.message.classList.remove('is-info', 'is-error', 'is-success');
    el.message.classList.add(`is-${tone}`);
  }

  function clearSearch() {
    if (el.searchInput) el.searchInput.value = '';
    suggestions = [];
    activeSuggestionIndex = -1;
    renderSuggestions();
  }

  function renderSuggestions() {
    if (!el.suggestionList) return;

    if (suggestions.length === 0) {
      el.suggestionList.hidden = true;
      el.suggestionList.innerHTML = '';
      return;
    }

    el.suggestionList.innerHTML = suggestions
      .map((player, idx) => `
        <li class="daily-grid-suggestion-item${idx === activeSuggestionIndex ? ' active' : ''}" data-idx="${idx}" role="option" aria-selected="${idx === activeSuggestionIndex}">
          <span>${escapeHtml(player.name)}</span>
        </li>
      `)
      .join('');
    el.suggestionList.hidden = false;
  }

  function renderProgress() {
    if (!el.progress) return;
    el.progress.textContent = t('dailyGridProgress', {
      count: countPlacedCells(),
      max: GRID_SIZE * GRID_SIZE
    });
  }

  function renderSearchState() {
    if (!el.searchInput) return;
    el.searchInput.disabled = isCompleted() || !selectedCell;
    el.searchInput.placeholder = t('dailyGridSearchPlaceholder');
    if (el.shareBtn) el.shareBtn.disabled = countPlacedCells() === 0;
  }

  function renderStaticLabels() {
    if (el.title) el.title.textContent = t('dailyGridTitle');
    if (el.subtitle) el.subtitle.textContent = t('dailyGridSubtitle');
    if (el.instructions) el.instructions.textContent = t('dailyGridInstructions');
    if (el.resetBtn) el.resetBtn.textContent = t('dailyGridReset');
    if (el.shareBtn) el.shareBtn.textContent = t('dailyGridShareBtn');
  }

  function buildShareGrid() {
    const lines = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const line = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        line.push(placements[getCellKey(r, c)] ? '🟩' : '⬜');
      }
      lines.push(line.join(''));
    }
    return lines.join('\n');
  }

  async function doShare() {
    if (countPlacedCells() === 0) return;

    const text = t('dailyGridShareSummary', {
      date: todayStr,
      count: countPlacedCells(),
      max: GRID_SIZE * GRID_SIZE,
      grid: buildShareGrid()
    });

    try {
      await navigator.clipboard.writeText(text);
      if (el.shareBtn) el.shareBtn.textContent = t('copied');
    } catch {
      if (el.shareBtn) el.shareBtn.textContent = t('copyFailed');
    }

    if (shareTimeout) clearTimeout(shareTimeout);
    shareTimeout = setTimeout(() => {
      if (el.shareBtn) el.shareBtn.textContent = t('dailyGridShareBtn');
      shareTimeout = null;
    }, 1600);
  }

  function render() {
    renderStaticLabels();
    renderBoard();
    renderSelectedRule();
    renderProgress();
    renderSearchState();

    if (isCompleted()) {
      setMessage('dailyGridCompleted', {}, 'success');
    } else if (!el.message?.textContent) {
      setMessage('dailyGridReady', {}, 'info');
    }
  }

  function onSearchInput(raw) {
    const query = String(raw || '').trim().toLowerCase();
    if (!selectedCell || query.length < 1) {
      suggestions = [];
      activeSuggestionIndex = -1;
      renderSuggestions();
      return;
    }

    suggestions = allPlayers
      .filter((player) => player.name.toLowerCase().includes(query))
      .slice(0, 8);

    activeSuggestionIndex = -1;
    renderSuggestions();
  }

  function tryPlacePlayer(player) {
    if (!selectedCell || !player || isCompleted()) return;

    const [r, c] = selectedCell.split('-').map(Number);
    const rowRule = definition.rows[r];
    const colRule = definition.cols[c];

    if (isPlayerAlreadyUsed(player.id, selectedCell)) {
      setMessage('dailyGridAlreadyUsed', { name: player.name }, 'error');
      return;
    }

    if (!evaluateRule(player, rowRule) || !evaluateRule(player, colRule)) {
      setMessage('dailyGridInvalid', { name: player.name }, 'error');
      return;
    }

    placements[selectedCell] = player.id;
    saveState();
    clearSearch();

    const nextCell = findFirstEmptyCell();
    selectedCell = nextCell;
    setMessage('dailyGridPlaced', { name: player.name }, 'success');
    render();
  }

  function bindEvents() {
    if (el.board) {
      el.board.addEventListener('click', (event) => {
        const button = event.target.closest('.daily-grid-cell');
        if (!button) return;
        const r = Number(button.dataset.row);
        const c = Number(button.dataset.col);
        if (Number.isNaN(r) || Number.isNaN(c)) return;
        setSelectedCellByKey(getCellKey(r, c));
        if (el.searchInput) el.searchInput.focus();
      });
    }

    if (el.searchInput) {
      el.searchInput.addEventListener('input', (event) => onSearchInput(event.target.value));
      el.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          if (suggestions.length === 0) return;
          activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
          renderSuggestions();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          if (suggestions.length === 0) return;
          activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
          renderSuggestions();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
            tryPlacePlayer(suggestions[activeSuggestionIndex]);
          } else if (suggestions.length === 1) {
            tryPlacePlayer(suggestions[0]);
          }
        } else if (event.key === 'Escape') {
          clearSearch();
        }
      });
    }

    if (el.suggestionList) {
      el.suggestionList.addEventListener('click', (event) => {
        const item = event.target.closest('.daily-grid-suggestion-item');
        if (!item) return;
        const idx = Number(item.dataset.idx);
        if (!Number.isNaN(idx) && suggestions[idx]) {
          tryPlacePlayer(suggestions[idx]);
        }
      });
    }

    if (el.resetBtn) {
      el.resetBtn.addEventListener('click', () => {
        placements = {};
        selectedCell = findFirstEmptyCell();
        saveState();
        clearSearch();
        setMessage('dailyGridReady', {}, 'info');
        render();
      });
    }

    if (el.shareBtn) {
      el.shareBtn.addEventListener('click', doShare);
    }
  }

  function updateTranslations() {
    render();
    renderSuggestions();
  }

  return { init, updateTranslations };
}
