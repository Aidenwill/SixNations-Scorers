import { TEAM_CONFIG, TEAM_FLAG_EMOJIS } from './constants.js';

export function getTeamTranslationKey(teamName) {
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

export function getLocalizedTeamName(teamName, t) {
  const translationKey = getTeamTranslationKey(teamName);
  return translationKey ? t(translationKey) : String(teamName || t('unknown'));
}

export function getCanonicalTeamName(teamName) {
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

export function getTeamFlagEmoji(teamName) {
  const canonicalTeamName = getCanonicalTeamName(teamName);
  return canonicalTeamName ? TEAM_FLAG_EMOJIS[canonicalTeamName] : null;
}

export function getTeamConfig(teamName) {
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
