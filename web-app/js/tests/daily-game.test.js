import assert from 'node:assert/strict';
import { getTodayDateString, getDailyPlayer, buildGuessHints, buildShareGrid, getHintOfferCandidateFields, pickRandomFields } from '../daily-game.js';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ── Sample players ────────────────────────────────────────────────────────────

const p1 = { id: 'p1', name: 'Antoine Dupont', team: 'France',   total: 312, activityStartYear: 2017, activityEndYear: 2024 };
const p2 = { id: 'p2', name: 'Owen Farrell',   team: 'England',  total: 280, activityStartYear: 2012, activityEndYear: 2023 };
const p3 = { id: 'p3', name: 'Johnny Sexton',  team: 'Ireland',  total: 557, activityStartYear: 2010, activityEndYear: 2023 };
const p4 = { id: 'p4', name: 'Leigh Halfpenny',team: 'Wales',    total: 166, activityStartYear: 2008, activityEndYear: 2019 };

const PLAYERS = [p1, p2, p3, p4];

// ── getTodayDateString ────────────────────────────────────────────────────────

test('getTodayDateString: returns a string matching YYYY-MM-DD', () => {
  const result = getTodayDateString();
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});

test('getTodayDateString: year is current year', () => {
  const result = getTodayDateString();
  assert.strictEqual(Number(result.slice(0, 4)), new Date().getFullYear());
});

test('getTodayDateString: produces consistent results when called twice', () => {
  assert.strictEqual(getTodayDateString(), getTodayDateString());
});

// ── getDailyPlayer ────────────────────────────────────────────────────────────

test('getDailyPlayer: returns null for empty array', () => {
  assert.strictEqual(getDailyPlayer([], '2024-01-01'), null);
});

test('getDailyPlayer: returns null for falsy players', () => {
  assert.strictEqual(getDailyPlayer(null, '2024-01-01'), null);
});

test('getDailyPlayer: returns a player from the array', () => {
  const player = getDailyPlayer(PLAYERS, '2024-01-01');
  assert.ok(PLAYERS.includes(player));
});

test('getDailyPlayer: is deterministic — same date always gives same player', () => {
  const date = '2025-03-15';
  const first  = getDailyPlayer(PLAYERS, date);
  const second = getDailyPlayer(PLAYERS, date);
  assert.strictEqual(first, second);
});

test('getDailyPlayer: different dates can give different players', () => {
  const dates = ['2024-01-01', '2024-06-15', '2025-01-01', '2024-03-07'];
  const picked = new Set(dates.map(d => getDailyPlayer(PLAYERS, d)));
  // With 4 dates and 4 players, it's astronomically unlikely all fall on the same player
  assert.ok(picked.size > 1, 'Expected multiple different players across different dates');
});

test('getDailyPlayer: works with a single-player array', () => {
  assert.strictEqual(getDailyPlayer([p1], '2024-05-20'), p1);
});

test('getDailyPlayer: index is always within bounds', () => {
  const dates = Array.from({ length: 30 }, (_, i) => `2024-${String(i + 1).padStart(2, '0')}-01`);
  for (const d of dates) {
    const player = getDailyPlayer(PLAYERS, d);
    assert.ok(PLAYERS.includes(player), `Player out of bounds for date ${d}`);
  }
});

// ── buildGuessHints ───────────────────────────────────────────────────────────

test('buildGuessHints: isCorrect true when IDs match', () => {
  const hints = buildGuessHints(p1, p1);
  assert.strictEqual(hints.isCorrect, true);
});

test('buildGuessHints: isCorrect false when IDs differ', () => {
  const hints = buildGuessHints(p1, p2);
  assert.strictEqual(hints.isCorrect, false);
});

test('buildGuessHints: team direction "match" when same canonical team', () => {
  const guessed = { ...p1 };
  const target  = { ...p1, id: 'other' };
  assert.strictEqual(buildGuessHints(guessed, target).team.direction, 'match');
});

