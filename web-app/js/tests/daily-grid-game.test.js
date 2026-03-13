import assert from 'node:assert/strict';
import {
  evaluateRule,
  hasUniqueAssignment,
  generateDailyGridDefinition,
  hashString,
  createSeededRng
} from '../daily-grid-game.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const samplePlayer = {
  id: 'p1',
  name: 'Jean Dupont',
  team: 'France',
  total: 180,
  activityStartYear: 1988,
  activityEndYear: 2001,
  details: [
    { type: 'try', count: 3 },
    { type: 'drop goal', count: 1 },
    { type: 'conversion', count: 2 }
  ]
};

function makeDataset() {
  const teams = ['France', 'England', 'Italy'];
  const starts = [1984, 1992, 2001, 2010];
  const totals = [70, 130, 190, 250];

  const players = [];
  let idx = 1;
  for (const team of teams) {
    for (const start of starts) {
      for (const total of totals) {
        players.push({
          id: `pl-${idx++}`,
          name: `${team} Player ${idx}`,
          team,
          total,
          activityStartYear: start,
          activityEndYear: start + 8
        });
      }
    }
  }
  return players;
}

test('evaluateRule: team / year / points / score types behave correctly', () => {
  assert.equal(evaluateRule(samplePlayer, { kind: 'team', team: 'France' }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'startBefore', year: 1990 }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'startAfter', year: 1990 }), false);
  assert.equal(evaluateRule(samplePlayer, { kind: 'pointsAtLeast', value: 150 }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'pointsAtMost', value: 150 }), false);
  assert.equal(evaluateRule(samplePlayer, { kind: 'endAfter', year: 2000 }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'scoreTypeAtLeast', scoreType: 'try', value: 1 }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'scoreTypeAtLeast', scoreType: 'try', value: 4 }), false);
  assert.equal(evaluateRule(samplePlayer, { kind: 'scoreTypeAtLeast', scoreType: 'dropGoal', value: 1 }), true);
});

test('hasUniqueAssignment: returns true only when full unique matching exists', () => {
  const ok = hasUniqueAssignment([
    ['a', 'b'],
    ['b', 'c'],
    ['c', 'd']
  ]);
  const ko = hasUniqueAssignment([
    ['x'],
    ['x'],
    ['x']
  ]);

  assert.equal(ok, true);
  assert.equal(ko, false);
});

test('generateDailyGridDefinition: deterministic per date', () => {
  const players = makeDataset();
  const d1 = generateDailyGridDefinition(players, '2026-03-13');
  const d2 = generateDailyGridDefinition(players, '2026-03-13');
  assert.ok(d1);
  assert.ok(d2);
  assert.deepStrictEqual(d1, d2);
  assert.equal(d1.rows.length, 3);
  assert.equal(d1.cols.length, 3);
});

test('hashString and seeded rng: deterministic output', () => {
  const h = hashString('abc');
  assert.equal(h, hashString('abc'));
  const rngA = createSeededRng(42);
  const rngB = createSeededRng(42);
  assert.equal(rngA(), rngB());
  assert.equal(rngA(), rngB());
});

let passed = 0;
let failed = 0;
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
