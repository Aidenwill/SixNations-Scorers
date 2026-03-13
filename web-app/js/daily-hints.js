/** @typedef {'team'|'points'|'activityStart'|'activityEnd'|'nameLength'} HintFieldKey */

/**
 * @typedef {Object} HintOffer
 * @property {number} step
 * @property {HintFieldKey[]} fields
 * @property {boolean} resolved
 * @property {HintFieldKey | null} chosenField
 */

/** @type {ReadonlyArray<HintFieldKey>} */
export const HINT_FIELD_ORDER = Object.freeze(['team', 'points', 'activityStart', 'activityEnd', 'nameLength']);

/** @type {ReadonlyArray<number>} */
export const HINT_OFFER_STEPS = Object.freeze([4, 8]);

function isFieldRevealable(fieldKey, targetPlayer) {
  if (!targetPlayer) return false;
  if (fieldKey === 'activityStart') return targetPlayer.activityStartYear != null;
  if (fieldKey === 'activityEnd') return targetPlayer.activityEndYear != null;
  return true;
}

function getSolvedFieldSet(guessList) {
  const solved = new Set();
  (guessList || []).forEach(({ hints }) => {
    if (hints?.team?.direction === 'match') solved.add('team');
    if (hints?.points?.direction === 'match') solved.add('points');
    if (hints?.activityStart?.direction === 'match') solved.add('activityStart');
    if (hints?.activityEnd?.direction === 'match') solved.add('activityEnd');
    if (hints?.nameLength?.direction === 'match') solved.add('nameLength');
  });
  return solved;
}

export function getHintOfferCandidateFields({ guessList, targetPlayer, revealedFieldKeys = [] }) {
  const solved = getSolvedFieldSet(guessList);
  return HINT_FIELD_ORDER.filter((field) =>
    !revealedFieldKeys.includes(field) &&
    !solved.has(field) &&
    isFieldRevealable(field, targetPlayer)
  );
}

export function pickRandomFields(fieldKeys, count = 2, rng = Math.random) {
  const pool = Array.isArray(fieldKeys) ? [...fieldKeys] : [];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, count));
}

export function sanitizeFieldKeys(value, fieldOrder = HINT_FIELD_ORDER) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((key) => fieldOrder.includes(key)))];
}

export function sanitizeHintOffers(value, options = {}) {
  const { steps = HINT_OFFER_STEPS, fieldOrder = HINT_FIELD_ORDER } = options;
  if (!Array.isArray(value)) return [];

  return value
    .map((offer) => ({
      step: Number(offer?.step),
      fields: sanitizeFieldKeys(Array.isArray(offer?.fields) ? offer.fields : [], fieldOrder),
      resolved: Boolean(offer?.resolved),
      chosenField: fieldOrder.includes(offer?.chosenField) ? offer.chosenField : null
    }))
    .filter((offer) => steps.includes(offer.step) && offer.fields.length > 0);
}

export function getFailedAttemptsCount(guessList) {
  return (guessList || []).filter((g) => !g?.hints?.isCorrect).length;
}

export function ensureHintOffers(options) {
  const {
    hintOffers,
    guessList,
    targetPlayer,
    revealedFieldKeys,
    steps = HINT_OFFER_STEPS,
    rng = Math.random
  } = options;

  const failedAttempts = getFailedAttemptsCount(guessList);
  const next = Array.isArray(hintOffers) ? [...hintOffers] : [];

  steps.forEach((step) => {
    if (failedAttempts < step) return;
    if (next.some((offer) => offer.step === step)) return;

    const candidates = getHintOfferCandidateFields({
      guessList,
      targetPlayer,
      revealedFieldKeys
    });
    const fields = pickRandomFields(candidates, 2, rng);
    if (fields.length > 0) {
      next.push({ step, fields, resolved: false, chosenField: null });
    }
  });

  return next;
}

export function getActiveHintOffer(hintOffers, failedAttempts) {
  return (hintOffers || [])
    .filter((offer) => !offer.resolved && offer.step <= failedAttempts && offer.fields.length > 0)
    .sort((a, b) => a.step - b.step)[0] || null;
}
