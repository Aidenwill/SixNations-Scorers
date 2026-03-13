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
    { type: 'conversion', count: 2 },
    { type: 'pen', count: 1, Opponent: 'Italy' }
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
  assert.equal(evaluateRule(samplePlayer, { kind: 'opponent', team: 'Italy' }), true);
  assert.equal(evaluateRule(samplePlayer, { kind: 'opponent', team: 'France' }), false);
});

test('evaluateRule: pointsAgainstTeam and pointsInYear', () => {
  const richPlayer = {
    id: 'p2',
    name: 'Test Player',
    team: 'England',
    total: 50,
    activityStartYear: 2018,
    activityEndYear: 2023,
    details: [
      { Date: '2020-02-01', Type: 'Pen', Points: 9, Opponent: 'Italy' },
      { Date: '2020-03-14', Type: 'Con', Points: 4, Opponent: 'France' },
      { Date: '2023-02-15', Type: 'Try', Points: 15, Opponent: 'Scotland' },
      { Date: '2023-03-10', Type: 'Pen', Points: 6, Opponent: 'Italy' }
    ]
  };

  // against Italy: 9 + 6 = 15 pts
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsAgainstTeam', team: 'Italy', value: 10 }), true);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsAgainstTeam', team: 'Italy', value: 15 }), true);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsAgainstTeam', team: 'Italy', value: 16 }), false);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsAgainstTeam', team: 'France', value: 10 }), false);

  // in 2023: 15 + 6 = 21 pts
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsInYear', year: 2023, value: 10 }), true);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsInYear', year: 2023, value: 21 }), true);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsInYear', year: 2023, value: 22 }), false);
  // in 2020: 9 + 4 = 13 pts
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsInYear', year: 2020, value: 13 }), true);
  assert.equal(evaluateRule(richPlayer, { kind: 'pointsInYear', year: 2020, value: 14 }), false);
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

test('generateDailyGridDefinition: never yields contradictory row/column constraints', () => {
  const players = makeDataset();
  const start = new Date('2025-01-01');

  for (let i = 0; i < 500; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const def = generateDailyGridDefinition(players, dateStr);

    assert.ok(def, `No definition generated for ${dateStr}`);

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const rowRule = def.rows[r];
        const colRule = def.cols[c];

        // Hard guard against impossible cross-team axis combinations.
        if (rowRule.kind === 'team' && colRule.kind === 'team') {
          assert.equal(rowRule.team, colRule.team, `Team conflict on ${dateStr}: ${rowRule.team} vs ${colRule.team}`);
        }

        const candidateCount = players.filter((p) => evaluateRule(p, rowRule) && evaluateRule(p, colRule)).length;
        assert.equal(candidateCount >= 2, true, `Less than 2 candidates on ${dateStr} cell [${r},${c}]`);
      }
    }
  }
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
