export function pickWinner(playerA, playerB) {
  return playerA.total >= playerB.total ? playerA : playerB;
}

export function isChoiceCorrect(choice, winner, playerA, playerB) {
  return (choice === 1 && winner.id === playerA.id) || (choice === 2 && winner.id === playerB.id);
}

export function getNextRoundState(options) {
  const {
    currentPlayer,
    opponentPlayer,
    previousWinner,
    consecutiveRounds,
    maxStay,
    getRandomOpponent
  } = options;

  const previousCurrentWon = previousWinner.id === currentPlayer.id;

  if (previousCurrentWon) {
    if (consecutiveRounds >= maxStay) {
      const nextCurrent = opponentPlayer;
      return {
        currentPlayer: nextCurrent,
        opponentPlayer: nextCurrent ? getRandomOpponent(nextCurrent) : null,
        consecutiveRounds: 1
      };
    }

    const nextCurrent = previousWinner;
    return {
      currentPlayer: nextCurrent,
      opponentPlayer: getRandomOpponent(nextCurrent),
      consecutiveRounds: consecutiveRounds + 1
    };
  }

  const nextCurrent = previousWinner;
  return {
    currentPlayer: nextCurrent,
    opponentPlayer: getRandomOpponent(nextCurrent),
    consecutiveRounds: 1
  };
}