test('buildGuessHints: team direction "diff" for different teams', () => {
  assert.strictEqual(buildGuessHints(p1, p2).team.direction, 'diff');
});

test('buildGuessHints: team value is the guessed player\'s team', () => {
  const hints = buildGuessHints(p1, p2);
  assert.strictEqual(hints.team.value, p1.team);
});

test('buildGuessHints: points "match" when totals are equal', () => {
  const guessed = { ...p1 };
  const target  = { ...p1, id: 'other' };
  assert.strictEqual(buildGuessHints(guessed, target).points.direction, 'match');
});

test('buildGuessHints: points "up" when target has more points (aim higher)', () => {
  // p2.total=280, p3.total=557 → guessing p2 when target is p3 → should aim up
  const hints = buildGuessHints(p2, p3);
  assert.strictEqual(hints.points.direction, 'up');
});

test('buildGuessHints: points "down" when target has fewer points (aim lower)', () => {
  // p3.total=557, p4.total=166 → guessing p3 when target is p4 → should aim down
  const hints = buildGuessHints(p3, p4);
  assert.strictEqual(hints.points.direction, 'down');
});

test('buildGuessHints: points value is the guessed player\'s total', () => {
  const hints = buildGuessHints(p2, p3);
  assert.strictEqual(hints.points.value, p2.total);
});

test('buildGuessHints: activityStart "match" when years are equal', () => {
  const guessed = { ...p1 };
  const target  = { ...p1, id: 'other' };
  assert.strictEqual(buildGuessHints(guessed, target).activityStart.direction, 'match');
});

test('buildGuessHints: activityStart "up" when target started later (higher year)', () => {
  // p4.start=2008, p1.start=2017 → guessing p4 against p1 → need higher year → "up"
  assert.strictEqual(buildGuessHints(p4, p1).activityStart.direction, 'up');
});

test('buildGuessHints: activityStart "down" when target started earlier (lower year)', () => {
  // p1.start=2017, p3.start=2010 → guessing p1 against p3 → need lower year → "down"
  assert.strictEqual(buildGuessHints(p1, p3).activityStart.direction, 'down');
});

test('buildGuessHints: activityStart "unknown" when either year is null', () => {
  const noYear = { ...p1, activityStartYear: null };
  assert.strictEqual(buildGuessHints(noYear, p1).activityStart.direction, 'unknown');
  assert.strictEqual(buildGuessHints(p1, noYear).activityStart.direction, 'unknown');
});

test('buildGuessHints: activityEnd "match" when years are equal', () => {
  // p2.end=2023, p3.end=2023
  const hints = buildGuessHints(p2, p3);
  assert.strictEqual(hints.activityEnd.direction, 'match');
});

test('buildGuessHints: activityEnd "down" when target ended earlier', () => {
  // p2.end=2023, p4.end=2019 → guessing p2 against p4 → target is lower → "down"
  assert.strictEqual(buildGuessHints(p2, p4).activityEnd.direction, 'down');
});

test('buildGuessHints: activityEnd "unknown" when guessed player has no end year', () => {
  const active = { ...p1, activityEndYear: null };
  assert.strictEqual(buildGuessHints(active, p2).activityEnd.direction, 'unknown');
});

test('buildGuessHints: nameLength "match" when normalized lengths are equal', () => {
  const guessed = { ...p1, name: 'A B' };
  const target  = { ...p2, name: 'AB' };
  assert.strictEqual(buildGuessHints(guessed, target).nameLength.direction, 'match');
});

test('buildGuessHints: nameLength "up" when target name is longer', () => {
  const guessed = { ...p1, name: 'AB' };
  const target  = { ...p2, name: 'ABCD' };
  assert.strictEqual(buildGuessHints(guessed, target).nameLength.direction, 'up');
});

test('buildGuessHints: nameLength "down" when target name is shorter', () => {
  const guessed = { ...p1, name: 'ABCDEF' };
  const target  = { ...p2, name: 'ABC' };
  assert.strictEqual(buildGuessHints(guessed, target).nameLength.direction, 'down');
});

