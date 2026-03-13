export function createFiltersController(options) {
  const {
    teamConfig,
    ui,
    t,
    escapeHtml,
    getLocalizedTeamName,
    getCanonicalTeamName,
    onFilteredPlayersChange
  } = options;

  let allPlayers = [];
  let filteredPlayers = [];
  let minAvailableYear = 1971;
  let maxAvailableYear = 2026;
  let selectedYearStart = 1971;
  let selectedYearEnd = 2026;
  let selectedTeams = new Set(Object.keys(teamConfig));
  let filtersPanelOpen = false;

  function getFilteredPlayers() {
    return filteredPlayers;
  }

  function updateFiltersPanelUI() {
    if (ui.filtersToggleBtn) {
      ui.filtersToggleBtn.textContent = filtersPanelOpen ? t('filtersClose') : t('filtersOpen');
      ui.filtersToggleBtn.setAttribute('aria-expanded', String(filtersPanelOpen));
    }

    if (ui.filtersPanel) {
      ui.filtersPanel.classList.toggle('collapsed', !filtersPanelOpen);
    }
  }

  function setFiltersPanelOpen(isOpen) {
    filtersPanelOpen = Boolean(isOpen);
    updateFiltersPanelUI();
  }

  function updateFilterYearsDisplay() {
    if (ui.yearStartValue) ui.yearStartValue.textContent = String(selectedYearStart);
    if (ui.yearEndValue) ui.yearEndValue.textContent = String(selectedYearEnd);
  }

  function updateFilterSummary() {
    if (!ui.filtersSummary) {
      return;
    }

    ui.filtersSummary.textContent = t('filtersSummary', { count: filteredPlayers.length });
  }

  function renderTeamFilters() {
    if (!ui.teamFiltersContainer) {
      return;
    }

    const teams = Object.keys(teamConfig);
    ui.teamFiltersContainer.innerHTML = teams
      .map((teamName) => {
        const checked = selectedTeams.has(teamName) ? 'checked' : '';
        return `
          <label class="team-chip" data-team="${teamName}">
            <input type="checkbox" class="team-filter-input" value="${teamName}" ${checked}>
            <span class="team-chip-name">${escapeHtml(getLocalizedTeamName(teamName, t))}</span>
          </label>
        `;
      })
      .join('');
  }

  function playerMatchesFilters(player) {
    if (!selectedTeams.has(getCanonicalTeamName(player.team) || String(player.team))) {
      return false;
    }

    if (Number.isInteger(player.activityStartYear) && Number.isInteger(player.activityEndYear)) {
      return player.activityEndYear >= selectedYearStart && player.activityStartYear <= selectedYearEnd;
    }

    return true;
  }

  function applyPlayerFilters(restartGame = true) {
    filteredPlayers = allPlayers.filter((player) => playerMatchesFilters(player));
    updateFilterSummary();
    onFilteredPlayersChange(filteredPlayers, restartGame);
  }

  function resetFilters() {
    selectedYearStart = minAvailableYear;
    selectedYearEnd = maxAvailableYear;
    selectedTeams = new Set(Object.keys(teamConfig));

    if (ui.yearStartInput) ui.yearStartInput.value = String(selectedYearStart);
    if (ui.yearEndInput) ui.yearEndInput.value = String(selectedYearEnd);

    updateFilterYearsDisplay();
    renderTeamFilters();
    applyPlayerFilters(true);
  }

  function initialize(playersInput) {
    allPlayers = Array.isArray(playersInput) ? playersInput : [];

    const validStarts = allPlayers
      .map((p) => p.activityStartYear)
      .filter((value) => Number.isInteger(value));
    const validEnds = allPlayers
      .map((p) => p.activityEndYear)
      .filter((value) => Number.isInteger(value));

    minAvailableYear = validStarts.length ? Math.min(...validStarts) : 1971;
    maxAvailableYear = validEnds.length ? Math.max(...validEnds) : 2026;
    selectedYearStart = minAvailableYear;
    selectedYearEnd = maxAvailableYear;
    selectedTeams = new Set(Object.keys(teamConfig));

    if (ui.yearStartInput && ui.yearEndInput) {
      ui.yearStartInput.min = String(minAvailableYear);
      ui.yearStartInput.max = String(maxAvailableYear);
      ui.yearStartInput.value = String(selectedYearStart);
      ui.yearEndInput.min = String(minAvailableYear);
      ui.yearEndInput.max = String(maxAvailableYear);
      ui.yearEndInput.value = String(selectedYearEnd);
    }

    updateFilterYearsDisplay();
    renderTeamFilters();
    applyPlayerFilters(false);
    setFiltersPanelOpen(false);
  }

  function bindEvents() {
    if (ui.yearStartInput) {
      ui.yearStartInput.addEventListener('input', (event) => {
        selectedYearStart = Number(event.target.value);
        if (selectedYearStart > selectedYearEnd) {
          selectedYearEnd = selectedYearStart;
          if (ui.yearEndInput) ui.yearEndInput.value = String(selectedYearEnd);
        }
        updateFilterYearsDisplay();
        applyPlayerFilters(true);
      });
    }

    if (ui.yearEndInput) {
      ui.yearEndInput.addEventListener('input', (event) => {
        selectedYearEnd = Number(event.target.value);
        if (selectedYearEnd < selectedYearStart) {
          selectedYearStart = selectedYearEnd;
          if (ui.yearStartInput) ui.yearStartInput.value = String(selectedYearStart);
        }
        updateFilterYearsDisplay();
        applyPlayerFilters(true);
      });
    }

    if (ui.teamsAllBtn) {
      ui.teamsAllBtn.addEventListener('click', () => {
        selectedTeams = new Set(Object.keys(teamConfig));
        renderTeamFilters();
        applyPlayerFilters(true);
      });
    }

    if (ui.filtersResetBtn) {
      ui.filtersResetBtn.addEventListener('click', () => {
        resetFilters();
      });
    }

    if (ui.filtersToggleBtn) {
      ui.filtersToggleBtn.addEventListener('click', () => {
        setFiltersPanelOpen(!filtersPanelOpen);
      });
    }

    if (ui.teamFiltersContainer) {
      ui.teamFiltersContainer.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.classList.contains('team-filter-input')) {
          return;
        }

        const teamName = target.value;
        if (target.checked) {
          selectedTeams.add(teamName);
        } else {
          if (selectedTeams.size <= 1) {
            target.checked = true;
            return;
          }
          selectedTeams.delete(teamName);
        }
        applyPlayerFilters(true);
      });
    }
  }

  function updateTranslations() {
    if (ui.filtersTitle) ui.filtersTitle.textContent = t('filtersTitle');
    if (ui.filterYearsLabel) ui.filterYearsLabel.textContent = t('filtersYears');
    if (ui.filterYearStartLabel) ui.filterYearStartLabel.textContent = t('filtersYearFrom');
    if (ui.filterYearEndLabel) ui.filterYearEndLabel.textContent = t('filtersYearTo');
    if (ui.filterTeamsLabel) ui.filterTeamsLabel.textContent = t('filtersTeams');
    if (ui.teamsAllBtn) ui.teamsAllBtn.textContent = t('filtersAll');
    if (ui.filtersResetBtn) ui.filtersResetBtn.textContent = t('filtersReset');
    updateFiltersPanelUI();
    updateFilterYearsDisplay();
    renderTeamFilters();
    updateFilterSummary();
  }

  return {
    initialize,
    bindEvents,
    updateTranslations,
    getFilteredPlayers
  };
}
