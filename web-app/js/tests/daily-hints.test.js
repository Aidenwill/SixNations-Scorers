import assert from 'node:assert/strict';
import {
  HINT_FIELD_ORDER,
  HINT_OFFER_STEPS,
  getHintOfferCandidateFields,
  pickRandomFields,
  sanitizeFieldKeys,
  sanitizeHintOffers,
  getFailedAttemptsCount,
  ensureHintOffers,
  getActiveHintOffer
} from '../daily-hints.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const target = {
  id: 't',
  team: 'France',
  total: 100,
  activityStartYear: 2012,
  activityEndYear: 2024,
  name: 'Target Name'
};

const wrongHints = {
  isCorrect: false,
  team: { direction: 'diff' },
  points: { direction: 'up' },
  activityStart: { direction: 'down' },
  activityEnd: { direction: 'down' },
  nameLength: { direction: 'up' }
};

test('constants: expected defaults', () => {
  assert.deepStrictEqual(HINT_OFFER_STEPS, [4, 8]);
  assert.deepStrictEqual(HINT_FIELD_ORDER, ['team', 'points', 'activityStart', 'activityEnd', 'nameLength']);
});

test('getHintOfferCandidateFields: excludes solved fields', () => {
  const guessList = [{ hints: { ...wrongHints, points: { direction: 'match' } } }];
  const result = getHintOfferCandidateFields({ guessList, targetPlayer: target, revealedFieldKeys: [] });
  assert.ok(!result.includes('points'));
});

test('getHintOfferCandidateFields: excludes already revealed fields', () => {
  const result = getHintOfferCandidateFields({
    guessList: [{ hints: wrongHints }],
    targetPlayer: target,
    revealedFieldKeys: ['team']
  });
  assert.ok(!result.includes('team'));
});

test('getHintOfferCandidateFields: excludes non-revealable activityEnd when null', () => {
  const result = getHintOfferCandidateFields({
    guessList: [{ hints: wrongHints }],
    targetPlayer: { ...target, activityEndYear: null },
    revealedFieldKeys: []
  });
  assert.ok(!result.includes('activityEnd'));
});

test('pickRandomFields: returns max count unique items', () => {
  const picks = pickRandomFields(['a', 'b', 'c'], 2, () => 0.4);
  assert.strictEqual(picks.length, 2);
  assert.strictEqual(new Set(picks).size, 2);
});

test('sanitizeFieldKeys: removes unknown and duplicates', () => {
  const cleaned = sanitizeFieldKeys(['team', 'team', 'bad']);
  assert.deepStrictEqual(cleaned, ['team']);
});

test('sanitizeHintOffers: keeps only valid steps with fields', () => {
  const cleaned = sanitizeHintOffers([
    { step: 4, fields: ['team'], resolved: false },
    { step: 99, fields: ['team'], resolved: false },
    { step: 8, fields: [], resolved: false }
  ]);
  assert.strictEqual(cleaned.length, 1);
  assert.strictEqual(cleaned[0].step, 4);
});

test('getFailedAttemptsCount: counts only incorrect guesses', () => {
  const n = getFailedAttemptsCount([
    { hints: { isCorrect: false } },
    { hints: { isCorrect: true } },
    { hints: { isCorrect: false } }
  ]);
  assert.strictEqual(n, 2);
});

test('ensureHintOffers: creates first offer at step 4', () => {
  const hintOffers = ensureHintOffers({
    hintOffers: [],
    guessList: Array.from({ length: 4 }, () => ({ hints: wrongHints })),
    targetPlayer: target,
    revealedFieldKeys: [],
    rng: () => 0.2
  });
  assert.strictEqual(hintOffers.length, 1);
  assert.strictEqual(hintOffers[0].step, 4);
  assert.ok(hintOffers[0].fields.length > 0);
});

test('ensureHintOffers: creates second offer at step 8 while preserving first', () => {
  const first = [{ step: 4, fields: ['team', 'points'], resolved: true, chosenField: 'team' }];
  const offers = ensureHintOffers({
    hintOffers: first,
    guessList: Array.from({ length: 8 }, () => ({ hints: wrongHints })),
    targetPlayer: target,
    revealedFieldKeys: ['team'],
    rng: () => 0.2
  });
  assert.strictEqual(offers.length, 2);
  assert.ok(offers.some(o => o.step === 4));
  assert.ok(offers.some(o => o.step === 8));
});

test('getActiveHintOffer: returns unresolved earliest eligible offer', () => {
  const offer = getActiveHintOffer([
    { step: 8, fields: ['points'], resolved: false },
    { step: 4, fields: ['team'], resolved: false }
  ], 8);
  assert.strictEqual(offer.step, 4);
});

let passed = 0, failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ✓  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗  ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed (${tests.length} total)`);
if (failed > 0) process.exit(1);