test('buildGuessHints: nameLength value is guessed normalized character count', () => {
  const guessed = { ...p1, name: 'Leigh Halfpenny' };
  const hints = buildGuessHints(guessed, p2);
  assert.strictEqual(hints.nameLength.value, 'LeighHalfpenny'.length);
});

// ── buildShareGrid ────────────────────────────────────────────────────────────

test('buildShareGrid: returns empty string for empty guess list', () => {
  assert.strictEqual(buildShareGrid([]), '');
});

test('buildShareGrid: one correct guess produces a row of green squares', () => {
  const hints = buildGuessHints(p1, p1); // all match
  const grid  = buildShareGrid([{ player: p1, hints }]);
  assert.match(grid, /🟢/);
});

test('buildShareGrid: each row has exactly 5 emoji characters', () => {
  const hints = buildGuessHints(p1, p3);
  const grid  = buildShareGrid([{ player: p1, hints }]);
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
  const emojis = grid.match(emojiRegex);
  assert.strictEqual(emojis.length, 5);
});

test('buildShareGrid: multiple guesses produce multiple lines', () => {
  const g1 = { player: p1, hints: buildGuessHints(p1, p3) };
  const g2 = { player: p2, hints: buildGuessHints(p2, p3) };
  const grid = buildShareGrid([g1, g2]);
  const lines = grid.split('\n');
  assert.strictEqual(lines.length, 2);
});

test('buildShareGrid: a diff-team hint uses ⬜', () => {
  const hints = buildGuessHints(p1, p2); // different teams
  const grid  = buildShareGrid([{ player: p1, hints }]);
  assert.ok(grid.includes('⬜'), 'Expected ⬜ for diff team');
});

test('buildShareGrid: an up hint uses 🔼', () => {
  // p2.total=280, p3.total=557 → points.direction = "up"
  const hints = buildGuessHints(p2, p3);
  const grid  = buildShareGrid([{ player: p2, hints }]);
  assert.ok(grid.includes('🔼'), 'Expected 🔼 for up hint');
});

test('buildShareGrid: a down hint uses 🔽', () => {
  // p3.total=557, p4.total=166 → points.direction = "down"
  const hints = buildGuessHints(p3, p4);
  const grid  = buildShareGrid([{ player: p3, hints }]);
  assert.ok(grid.includes('🔽'), 'Expected 🔽 for down hint');
});

// ── getHintOfferCandidateFields / pickRandomFields ───────────────────────────

test('getHintOfferCandidateFields: excludes already solved fields', () => {
  const solvedTeamGuess = { player: p1, hints: { ...buildGuessHints(p1, p2), team: { direction: 'match', value: p1.team } } };
  const fields = getHintOfferCandidateFields({
    guessList: [solvedTeamGuess],
    targetPlayer: p2,
    revealedFieldKeys: []
  });
  assert.ok(!fields.includes('team'));
});

test('getHintOfferCandidateFields: excludes already revealed fields', () => {
  const fields = getHintOfferCandidateFields({
    guessList: [{ player: p1, hints: buildGuessHints(p1, p2) }],
    targetPlayer: p2,
    revealedFieldKeys: ['points']
  });
  assert.ok(!fields.includes('points'));
});

test('pickRandomFields: returns at most 2 unique fields', () => {
  const fields = pickRandomFields(['team', 'points', 'activityStart', 'activityEnd', 'nameLength'], 2, () => 0.42);
  assert.strictEqual(fields.length, 2);
  assert.strictEqual(new Set(fields).size, 2);
});

test('pickRandomFields: returns all available fields when less than requested', () => {
  const fields = pickRandomFields(['team'], 2, () => 0.42);
  assert.deepStrictEqual(fields, ['team']);
});

// ── Runner ────────────────────────────────────────────────────────────────────

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
