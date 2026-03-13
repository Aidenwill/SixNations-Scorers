import { getCanonicalTeamName } from './teams.js';
import {
  HINT_OFFER_STEPS,
  sanitizeFieldKeys,
  sanitizeHintOffers,
  getFailedAttemptsCount,
  ensureHintOffers,
  getActiveHintOffer as selectActiveHintOffer,
  pickRandomFields,
  getHintOfferCandidateFields
} from './daily-hints.js';

export { pickRandomFields, getHintOfferCandidateFields };

const DAILY_DATE_KEY    = 'sixnations_daily_date';
const DAILY_GUESSES_KEY = 'sixnations_daily_guesses';
const DAILY_WON_KEY     = 'sixnations_daily_won';
const DAILY_GIVEN_UP_KEY = 'sixnations_daily_given_up';
const DAILY_REVEALED_FIELDS_KEY = 'sixnations_daily_revealed_fields';
const DAILY_HINT_OFFERS_KEY = 'sixnations_daily_hint_offers';
const DAILY_STATE_KEYS = Object.freeze([
  DAILY_GUESSES_KEY,
  DAILY_WON_KEY,
  DAILY_GIVEN_UP_KEY,
  DAILY_REVEALED_FIELDS_KEY,
  DAILY_HINT_OFFERS_KEY
]);
const MAX_SUGGESTIONS   = 8;
const MAX_DAILY_ATTEMPTS = 12;
const FIELD_LABEL_KEY_BY_FIELD = Object.freeze({
  team: 'dailyHintTeamLabel',
  points: 'dailyHintPointsLabel',
  activityStart: 'dailyHintStartLabel',
  activityEnd: 'dailyHintEndLabel',
  nameLength: 'dailyHintNameLengthLabel'
});
const REVEALED_VALUE_FORMATTERS = Object.freeze({
  team: (player, { getLocalizedTeamName: localizeTeam, t: translate }) => localizeTeam(player.team, translate),
  points: (player) => String(player.total),
  activityStart: (player) => String(player.activityStartYear ?? '?'),
  activityEnd: (player) => String(player.activityEndYear ?? '?'),
  nameLength: (player) => String(getNameLength(player.name))
});

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ── Pure helpers (exported for tests) ──────────────────────────────────────────

/** Returns the local date string "YYYY-MM-DD" (so the puzzle changes at midnight local time). */
export function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Deterministic daily player — same result for all users on the same date. */
export function getDailyPlayer(players, dateStr) {
  if (!players || players.length === 0) return null;
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (((hash << 5) + hash) ^ dateStr.charCodeAt(i)) | 0;
  }
  return players[Math.abs(hash) % players.length];
}

/**
 * Build hint comparisons for a guess against the target.
 * direction:
 *   'match'   – exact equality
 *   'up'      – target value is HIGHER than guessed (aim higher)
 *   'down'    – target value is LOWER  than guessed (aim lower)
 *   'diff'    – team mismatch
 *   'unknown' – one of the values is null
 */
export function buildGuessHints(guess, target) {
  const guessTeam  = getCanonicalTeamName(guess.team)  || String(guess.team  || '');
  const targetTeam = getCanonicalTeamName(target.team) || String(target.team || '');
  const guessNameLength = getNameLength(guess.name);
  const targetNameLength = getNameLength(target.name);

  return {
    isCorrect:     guess.id === target.id,
    team:          { direction: guessTeam === targetTeam ? 'match' : 'diff', value: guess.team },
    points:        numHint(guess.total, target.total),
    activityStart: yearHint(guess.activityStartYear, target.activityStartYear),
    activityEnd:   yearHint(guess.activityEndYear,   target.activityEndYear),
    nameLength:    numHint(guessNameLength, targetNameLength)
  };
}

function getNameLength(name) {
  return String(name || '').replace(/\s+/g, '').length;
}

function numHint(g, t) {
  if (g === t) return { direction: 'match', value: g };
  return { direction: g < t ? 'up' : 'down', value: g };
}

function yearHint(g, t) {
  if (g == null || t == null) return { direction: 'unknown', value: g ?? '?' };
  if (g === t) return { direction: 'match', value: g };
  return { direction: g < t ? 'up' : 'down', value: g };
}

