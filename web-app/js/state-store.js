export function createGameState() {
  return {
    allPlayers: [],
    players: [],
    currentPlayer: null,
    opponentPlayer: null,
    streak: 0,
    bestStreak: 0,
    roundsPlayed: 0,
    consecutiveRounds: 0,
    revealedPlayerIds: new Set(),
    currentLanguage: 'fr',
    showActivity: true,
    currentStreakTeams: [],
    bestStreakTeams: []
  };
}

export function resetRoundState(state) {
  state.streak = 0;
  state.bestStreak = 0;
  state.roundsPlayed = 0;
  state.consecutiveRounds = 0;
  state.currentPlayer = null;
  state.opponentPlayer = null;
  state.revealedPlayerIds = new Set();
  state.currentStreakTeams = [];
  state.bestStreakTeams = [];
}
