export function showPlayerDetailsModal(options) {
  const {
    player,
    t,
    escapeHtml,
    getLocalizedTeamName,
    getTeamConfig,
    normalizeScoreType,
    formatScoreType
  } = options;

  if (!player) return;

  let detailsHTML = `
    <div class="player-details-modal">
      <div class="modal-content">
        <h3>${escapeHtml(t('playerDetailsTitle'))}: ${escapeHtml(player.name)} (${escapeHtml(getLocalizedTeamName(player.team, t))})</h3>
        <p><strong>${escapeHtml(t('totalPoints'))}:</strong> ${player.total}</p>
  `;

  if (player.details && Array.isArray(player.details) && player.details.length > 0) {
    const byDate = new Map();
    player.details.forEach((d) => {
      const date = d.date || d.Date || 'N/A';
      const points = Number(d.points || d.Points || 0);
      const type = normalizeScoreType(d.type || d.Type || 'Unknown');
      const opponent = d.opponent || d.Opponent || null;
      if (!byDate.has(date)) byDate.set(date, { total: 0, types: new Map(), opponents: new Set() });
      const entry = byDate.get(date);
      entry.total += points;
      entry.types.set(type, (entry.types.get(type) || 0) + 1);
      if (opponent) entry.opponents.add(String(opponent));
    });

    detailsHTML += '<h4>' + escapeHtml(t('scoringHistory')) + ':</h4><ul>';
    byDate.forEach((entry, date) => {
      const typeSummary = Array.from(entry.types.entries())
        .map(([type, count]) => formatScoreType(type, count, t))
        .join(', ');

      const opponentFlagImages = Array.from(entry.opponents)
        .map((teamName) => {
          if (!getTeamConfig) return null;
          const cfg = getTeamConfig(teamName);
          if (!cfg?.logo) return null;
          const localizedName = getLocalizedTeamName(teamName, t);
          return `<img class="details-opponent-flag" src="${escapeHtml(cfg.logo)}" alt="${escapeHtml(localizedName)}" title="${escapeHtml(localizedName)}" loading="lazy" decoding="async" />`;
        })
        .filter(Boolean)
        .join('');
      const flagsBlock = opponentFlagImages ? ` <span class="details-opponent-flags" title="${escapeHtml(Array.from(entry.opponents).join(', '))}">${opponentFlagImages}</span> ` : '';

      detailsHTML += `<li>${escapeHtml(date)}${flagsBlock}  ${entry.total} ${escapeHtml(t('pointsWord'))} (${escapeHtml(typeSummary)})</li>`;
    });
    detailsHTML += '</ul>';
  } else {
    detailsHTML += '<p><em>' + escapeHtml(t('noScoringHistory')) + '</em></p>';
  }

  detailsHTML += `
        <button class="btn primary close-modal">${escapeHtml(t('close'))}</button>
      </div>
    </div>
  `;

  const existingModal = document.querySelector('.player-details-modal');
  if (existingModal) existingModal.remove();

  document.body.insertAdjacentHTML('beforeend', detailsHTML);

  const closeBtn = document.querySelector('.close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.querySelector('.player-details-modal');
      if (modal) modal.remove();
    });
  }
}
