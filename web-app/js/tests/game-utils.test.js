import assert from 'node:assert/strict';
import {
  computeYearRange,
  getRandomPlayer,
  getRandomDifferentPlayer,
  escapeHtml,
  normalizeScoreType,
  formatScoreType
} from '../game-utils.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// Simple translation stub for tests that need a `t` function
const t = (key) => key;

// ── computeYearRange ──────────────────────────────────────────────────────────
test('computeYearRange: empty details returns null range', () => {
  const r = computeYearRange([]);
  assert.strictEqual(r.start, null);
  assert.strictEqual(r.end,   null);
});

test('computeYearRange: detects min/max year across multiple entries', () => {
  const details = [{ date: '2010-01-01' }, { date: '2018-03-15' }, { date: '2014-06-20' }];
  const r = computeYearRange(details);
  assert.strictEqual(r.start, 2010);
  assert.strictEqual(r.end,   2018);
});

test('computeYearRange: ignores invalid or empty date strings', () => {
  const details = [{ date: '' }, { date: 'invalid' }, { date: '2020-05-01' }];
  const r = computeYearRange(details);
  assert.strictEqual(r.start, 2020);
  assert.strictEqual(r.end,   2020);
});

test('computeYearRange: accepts Date key with capital D', () => {
  const r = computeYearRange([{ Date: '2015-11-10' }]);
  assert.strictEqual(r.start, 2015);
  assert.strictEqual(r.end,   2015);
});

// ── escapeHtml ────────────────────────────────────────────────────────────────
test('escapeHtml: escapes < and >', () => {
  assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
});

test('escapeHtml: escapes double quotes', () => {
  assert.strictEqual(escapeHtml('"hello"'), '&quot;hello&quot;');
});

test('escapeHtml: escapes single quotes', () => {
  assert.strictEqual(escapeHtml("it's"), 'it&#39;s');
});

test('escapeHtml: escapes ampersand', () => {
  assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
});

// ── normalizeScoreType ────────────────────────────────────────────────────────
test('normalizeScoreType: con → conversion', () => {
  assert.strictEqual(normalizeScoreType('con'), 'conversion');
});

test('normalizeScoreType: pen → penalty', () => {
  assert.strictEqual(normalizeScoreType('pen'), 'penalty');
});

test('normalizeScoreType: dg → drop goal', () => {
  assert.strictEqual(normalizeScoreType('dg'), 'drop goal');
});

test('normalizeScoreType: tries → try', () => {
  assert.strictEqual(normalizeScoreType('tries'), 'try');
});

test('normalizeScoreType: case-insensitive', () => {
  assert.strictEqual(normalizeScoreType('Conversion'), 'conversion');
  assert.strictEqual(normalizeScoreType('PENALTY'), 'penalty');
});

// ── formatScoreType ───────────────────────────────────────────────────────────
test('formatScoreType: singular try', () => {
  assert.ok(formatScoreType('try', 1, t).includes('try'));
});

test('formatScoreType: plural tries includes count', () => {
  const result = formatScoreType('try', 3, t);
  assert.ok(result.includes('3'), `expected "3" in "${result}"`);
});

// ── getRandomPlayer ───────────────────────────────────────────────────────────
test('getRandomPlayer: always returns a player from the array', () => {
  const players = [{ id: '1' }, { id: '2' }, { id: '3' }];
  for (let i = 0; i < 30; i++) {
    assert.ok(players.includes(getRandomPlayer(players)));
  }
});

// ── getRandomDifferentPlayer ──────────────────────────────────────────────────
test('getRandomDifferentPlayer: returns null for single unique player', () => {
  const player = { id: 'x', total: 50 };
  const result = getRandomDifferentPlayer([player], player);
  assert.strictEqual(result, null);
});

test('getRandomDifferentPlayer: never returns same id and same total', () => {
  const anchor = { id: 'a', total: 100 };
  const others = [
    { id: 'b', total: 80 },
    { id: 'c', total: 60 }
  ];
  const pool = [anchor, ...others];
  for (let i = 0; i < 30; i++) {
    const r = getRandomDifferentPlayer(pool, anchor);
    assert.ok(r.id !== anchor.id || r.total !== anchor.total);
  }
});

// ── runner ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
console.log('\nGame Utils Tests');
for (const { name, fn } of tests) {
  try {
    fn();
    console.log('  ✓', name);
    passed++;
  } catch (err) {
    console.error('  ✗', name);
    console.error('   ', err.message);
    failed++;
  }
}
console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
