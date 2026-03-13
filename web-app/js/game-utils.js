export function computeYearRange(detailsInput) {
  const details = Array.isArray(detailsInput) ? detailsInput : [];
  const years = details
    .map((d) => String(d.date || d.Date || '').slice(0, 4))
    .map((year) => Number(year))
    .filter((year) => Number.isInteger(year) && year >= 1883 && year <= 2100);

  if (!years.length) {
    return { start: null, end: null };
  }

  return {
    start: Math.min(...years),
    end: Math.max(...years)
  };
}

export function computeActivityYearsLabel(detailsInput, t) {
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

export function getActivityYearsText(detailsInput, showActivity, t) {
  if (!showActivity) {
    return t('activityHidden');
  }
  return computeActivityYearsLabel(detailsInput, t);
}

export function getRandomPlayer(players) {
  return players[Math.floor(Math.random() * players.length)];
}

export function getRandomDifferentPlayer(players, excludedPlayer, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i += 1) {
    const candidate = getRandomPlayer(players);
    const isDifferentId = candidate.id !== excludedPlayer.id;
    const isDifferentScore = candidate.total !== excludedPlayer.total;
    if (isDifferentId && isDifferentScore) {
      return candidate;
    }
  }
  return null;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function normalizeScoreType(type) {
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

export function formatScoreType(type, count, t) {
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
