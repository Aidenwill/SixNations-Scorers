import assert from 'node:assert/strict';
import { pickWinner, isChoiceCorrect, getNextRoundState } from '../game-engine.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const pA = { id: 'a', name: 'Alpha', team: 'France',  total: 100 };
const pB = { id: 'b', name: 'Beta',  team: 'England', total:  80 };
const pC = { id: 'c', name: 'Gamma', team: 'Wales',   total:  60 };

// ── pickWinner ────────────────────────────────────────────────────────────────
test('pickWinner: returns player with higher total', () => {
  assert.strictEqual(pickWinner(pA, pB), pA);
  assert.strictEqual(pickWinner(pB, pA), pA);
});

test('pickWinner: returns first player when totals are equal', () => {
  const p1 = { ...pA, total: 100 };
  const p2 = { ...pB, total: 100 };
  assert.strictEqual(pickWinner(p1, p2), p1);
});

// ── isChoiceCorrect ───────────────────────────────────────────────────────────
test('isChoiceCorrect: choice 1 correct when playerA wins', () => {
  assert.ok( isChoiceCorrect(1, pA, pA, pB));
  assert.ok(!isChoiceCorrect(2, pA, pA, pB));
});

test('isChoiceCorrect: choice 2 correct when playerB wins', () => {
  assert.ok( isChoiceCorrect(2, pB, pA, pB));
  assert.ok(!isChoiceCorrect(1, pB, pA, pB));
});

// ── getNextRoundState ─────────────────────────────────────────────────────────
test('getNextRoundState: current wins, stays below maxStay', () => {
  const r = getNextRoundState({
    currentPlayer: pA,
    opponentPlayer: pB,
    previousWinner: pA,
    consecutiveRounds: 1,
    maxStay: 2,
    getRandomOpponent: () => pC
  });
  assert.strictEqual(r.currentPlayer, pA);
  assert.strictEqual(r.opponentPlayer, pC);
  assert.strictEqual(r.consecutiveRounds, 2);
});

test('getNextRoundState: current wins and reaches maxStay, opponent becomes anchor', () => {
  const r = getNextRoundState({
    currentPlayer: pA,
    opponentPlayer: pB,
    previousWinner: pA,
    consecutiveRounds: 2,
    maxStay: 2,
    getRandomOpponent: () => pC
  });
  assert.strictEqual(r.currentPlayer, pB);
  assert.strictEqual(r.opponentPlayer, pC);
  assert.strictEqual(r.consecutiveRounds, 1);
});

test('getNextRoundState: challenger wins and becomes new anchor', () => {
  const r = getNextRoundState({
    currentPlayer: pA,
    opponentPlayer: pB,
    previousWinner: pB,
    consecutiveRounds: 1,
    maxStay: 2,
    getRandomOpponent: () => pC
  });
  assert.strictEqual(r.currentPlayer, pB);
  assert.strictEqual(r.opponentPlayer, pC);
  assert.strictEqual(r.consecutiveRounds, 1);
});

// ── runner ────────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
console.log('\nGame Engine Tests');
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
