import assert from 'node:assert/strict';
import {
  ensureHintOffers,
  getActiveHintOffer,
  getHintOfferCandidateFields
} from '../daily-hints.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const target = {
  id: 'target',
  team: 'France',
  total: 321,
  activityStartYear: 2014,
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

function wrongGuesses(n) {
  return Array.from({ length: n }, () => ({ hints: wrongHints }));
}

test('flow: no offer before first threshold', () => {
  const offers = ensureHintOffers({
    hintOffers: [],
    guessList: wrongGuesses(3),
    targetPlayer: target,
    revealedFieldKeys: [],
    rng: () => 0.12
  });
  assert.strictEqual(offers.length, 0);
});

test('flow: first offer appears at 4 failed attempts', () => {
  const offers = ensureHintOffers({
    hintOffers: [],
    guessList: wrongGuesses(4),
    targetPlayer: target,
    revealedFieldKeys: [],
    rng: () => 0.12
  });
  assert.strictEqual(offers.length, 1);
  assert.strictEqual(offers[0].step, 4);
  assert.strictEqual(offers[0].resolved, false);
  assert.strictEqual(offers[0].fields.length, 2);
});

test('flow: active offer is the first unresolved eligible offer', () => {
  const offers = [
    { step: 4, fields: ['team', 'points'], resolved: false, chosenField: null },
    { step: 8, fields: ['activityStart', 'nameLength'], resolved: false, chosenField: null }
  ];

  const activeAt4 = getActiveHintOffer(offers, 4);
  const activeAt8 = getActiveHintOffer(offers, 8);
  assert.strictEqual(activeAt4.step, 4);
  assert.strictEqual(activeAt8.step, 4);
});

test('flow: after choosing first hint, second offer appears at 8 and avoids revealed field', () => {
  const firstOffers = ensureHintOffers({
    hintOffers: [],
    guessList: wrongGuesses(4),
    targetPlayer: target,
    revealedFieldKeys: [],
    rng: () => 0.12
  });

  const chosen = firstOffers[0].fields[0];
  firstOffers[0].resolved = true;
  firstOffers[0].chosenField = chosen;

  const after8 = ensureHintOffers({
    hintOffers: firstOffers,
    guessList: wrongGuesses(8),
    targetPlayer: target,
    revealedFieldKeys: [chosen],
    rng: () => 0.12
  });

  const second = after8.find((o) => o.step === 8);
  assert.ok(second, 'expected offer at step 8');
  assert.ok(!second.fields.includes(chosen), 'second offer should not include already revealed field');
});

test('flow: skip keeps no revealed hint but marks offer resolved', () => {
  const offers = ensureHintOffers({
    hintOffers: [],
    guessList: wrongGuesses(4),
    targetPlayer: target,
    revealedFieldKeys: [],
    rng: () => 0.12
  });
  offers[0].resolved = true;
  offers[0].chosenField = null;

  const active = getActiveHintOffer(offers, 8);
  assert.strictEqual(active, null);
});

test('flow: candidate pool shrinks as solved fields accumulate', () => {
  const guessList = [
    { hints: { ...wrongHints, team: { direction: 'match' }, points: { direction: 'match' } } }
  ];

  const candidates = getHintOfferCandidateFields({
    guessList,
    targetPlayer: target,
    revealedFieldKeys: []
  });

  assert.ok(!candidates.includes('team'));
  assert.ok(!candidates.includes('points'));
  assert.ok(candidates.includes('activityStart'));
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