/** Emoji share grid (one row per guess, 5 columns: team · pts · start · end · name length). */
export function buildShareGrid(guessList) {
  const E = { match: '🟢', up: '🔼', down: '🔽', diff: '⬜', unknown: '⬜' };
  return guessList
    .map(({ hints }) =>
      [hints.team, hints.points, hints.activityStart, hints.activityEnd, hints.nameLength]
        .map(h => E[h.direction] ?? '⬜')
        .join('')
    )
    .join('\n');
}

// ── Controller ─────────────────────────────────────────────────────────────────

export function createDailyGameController({ allPlayers, t, escapeHtml, getLocalizedTeamName, onOpenPlayerDetails }) {
  let targetPlayer = null;
  let guessList    = [];  // [{ player, hints }]
  let revealedFieldKeys = [];
  let hintOffers   = []; // [{ step, fields: string[], resolved: boolean, chosenField: string|null }]
  let won          = false;
  let givenUp      = false;
  let todayStr     = '';

  let suggestions    = [];
  let activeSugIdx   = -1;
  let shareTimeout   = null;

  // Lazily-resolved DOM refs (don't query at module load time)
  let el = {};

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    el = {
      searchInput:   document.getElementById('daily-search-input'),
      suggestionList: document.getElementById('daily-suggestions'),
      guessesGrid:   document.getElementById('daily-guesses-grid'),
      resultBox:     document.getElementById('daily-result'),
      resultMsg:     document.getElementById('daily-result-message'),
      shareBtn:      document.getElementById('daily-share-btn'),
      detailsBtn:    document.getElementById('daily-details-btn'),
      giveUpBtn:     document.getElementById('daily-give-up'),
      title:         document.getElementById('daily-title'),
      subtitle:      document.getElementById('daily-subtitle'),
      attemptsLabel: document.getElementById('daily-attempts-label'),
      revealedHints: document.getElementById('daily-revealed-hints'),
      hintOfferBox:  document.getElementById('daily-hint-offer'),
    };

    todayStr     = getTodayDateString();
    targetPlayer = getDailyPlayer(allPlayers, todayStr);
    if (!targetPlayer) return;

    loadState();
    bindEvents();
    render();
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  function loadState() {
    const savedDate = localStorage.getItem(DAILY_DATE_KEY);
    if (savedDate === todayStr) {
      const ids = safeParseJson(localStorage.getItem(DAILY_GUESSES_KEY) || '[]', []);
      won      = localStorage.getItem(DAILY_WON_KEY)      === 'true';
      givenUp  = localStorage.getItem(DAILY_GIVEN_UP_KEY) === 'true';
      revealedFieldKeys = sanitizeFieldKeys(safeParseJson(localStorage.getItem(DAILY_REVEALED_FIELDS_KEY) || '[]', []));
      hintOffers = sanitizeHintOffers(safeParseJson(localStorage.getItem(DAILY_HINT_OFFERS_KEY) || '[]', []));
      guessList = ids
        .map(id => allPlayers.find(p => p.id === id))
        .filter(Boolean)
        .map(p => ({ player: p, hints: buildGuessHints(p, targetPlayer) }));
      refreshHintOffers();
    } else {
      resetStateForNewDay();
    }
  }

  function resetStateForNewDay() {
    localStorage.setItem(DAILY_DATE_KEY, todayStr);
    DAILY_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
    revealedFieldKeys = [];
    hintOffers = [];
  }

  function saveState() {
    localStorage.setItem(DAILY_GUESSES_KEY, JSON.stringify(guessList.map(g => g.player.id)));
    localStorage.setItem(DAILY_WON_KEY,      String(won));
    localStorage.setItem(DAILY_GIVEN_UP_KEY,  String(givenUp));
    localStorage.setItem(DAILY_REVEALED_FIELDS_KEY, JSON.stringify(revealedFieldKeys));
    localStorage.setItem(DAILY_HINT_OFFERS_KEY, JSON.stringify(hintOffers));
  }

  function isFinished() {
    return won || givenUp;
  }

  function getExistingOffer(step) {
    return hintOffers.find(o => o.step === step);
  }

  function refreshHintOffers() {
    if (isFinished()) return;
    hintOffers = ensureHintOffers({
      hintOffers,
      guessList,
      targetPlayer,
      revealedFieldKeys,
      steps: HINT_OFFER_STEPS
    });
  }

  function getCurrentHintOffer() {
    const failedAttempts = getFailedAttemptsCount(guessList);
    return selectActiveHintOffer(hintOffers, failedAttempts);
  }

  function chooseHintFromOffer(step, fieldKey) {
    const offer = getExistingOffer(step);
    if (!offer || offer.resolved) return;
    if (!offer.fields.includes(fieldKey)) return;
    if (!revealedFieldKeys.includes(fieldKey)) revealedFieldKeys.push(fieldKey);
    offer.resolved = true;
    offer.chosenField = fieldKey;
    saveState();
    render();
  }

  function declineHintOffer(step) {
    const offer = getExistingOffer(step);
    if (!offer || offer.resolved) return;
    offer.resolved = true;
    offer.chosenField = null;
    saveState();
    render();
  }

  // ── Gameplay ───────────────────────────────────────────────────────────────

  function submitGuess(player) {
    if (isFinished()) return;
    if (guessList.length >= MAX_DAILY_ATTEMPTS) return;
    if (guessList.some(g => g.player.id === player.id)) return;

    const hints = buildGuessHints(player, targetPlayer);
    guessList.push({ player, hints });
    if (hints.isCorrect) won = true;
    else {
      refreshHintOffers();
      if (guessList.length >= MAX_DAILY_ATTEMPTS) givenUp = true;
    }

    saveState();
    clearSearch();
    render();
  }

  function doGiveUp() {
    if (won) return;
    givenUp = true;
    saveState();
    render();
  }

  // ── Autocomplete ───────────────────────────────────────────────────────────

  function onSearchInput(raw) {
    const query = raw.trim().toLowerCase();
    if (query.length < 2) { hideSuggestions(); return; }

    const guessedIds = new Set(guessList.map(g => g.player.id));
    suggestions = allPlayers
      .filter(p => !guessedIds.has(p.id) && p.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(query) ? -1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(query) ? -1 : 0;
        return aStarts - bStarts;
      })
      .slice(0, MAX_SUGGESTIONS);

    activeSugIdx = -1;
    renderSuggestions();
  }

  function renderSuggestions() {
    if (!el.suggestionList) return;
    if (suggestions.length === 0) { hideSuggestions(); return; }

    el.suggestionList.innerHTML = suggestions
      .map((p, i) => `
        <li role="option"
            class="daily-suggestion-item${i === activeSugIdx ? ' active' : ''}"
            aria-selected="${i === activeSugIdx}"
            data-idx="${i}">
          <span class="suggestion-name">${escapeHtml(p.name)}</span>
          <span class="suggestion-team">${escapeHtml(getLocalizedTeamName(p.team, t))}</span>
        </li>`)
      .join('');
    el.suggestionList.hidden = false;
  }

  function hideSuggestions() {
    if (el.suggestionList) el.suggestionList.hidden = true;
    suggestions  = [];
    activeSugIdx = -1;
  }

  function clearSearch() {
    if (el.searchInput) el.searchInput.value = '';
    hideSuggestions();
  }

  function moveSuggestion(delta) {
    if (suggestions.length === 0) return;
    activeSugIdx = ((activeSugIdx + delta + suggestions.length) % suggestions.length);
    renderSuggestions();
  }

  function confirmSuggestion() {
    if (activeSugIdx >= 0 && suggestions[activeSugIdx]) {
      submitGuess(suggestions[activeSugIdx]);
    } else if (suggestions.length === 1) {
      submitGuess(suggestions[0]);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const ICONS = { match: '✓', up: '↑', down: '↓', diff: '✗', unknown: '?' };

  function render() {
    updateStaticLabels();
    renderHintOffer();
    renderRevealedHints();
    renderGrid();
    renderResult();

    const finished = isFinished();
    if (el.searchInput)  el.searchInput.disabled = finished;
    if (el.giveUpBtn)    el.giveUpBtn.classList.toggle('hidden', finished);
    if (el.detailsBtn)   el.detailsBtn.classList.toggle('hidden', !finished);
  }

  function renderHintOffer() {
    if (!el.hintOfferBox) return;
    const offer = getCurrentHintOffer();

    if (!offer || isFinished()) {
      el.hintOfferBox.classList.add('hidden');
      el.hintOfferBox.innerHTML = '';
      return;
    }

    const buttons = offer.fields
      .map((fieldKey) => `<button type="button" class="btn secondary daily-hint-option" data-step="${offer.step}" data-field="${escapeHtml(fieldKey)}">${escapeHtml(getFieldLabel(fieldKey))}</button>`)
      .join('');

    el.hintOfferBox.innerHTML = `
      <p class="daily-hint-offer-title">${escapeHtml(t('dailyHintOfferTitle'))}</p>
      <p class="daily-hint-offer-text">${escapeHtml(t('dailyHintOfferText'))}</p>
      <div class="daily-hint-offer-actions">
        ${buttons}
        <button type="button" class="btn daily-hint-skip" data-step="${offer.step}">${escapeHtml(t('dailyHintOfferSkip'))}</button>
      </div>
    `;
    el.hintOfferBox.classList.remove('hidden');
  }

  function getRevealedValue(fieldKey) {
    if (!targetPlayer) return '?';
    const formatValue = REVEALED_VALUE_FORMATTERS[fieldKey];
    if (!formatValue) return '?';
    return formatValue(targetPlayer, { getLocalizedTeamName, t });
  }

  function getFieldLabel(fieldKey) {
    const labelKey = FIELD_LABEL_KEY_BY_FIELD[fieldKey];
    if (labelKey) return t(labelKey);
    return fieldKey;
  }

  function renderRevealedHints() {
    if (!el.revealedHints) return;
    if (revealedFieldKeys.length === 0) {
      el.revealedHints.classList.add('hidden');
      el.revealedHints.innerHTML = '';
      return;
    }

    const items = revealedFieldKeys
      .map((fieldKey) => `<li>${escapeHtml(getFieldLabel(fieldKey))}: <strong>${escapeHtml(getRevealedValue(fieldKey))}</strong></li>`)
      .join('');

    el.revealedHints.innerHTML = `
      <p class="daily-revealed-hints-title">${escapeHtml(t('dailyHintsUnlockedTitle'))}</p>
      <ul class="daily-revealed-hints-list">${items}</ul>
    `;
    el.revealedHints.classList.remove('hidden');
  }

  function updateStaticLabels() {
    if (el.title)         el.title.textContent         = t('dailyTitle');
    if (el.subtitle)      el.subtitle.textContent      = t('dailySubtitle');
    if (el.searchInput)   el.searchInput.placeholder   = t('dailySearchPlaceholder');
    if (el.giveUpBtn)     el.giveUpBtn.textContent     = t('dailyGiveUp');
    if (el.shareBtn)      el.shareBtn.textContent      = t('dailyShareBtn');
    if (el.detailsBtn)    el.detailsBtn.textContent    = t('details');
    if (el.attemptsLabel) {
      el.attemptsLabel.textContent = guessList.length > 0
        ? t('dailyAttemptsCount', { count: guessList.length, max: MAX_DAILY_ATTEMPTS })
        : '';
    }
  }

  function renderGrid() {
    if (!el.guessesGrid) return;
    if (guessList.length === 0) { el.guessesGrid.innerHTML = ''; return; }

    const header = `
      <div class="daily-guess-header" aria-hidden="true">
        <span class="guess-col-name"></span>
        <span class="guess-col-hint">${escapeHtml(t('dailyHintTeamLabel'))}</span>
        <span class="guess-col-hint">${escapeHtml(t('dailyHintPointsLabel'))}</span>
        <span class="guess-col-hint">${escapeHtml(t('dailyHintStartLabel'))}</span>
        <span class="guess-col-hint">${escapeHtml(t('dailyHintEndLabel'))}</span>
        <span class="guess-col-hint">${escapeHtml(t('dailyHintNameLengthLabel'))}</span>
      </div>`;

    const rows = guessList.map(({ player, hints }) => {
      const teamLabel  = getLocalizedTeamName(player.team, t);
      return `
        <div class="daily-guess-row${hints.isCorrect ? ' guess-correct' : ''}">
          <span class="guess-name" title="${escapeHtml(player.name)}">${escapeHtml(player.name)}</span>
          ${hintCell(hints.team,          teamLabel,                    t('dailyHintTeamLabel'))}
          ${hintCell(hints.points,        String(hints.points.value),   t('dailyHintPointsLabel'))}
          ${hintCell(hints.activityStart, String(hints.activityStart.value), t('dailyHintStartLabel'))}
          ${hintCell(hints.activityEnd,   String(hints.activityEnd.value),   t('dailyHintEndLabel'))}
          ${hintCell(hints.nameLength,    String(hints.nameLength.value),    t('dailyHintNameLengthLabel'))}
        </div>`;
    }).join('');

    el.guessesGrid.innerHTML = header + rows;
  }

  function hintCell(hint, label, ariaDesc) {
    const icon = ICONS[hint.direction] ?? '?';
    return `<span class="guess-hint hint-${hint.direction}"
                  role="img"
                  title="${escapeHtml(ariaDesc + ': ' + hint.direction)}"
                  aria-label="${escapeHtml(ariaDesc + ' ' + icon + ' ' + label)}">
      <span class="hint-icon" aria-hidden="true">${icon}</span>
      <span class="hint-label">${escapeHtml(label)}</span>
    </span>`;
  }

  function renderResult() {
    if (!el.resultBox || !el.resultMsg) return;
    if (!won && !givenUp) { el.resultBox.classList.add('hidden'); return; }

    el.resultBox.classList.remove('hidden');

    const key  = won ? 'dailyWonMessage' : 'dailyGiveUpReveal';
    el.resultMsg.textContent = t(key, {
      name:  targetPlayer.name,
      team:  getLocalizedTeamName(targetPlayer.team, t),
      total: targetPlayer.total,
      count: guessList.length
    });

    if (el.shareBtn) el.shareBtn.textContent = t('dailyShareBtn');
  }

  // ── Share ──────────────────────────────────────────────────────────────────

  async function doShare() {
    const grid = buildShareGrid(guessList);
    const summary = t('dailyShareSummary', {
      date:  todayStr,
      count: guessList.length,
      grid
    });
    const hintsLine = t('dailyShareHintsUsed', { count: revealedFieldKeys.length });
    const text = `${summary}\n${hintsLine}`;

    const btn = el.shareBtn;
    try {
      await navigator.clipboard.writeText(text);
      if (btn) btn.textContent = t('copied');
    } catch {
      if (btn) btn.textContent = t('copyFailed');
    }

    if (shareTimeout) clearTimeout(shareTimeout);
    shareTimeout = setTimeout(() => {
      if (btn) btn.textContent = t('dailyShareBtn');
      shareTimeout = null;
    }, 1600);
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  function bindEvents() {
    if (el.searchInput) {
      el.searchInput.addEventListener('input', e => onSearchInput(e.target.value));
      el.searchInput.addEventListener('keydown', e => {
        if      (e.key === 'ArrowDown')  { e.preventDefault(); moveSuggestion(+1); }
        else if (e.key === 'ArrowUp')    { e.preventDefault(); moveSuggestion(-1); }
        else if (e.key === 'Enter')      { e.preventDefault(); confirmSuggestion(); }
        else if (e.key === 'Escape')     { hideSuggestions(); }
      });
    }

    if (el.suggestionList) {
      el.suggestionList.addEventListener('click', e => {
        const item = e.target.closest('.daily-suggestion-item');
        if (!item) return;
        const idx = Number(item.dataset.idx);
        if (!Number.isNaN(idx) && suggestions[idx]) submitGuess(suggestions[idx]);
      });
    }

    if (el.giveUpBtn)  el.giveUpBtn.addEventListener('click', doGiveUp);
    if (el.shareBtn)   el.shareBtn.addEventListener('click',  doShare);
    if (el.detailsBtn) {
      el.detailsBtn.addEventListener('click', () => {
        if (typeof onOpenPlayerDetails === 'function' && targetPlayer) {
          onOpenPlayerDetails(targetPlayer);
        }
      });
    }

    if (el.hintOfferBox) {
      el.hintOfferBox.addEventListener('click', (e) => {
        const optionBtn = e.target.closest('.daily-hint-option');
        if (optionBtn) {
          const step = Number(optionBtn.dataset.step);
          const field = optionBtn.dataset.field;
          if (!Number.isNaN(step) && field) chooseHintFromOffer(step, field);
          return;
        }

        const skipBtn = e.target.closest('.daily-hint-skip');
        if (skipBtn) {
          const step = Number(skipBtn.dataset.step);
          if (!Number.isNaN(step)) declineHintOffer(step);
        }
      });
    }

    document.addEventListener('click', e => {
      if (!el.searchInput?.contains(e.target) && !el.suggestionList?.contains(e.target)) {
        hideSuggestions();
      }
    });
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  function updateTranslations() {
    render();
    renderSuggestions(); // re-render team labels in suggestions if open
  }

  return { init, updateTranslations };
}
