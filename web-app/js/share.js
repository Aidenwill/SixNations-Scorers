export function createShareController(options) {
  const { ui, t, getBestStreakFlagsSummary, getStateSnapshot } = options;
  let feedbackTimeout = null;

  function buildShareSummary() {
    const state = getStateSnapshot();
    return t('shareSummary', {
      round: state.roundsPlayed,
      streak: state.streak,
      bestStreak: state.bestStreak,
      activity: state.showActivity ? t('activityVisibleState') : t('activityHiddenState'),
      bestFlagsLabel: t('bestFlagsLabel'),
      flags: getBestStreakFlagsSummary()
    });
  }

  function setShareButtonFeedback(labelKey) {
    if (!ui.shareScoreBtn) {
      return;
    }

    ui.shareScoreBtn.textContent = t(labelKey);
    if (feedbackTimeout) {
      clearTimeout(feedbackTimeout);
    }

    feedbackTimeout = setTimeout(() => {
      ui.shareScoreBtn.textContent = t('share');
      feedbackTimeout = null;
    }, 1600);
  }

  async function shareCurrentScore() {
    const summary = buildShareSummary();

    try {
      await navigator.clipboard.writeText(summary);
      setShareButtonFeedback('copied');
    } catch (error) {
      console.error(error);
      setShareButtonFeedback('copyFailed');
    }
  }

  function bindEvents() {
    if (!ui.shareScoreBtn) {
      return;
    }

    ui.shareScoreBtn.addEventListener('click', () => {
      shareCurrentScore();
    });
  }

  return {
    bindEvents,
    shareCurrentScore
  };
}
