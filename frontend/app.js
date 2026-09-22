(function () {
  const GENDER_STORAGE_KEY = "dnd-character-builder.selectedGender";
  const SPECIES_STORAGE_KEY = "dnd-character-builder.selectedSpecies";
  const SUB_SPECIES_STORAGE_KEY = "dnd-character-builder.selectedSubSpecies";
  const CLASS_COMBO_STORAGE_KEY = "dnd-character-builder.selectedClassCombo";
  const COMBAT_ROLES_STORAGE_KEY = "dnd-character-builder.combatRoles";
  const OUT_OF_COMBAT_ROLES_STORAGE_KEY = "dnd-character-builder.outOfCombatRoles";
  const SOURCE_MODE_STORAGE_KEY = "dnd-character-builder.sourceMode";
  const CLASS_SOURCE_MODE_STORAGE_KEY = "dnd-character-builder.classSourceMode";
  const DRAGONMARKED_STORAGE_KEY = "dnd-character-builder.enableDragonmarked";
  const SOURCE_MODES = [
    {
      id: "2024",
      name: "Mode 1: 2024-appropriate",
      description: "Enable sub-species marked TRUE for 2024-appropriate Sub-species.",
      field: "2024-appropriate Sub-species",
    },
    {
      id: "all",
      name: "Mode 2: Everything",
      description: "Enable every sub-species in the catalog.",
      field: null,
    },
    {
      id: "5e",
      name: "Mode 3: 5E-compatible",
      description: "Enable sub-species marked TRUE for 5E-compatible Sub-species.",
      field: "5E-compatible Sub-species",
    },
  ];
  const CLASS_SOURCE_MODES = [
    {
      id: "latest",
      name: "Latest class and subclass sources",
      description: "Exclude 5E classes, Critical Role material, and legacy subclasses.",
    },
    {
      id: "all",
      name: "Everything",
      description: "Enable every class and subclass in the catalog.",
    },
    {
      id: "5e",
      name: "5E-compatible",
      description: "Enable 5E classes and legacy subclasses.",
    },
  ];
  const GENDER_OPTIONS = [
    { id: "male", name: "Male" },
    { id: "female", name: "Female" },
    { id: "androgynous", name: "Androgynous" },
  ];
  const COMBAT_ROLES = ["Strike", "Blast", "Tank", "Control", "Healer", "Support"];
  const OUT_OF_COMBAT_ROLES = [
    "Face",
    "Scout",
    "Investigator",
    "Scholar",
    "Explorer",
    "Utility",
  ];
  const PRIORITY_THRESHOLDS = [4, 3, 2];
  const OFFICIAL_EXTENDED_SOURCES = new Set([
    "Dungeon Master’s Guide (2014)",
    "Dungeon Master's Guide (2014)",
    "Elemental Evil Player's Companion",
    "Mordenkainen Presents: Monsters of the Multiverse",
    "Tasha’s Cauldron of Everything",
    "Tasha's Cauldron of Everything",
    "Van Richten’s Guide to Ravenloft",
    "Van Richten's Guide to Ravenloft",
    "Eberron: Rising from the Last War",
    "Eberron: Forge of the Artificer",
    "Sword Coast Adventurer’s Guide",
    "Sword Coast Adventurer's Guide",
  ]);

  const screens = {
    landing: document.querySelector("#landing-screen"),
    settings: document.querySelector("#settings-screen"),
    subSpeciesSettings: document.querySelector("#sub-species-settings-screen"),
    enabledSources: document.querySelector("#enabled-sources-screen"),
    classSettings: document.querySelector("#class-settings-screen"),
    classEnabledSources: document.querySelector("#class-enabled-sources-screen"),
    app: document.querySelector("#app-shell"),
  };

  const elements = {
    startButton: document.querySelector("#start-button"),
    settingsButton: document.querySelector("#settings-button"),
    subSpeciesSettingsButton: document.querySelector("#sub-species-settings-button"),
    classSettingsButton: document.querySelector("#class-settings-button"),
    enabledSourcesButton: document.querySelector("#enabled-sources-button"),
    settingsBackButton: document.querySelector("#settings-back-button"),
    subSpeciesSettingsBackButton: document.querySelector("#sub-species-settings-back-button"),
    enabledSourcesBackButton: document.querySelector("#enabled-sources-back-button"),
    classEnabledSourcesButton: document.querySelector("#class-enabled-sources-button"),
    classSettingsBackButton: document.querySelector("#class-settings-back-button"),
    classEnabledSourcesBackButton: document.querySelector("#class-enabled-sources-back-button"),
    classSourceModeList: document.querySelector("#class-source-mode-list"),
    classSettingsSummary: document.querySelector("#class-settings-summary"),
    classEnabledSourcesSummary: document.querySelector("#class-enabled-sources-summary"),
    sourceModeList: document.querySelector("#source-mode-list"),
    enabledSourcesSummary: document.querySelector("#enabled-sources-summary"),
    dragonmarkedToggle: document.querySelector("#dragonmarked-toggle"),
    backToHome: document.querySelector("#back-to-home"),
    genderSelector: document.querySelector("#gender-selector"),
    genderStatus: document.querySelector("#gender-status"),
    speciesGallery: document.querySelector("#species-gallery"),
    galleryPrevious: document.querySelector("#gallery-previous"),
    galleryNext: document.querySelector("#gallery-next"),
    selectionStatus: document.querySelector("#selection-status"),
    subSpeciesPanel: document.querySelector("#sub-species-panel"),
    subSpeciesSelector: document.querySelector("#sub-species-selector"),
    subSpeciesStatus: document.querySelector("#sub-species-status"),
    classSection: document.querySelector("#class"),
    combatRoleSelector: document.querySelector("#combat-role-selector"),
    combatRoleCount: document.querySelector("#combat-role-count"),
    combatRoleStatus: document.querySelector("#combat-role-status"),
    outOfCombatRoleSelector: document.querySelector("#out-of-combat-role-selector"),
    outOfCombatRoleCount: document.querySelector("#out-of-combat-role-count"),
    outOfCombatRoleStatus: document.querySelector("#out-of-combat-role-status"),
    comboResults: document.querySelector("#combo-results"),
    comboResultsStatus: document.querySelector("#combo-results-status"),
    comboList: document.querySelector("#combo-list"),
  };

  let catalog = [];
  let groupManifest = { groups: [] };
  let selectedGender = localStorage.getItem(GENDER_STORAGE_KEY);
  let selectedSpeciesId = localStorage.getItem(SPECIES_STORAGE_KEY);
  let selectedSubSpeciesId = localStorage.getItem(SUB_SPECIES_STORAGE_KEY);
  let selectedClassCombo = JSON.parse(localStorage.getItem(CLASS_COMBO_STORAGE_KEY) || "null");
  let selectedCombatRoles = JSON.parse(localStorage.getItem(COMBAT_ROLES_STORAGE_KEY) || "[]");
  let selectedOutOfCombatRoles = JSON.parse(
    localStorage.getItem(OUT_OF_COMBAT_ROLES_STORAGE_KEY) || "[]",
  );
  let selectedSourceModeId = localStorage.getItem(SOURCE_MODE_STORAGE_KEY) || "2024";
  let selectedClassSourceModeId =
    localStorage.getItem(CLASS_SOURCE_MODE_STORAGE_KEY) || "latest";
  let enableDragonmarked = localStorage.getItem(DRAGONMARKED_STORAGE_KEY) === "true";
  let classCombos = [];

  function slugify(value) {
    return value
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function showScreen(screenName) {
    Object.entries(screens).forEach(([name, screen]) => {
      screen.hidden = name !== screenName;
      screen.classList.toggle("active", name === screenName);
    });
  }

  function getDescription(name, visibleCatalog = getVisibleCatalog()) {
    const entry = visibleCatalog.find(
      (option) =>
        slugify(option.subSpecies || option.species) === slugify(name) &&
        option.description,
    );
    return entry?.description || `${name} player option.`;
  }

  function getSpeciesGroups() {
    const visibleCatalog = getVisibleCatalog();
    const catalogNames = new Set(visibleCatalog.map((option) => slugify(option.species)));
    const groups = groupManifest.groups
      .filter((group) => catalogNames.has(slugify(group.name)))
      .map((group) => ({
        ...group,
        subSpecies: getSubSpecies(group.name, visibleCatalog),
        description: getDescription(group.name, visibleCatalog),
      }));

    const speciesGroups = groups.length
      ? groups
      : visibleCatalog.map((option) => ({
          id: slugify(option.species),
          name: option.species,
          subSpecies: getSubSpecies(option.species, visibleCatalog),
          description: getDescription(option.species, visibleCatalog),
          imageVariants: {},
        }));

    return speciesGroups
      .map((group, index) => ({
        group,
        index,
        sortRank: getSpeciesSortRank(group, visibleCatalog),
      }))
      .sort((first, second) => first.sortRank - second.sortRank || first.index - second.index)
      .map(({ group }) => group);
  }

  function getSpeciesSortRank(group, visibleCatalog) {
    const name = slugify(group.name);
    const priorityNames = { human: 0, elf: 1, dwarf: 2 };
    if (name in priorityNames) {
      return priorityNames[name];
    }

    const sources = visibleCatalog
      .filter((option) => slugify(option.species) === name)
      .map((option) => option.Source);
    if (sources.some((source) => /player[’']s handbook/i.test(source))) {
      return 3;
    }
    if (sources.some((source) => OFFICIAL_EXTENDED_SOURCES.has(source))) {
      return 4;
    }
    return 5;
  }

  function getVisibleCatalog() {
    const mode = SOURCE_MODES.find((option) => option.id === selectedSourceModeId) || SOURCE_MODES[0];
    return catalog.filter((option) => {
      const name = option.subSpecies?.trim();
      const isDragonmarked = /mark of/i.test(name || "");
      if (!name || (isDragonmarked && !enableDragonmarked)) {
        return false;
      }
      if (isDragonmarked) {
        return true;
      }
      return !mode.field || option[mode.field] === "TRUE";
    });
  }

  function getVisibleClassCombos() {
    if (selectedClassSourceModeId === "all") {
      return classCombos;
    }

    if (selectedClassSourceModeId === "5e") {
      return classCombos.filter(
        (combo) => combo.classRuleset === "5E" || /^5e /i.test(combo.subclassSourceGroup),
      );
    }

    const latestCombos = classCombos.filter(
      (combo) =>
        combo.classRuleset !== "5E" &&
        combo.subclassSourceGroup !== "Critical Role" &&
        !combo.sources.includes("Critical Role"),
    );
    const fiveECombos = classCombos.filter(
      (combo) =>
        combo.classRuleset === "5E" &&
        combo.sources.length > 1 &&
        combo.subclassSourceGroup !== "Critical Role" &&
        !combo.sources.includes("Critical Role"),
    );
    const seenSubclasses = new Set();
    return latestCombos
      .map((combo) => {
        if (combo.classRuleset !== "5.5E" || combo.sources.length > 1) {
          return combo;
        }

        const subclassName = combo.subclassName.replace(/\s*\(Legacy\)$/i, "").trim();
        const matchingFiveECombo = fiveECombos.find(
          (fiveECombo) =>
            fiveECombo.className === combo.className &&
            fiveECombo.subclassName.replace(/\s*\(Legacy\)$/i, "").trim() === subclassName,
        );
        if (!matchingFiveECombo) {
          return combo;
        }

        return {
          ...combo,
          sources: [combo.sources[0], ...matchingFiveECombo.sources.slice(1)],
        };
      })
      .filter((combo) => {
      const subclassName = combo.subclassName.replace(/\s*\(Legacy\)$/i, "").trim();
      const subclassKey = `${combo.className}:${subclassName}`;
      if (seenSubclasses.has(subclassKey)) {
        return false;
      }
      seenSubclasses.add(subclassKey);
      return true;
      });
  }

  function getSubSpecies(speciesName, visibleCatalog = getVisibleCatalog()) {
    const options = visibleCatalog
      .filter((option) => slugify(option.species) === slugify(speciesName))
      .map((option) => {
        const name = option.subSpecies?.trim();
        return name
          ? {
              id: slugify(`${name}-${option.Source}`),
              name,
              source: option.Source || "Source not listed",
              sourceAcronym: option["Source Acronym"],
              releaseDate: option["Source Release Date"],
            }
          : null;
      })
      .filter(Boolean);

    const phb2024Dates = options
      .filter((option) => option.sourceAcronym === "PHB24")
      .map((option) => option.releaseDate)
      .filter(Boolean);
    const latestDate = phb2024Dates.length
      ? Math.min(...phb2024Dates.map(Number))
      : Math.max(...options.map((option) => Number(option.releaseDate) || 0));

    return options
      .map((option) => ({
        ...option,
        isLatest: Number(option.releaseDate) >= latestDate,
      }))
      .sort((first, second) => {
        const releaseDateDifference =
          Number(second.releaseDate) - Number(first.releaseDate);

        if (releaseDateDifference !== 0) {
          return releaseDateDifference;
        }

        return first.name.localeCompare(second.name, undefined, {
          sensitivity: "base",
        });
      });
  }

  function parseSubSpeciesCsv(csv) {
    const lines = csv.trim().split(/\r?\n/);
    const headers = lines.shift().split(",");

    return lines.map((line) => {
      const values = line.split(",");
      const row = headers.reduce((result, header, index) => {
        result[header] = values[index]?.trim() || "";
        return result;
      }, {});

      return {
        ...row,
        species: row.Species,
        subSpecies: row["Sub-species"],
      };
    });
  }

  function getGroupImagePath(group, gender) {
    return group.imageVariants?.[gender] || `./assets/species/${group.id}-${gender}.png`;
  }

  function renderSpeciesGallery() {
    const groups = getSpeciesGroups();
    elements.speciesGallery.innerHTML = "";
    elements.speciesGallery.classList.toggle("inactive", !selectedGender);

    if (!selectedGender) {
      elements.selectionStatus.textContent = "Choose a gender to load the species carousel.";
      return;
    }

    groups.forEach((group) => {
      const card = document.createElement("button");
      card.className = "species-card";
      card.type = "button";
      card.dataset.speciesGroupId = group.id;
      card.setAttribute("aria-label", `Choose ${group.name}`);
      card.setAttribute("aria-pressed", String(group.id === selectedSpeciesId));

      const image = document.createElement("img");
      image.src = getGroupImagePath(group, selectedGender);
      image.alt = "";
      image.loading = "eager";
      image.draggable = false;
      image.addEventListener("error", () => image.remove());

      const media = document.createElement("div");
      media.className = "species-card-media";
      media.appendChild(image);

      const copy = document.createElement("div");
      copy.className = "species-card-copy";
      copy.innerHTML = `<strong>${group.name}</strong><p>${group.description}</p>`;

      card.append(media, copy);
      card.addEventListener("click", () => {
        selectedSpeciesId = group.id;
        selectedSubSpeciesId = null;
        selectedClassCombo = null;
        localStorage.setItem(SPECIES_STORAGE_KEY, selectedSpeciesId);
        localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
        localStorage.removeItem(CLASS_COMBO_STORAGE_KEY);
        updateSpeciesSelection();
        renderSubSpeciesSelector(group);
      });
      elements.speciesGallery.appendChild(card);
    });

    updateSpeciesSelection();
  }

  function updateSpeciesSelection() {
    elements.speciesGallery.querySelectorAll(".species-card").forEach((card) => {
      const isSelected = card.dataset.speciesGroupId === selectedSpeciesId;
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });
    elements.selectionStatus.textContent = selectedSpeciesId
      ? "Species selected."
      : "Choose a species.";

    const selectedGroup = getSpeciesGroups().find((group) => group.id === selectedSpeciesId);
    renderSubSpeciesSelector(selectedGroup);
  }

  function renderSubSpeciesSelector(group) {
    elements.subSpeciesSelector.innerHTML = "";
    elements.subSpeciesPanel.hidden = !group;

    if (!group) {
      renderClassSection();
      return;
    }

    const options = [...new Map(group.subSpecies.map((option) => [option.id, option])).values()];
    if (options.length <= 1) {
      if (options.length === 1) {
        selectedSubSpeciesId = options[0].id;
        localStorage.setItem(SUB_SPECIES_STORAGE_KEY, selectedSubSpeciesId);
      } else {
        selectedSubSpeciesId = null;
        localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
      }
      elements.subSpeciesPanel.hidden = true;
      elements.subSpeciesStatus.textContent = "No sub-species listed.";
      renderClassSection();
      return;
    }

    options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "sub-species-option";
      button.type = "button";
      button.innerHTML = `<strong>${option.name}</strong><span>${option.source}</span>${
        option.isLatest ? '<em>Latest</em>' : ""
      }`;
      button.setAttribute("aria-pressed", String(option.id === selectedSubSpeciesId));
      button.addEventListener("click", () => {
        selectedSubSpeciesId = option.id;
        localStorage.setItem(SUB_SPECIES_STORAGE_KEY, selectedSubSpeciesId);
        selectedClassCombo = null;
        localStorage.removeItem(CLASS_COMBO_STORAGE_KEY);
        renderSubSpeciesSelector(group);
      });
      elements.subSpeciesSelector.appendChild(button);
    });

    const selectedOption = options.find((option) => option.id === selectedSubSpeciesId);
    elements.subSpeciesStatus.textContent = selectedOption
      ? `${selectedOption.name} selected.`
      : "Choose a sub-species.";
    renderClassSection();
  }

  function renderRoleQuestion(container, roles, selectedRoles, storageKey, countElement, statusElement) {
    container.innerHTML = "";
    roles.forEach((role) => {
      const button = document.createElement("button");
      button.className = "role-option";
      button.type = "button";
      const roleIndex = selectedRoles.indexOf(role);
      button.textContent = roleIndex >= 0 ? `${roleIndex + 1}. ${role}` : role;
      button.setAttribute("aria-pressed", String(roleIndex >= 0));
      button.addEventListener("click", () => {
        const selectedRoleIndex = selectedRoles.indexOf(role);
        if (selectedRoleIndex >= 0) {
          selectedRoles.splice(selectedRoleIndex, 1);
        } else if (selectedRoles.length < 3) {
          selectedRoles.push(role);
        }
        localStorage.setItem(storageKey, JSON.stringify(selectedRoles));
        renderClassSection();
      });
      container.appendChild(button);
    });
    countElement.textContent = `${selectedRoles.length} / 3`;
    statusElement.textContent = selectedRoles.length
      ? `${selectedRoles.map((role, index) => `${index + 1}. ${role}`).join(", ")} selected in priority order.`
      : "No preference; all options remain eligible.";
  }

  function getMatchingCombos() {
    const getRoleScore = (ratings, roles) =>
      roles.reduce(
        (score, role, index) => score + (ratings[role] || 0) * (PRIORITY_THRESHOLDS.length - index),
        0,
      );
    const meetsRoleThresholds = (ratings, roles) =>
      roles.every((role, index) => (ratings[role] || 0) >= PRIORITY_THRESHOLDS[index]);
    const matchesPriorities = (combo) =>
      meetsRoleThresholds(combo.combatRatings, selectedCombatRoles) &&
      meetsRoleThresholds(combo.outOfCombatRatings, selectedOutOfCombatRoles);
    const scoreCombo = (combo) =>
      getRoleScore(combo.combatRatings, selectedCombatRoles) +
      getRoleScore(combo.outOfCombatRatings, selectedOutOfCombatRoles);

    return [...getVisibleClassCombos()]
      .filter(matchesPriorities)
      .map((combo) => ({ ...combo, score: scoreCombo(combo) }))
      .sort((first, second) => second.score - first.score || first.comboName.localeCompare(second.comboName));
  }

  function getMaximumPriorityScore() {
    const maximumRoleScore = (roles) =>
      roles.reduce(
        (score, role, index) => score + 5 * (PRIORITY_THRESHOLDS.length - index),
        0,
      );
    return maximumRoleScore(selectedCombatRoles) + maximumRoleScore(selectedOutOfCombatRoles);
  }

  function renderComboResults() {
    const matches = getMatchingCombos();
    const groupedCombos = [...new Map(matches.map((combo) => [combo.comboName, []])).entries()];
    matches.forEach((combo) => {
      groupedCombos.find(([name]) => name === combo.comboName)[1].push(combo);
    });
    elements.comboList.innerHTML = "";
    elements.comboResults.hidden = false;
    const preferenceText = selectedCombatRoles.length || selectedOutOfCombatRoles.length
      ? "ranked by your priorities"
      : "all options shown because no priorities were selected";
    elements.comboResultsStatus.textContent = `${groupedCombos.length} combo${groupedCombos.length === 1 ? "" : "s"}; ${preferenceText}.`;
    const maximumPriorityScore = getMaximumPriorityScore();

    groupedCombos.forEach(([comboName, variants]) => {
      const group = document.createElement("article");
      group.className = "combo-group";
      const scorePercentage = maximumPriorityScore
        ? Math.round((variants[0].score / maximumPriorityScore) * 100)
        : 0;
      group.innerHTML = `<div class="combo-heading"><strong>${comboName}</strong><span>${scorePercentage}% priority match</span></div>`;
      const variantList = document.createElement("div");
      variantList.className = "combo-variants";
      variants.forEach((combo) => {
        const button = document.createElement("button");
        button.className = "combo-variant";
        button.type = "button";
        button.setAttribute(
          "aria-pressed",
          String(
            selectedClassCombo?.className === combo.className &&
              selectedClassCombo?.subclassName === combo.subclassName,
          ),
        );
          const classSource = combo.sources[0] || "Source not listed";
        const subclassSource = combo.sources.slice(1).join(", ") || classSource;
          const subclassName = combo.subclassName.replace(/\s*\([A-Za-z0-9.-]{2,8}\)$/g, "");
          button.innerHTML = `<span class="combo-variant-label">${combo.className} - ${classSource}<br />${subclassName} - ${subclassSource}</span>`;
        button.addEventListener("click", () => {
          selectedClassCombo = combo;
          localStorage.setItem(CLASS_COMBO_STORAGE_KEY, JSON.stringify(combo));
          renderComboResults();
        });
        variantList.appendChild(button);
      });
      group.appendChild(variantList);
      elements.comboList.appendChild(group);
    });
  }

  function renderClassSection() {
    const hasSubSpecies = Boolean(selectedSubSpeciesId);
    elements.classSection.hidden = !hasSubSpecies;
    if (!hasSubSpecies) {
      elements.comboResults.hidden = true;
      return;
    }
    renderRoleQuestion(
      elements.combatRoleSelector,
      COMBAT_ROLES,
      selectedCombatRoles,
      COMBAT_ROLES_STORAGE_KEY,
      elements.combatRoleCount,
      elements.combatRoleStatus,
    );
    renderRoleQuestion(
      elements.outOfCombatRoleSelector,
      OUT_OF_COMBAT_ROLES,
      selectedOutOfCombatRoles,
      OUT_OF_COMBAT_ROLES_STORAGE_KEY,
      elements.outOfCombatRoleCount,
      elements.outOfCombatRoleStatus,
    );
    renderComboResults();
  }

  function renderGenderSelector() {
    elements.genderSelector.innerHTML = "";
    GENDER_OPTIONS.forEach((gender) => {
      const button = document.createElement("button");
      button.className = "gender-option";
      button.type = "button";
      button.textContent = gender.name;
      button.dataset.gender = gender.id;
      button.addEventListener("click", () => {
        selectedGender = gender.id;
        selectedSpeciesId = null;
        selectedSubSpeciesId = null;
        selectedClassCombo = null;
        localStorage.setItem(GENDER_STORAGE_KEY, selectedGender);
        localStorage.removeItem(SPECIES_STORAGE_KEY);
        localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
        localStorage.removeItem(CLASS_COMBO_STORAGE_KEY);
        updateGenderSelection();
        renderSpeciesGallery();
      });
      elements.genderSelector.appendChild(button);
    });
    updateGenderSelection();
  }

  function updateGenderSelection() {
    elements.genderSelector.querySelectorAll(".gender-option").forEach((button) => {
      const isSelected = button.dataset.gender === selectedGender;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
    const label = GENDER_OPTIONS.find((gender) => gender.id === selectedGender)?.name;
    elements.genderStatus.textContent = label
      ? `${label} portraits are active.`
      : "Choose one to load matching portraits.";
  }

  function renderSourceModes() {
    elements.sourceModeList.innerHTML = "";
    SOURCE_MODES.forEach((mode) => {
      const button = document.createElement("button");
      button.className = "source-mode-option";
      button.type = "button";
      button.setAttribute("aria-pressed", String(mode.id === selectedSourceModeId));
      button.innerHTML = `<strong>${mode.name}</strong><span>${mode.description}</span>`;
      button.addEventListener("click", () => {
        selectedSourceModeId = mode.id;
        localStorage.setItem(SOURCE_MODE_STORAGE_KEY, selectedSourceModeId);
        renderSourceModes();
        updateSettingsSummary();
        refreshSpeciesAfterSettingsChange();
      });
      elements.sourceModeList.appendChild(button);
    });
  }

  function renderClassSourceModes() {
    elements.classSourceModeList.innerHTML = "";
    CLASS_SOURCE_MODES.forEach((mode) => {
      const button = document.createElement("button");
      button.className = "source-mode-option";
      button.type = "button";
      button.setAttribute("aria-pressed", String(mode.id === selectedClassSourceModeId));
      button.innerHTML = `<strong>${mode.name}</strong><span>${mode.description}</span>`;
      button.addEventListener("click", () => {
        selectedClassSourceModeId = mode.id;
        localStorage.setItem(CLASS_SOURCE_MODE_STORAGE_KEY, selectedClassSourceModeId);
        renderClassSourceModes();
        updateClassSettingsSummary();
        refreshClassAfterSettingsChange();
      });
      elements.classSourceModeList.appendChild(button);
    });
  }

  function updateSettingsSummary() {
    const mode = SOURCE_MODES.find((option) => option.id === selectedSourceModeId) || SOURCE_MODES[0];
    elements.enabledSourcesSummary.textContent = mode.name;
    elements.dragonmarkedToggle.checked = enableDragonmarked;
  }

  function updateClassSettingsSummary() {
    const mode =
      CLASS_SOURCE_MODES.find((option) => option.id === selectedClassSourceModeId) ||
      CLASS_SOURCE_MODES[0];
    elements.classSettingsSummary.textContent = mode.name;
    elements.classEnabledSourcesSummary.textContent = mode.name;
  }

  function refreshClassAfterSettingsChange() {
    if (
      selectedClassCombo &&
      !getVisibleClassCombos().some(
        (combo) =>
          combo.className === selectedClassCombo.className &&
          combo.subclassName === selectedClassCombo.subclassName,
      )
    ) {
      selectedClassCombo = null;
      localStorage.removeItem(CLASS_COMBO_STORAGE_KEY);
    }
    renderClassSection();
  }

  function refreshSpeciesAfterSettingsChange() {
    if (selectedSpeciesId && !getSpeciesGroups().some((group) => group.id === selectedSpeciesId)) {
      selectedSpeciesId = null;
      selectedSubSpeciesId = null;
      localStorage.removeItem(SPECIES_STORAGE_KEY);
      localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
    }
    renderSpeciesGallery();
  }

  function scrollGallery(direction) {
    const card = elements.speciesGallery.querySelector(".species-card");
    const cardWidth = card ? card.getBoundingClientRect().width : 280;
    elements.speciesGallery.scrollBy({
      left: direction * (cardWidth + 18),
      behavior: "smooth",
    });
  }

  async function loadData() {
    const [catalogResponse, groupResponse, speciesResponse, subSpeciesResponse, classResponse] = await Promise.all([
      fetch("../backend/data/species-catalog.json?v=3"),
      fetch("../backend/data/species-groups.json?v=3"),
      fetch("../backend/data/species.json?v=3"),
      fetch("../backend/data/species-subspecies.csv?v=1"),
      fetch("../backend/data/class-combos.json?v=1"),
    ]);
    if (
      !catalogResponse.ok ||
      !groupResponse.ok ||
      !speciesResponse.ok ||
      !subSpeciesResponse.ok ||
      !classResponse.ok
    ) {
      throw new Error("Could not load species data.");
    }
    await catalogResponse.json();
    groupManifest = await groupResponse.json();
    const speciesData = await speciesResponse.json();
    const subSpeciesRows = parseSubSpeciesCsv(await subSpeciesResponse.text());
    classCombos = await classResponse.json();
    catalog = subSpeciesRows.map((option) => {
      const descriptionEntry = speciesData.species.find(
        (species) =>
          slugify(species.name) ===
          slugify(option.subSpecies || option.species),
      );
      return { ...option, description: descriptionEntry?.description };
    });
  }

  async function init() {
    renderGenderSelector();
    renderSourceModes();
    renderClassSourceModes();
    updateSettingsSummary();
    updateClassSettingsSummary();
    elements.startButton.addEventListener("click", () => showScreen("app"));
    elements.settingsButton.addEventListener("click", () => showScreen("settings"));
    elements.subSpeciesSettingsButton.addEventListener("click", () => {
      updateSettingsSummary();
      showScreen("subSpeciesSettings");
    });
    elements.classSettingsButton.addEventListener("click", () => {
      updateClassSettingsSummary();
      showScreen("classSettings");
    });
    elements.enabledSourcesButton.addEventListener("click", () => showScreen("enabledSources"));
    elements.classEnabledSourcesButton.addEventListener("click", () => {
      updateClassSettingsSummary();
      showScreen("classEnabledSources");
    });
    elements.settingsBackButton.addEventListener("click", () => showScreen("landing"));
    elements.subSpeciesSettingsBackButton.addEventListener("click", () => showScreen("settings"));
    elements.enabledSourcesBackButton.addEventListener("click", () => showScreen("subSpeciesSettings"));
    elements.classSettingsBackButton.addEventListener("click", () => showScreen("settings"));
    elements.classEnabledSourcesBackButton.addEventListener("click", () => showScreen("classSettings"));
    elements.dragonmarkedToggle.addEventListener("change", () => {
      enableDragonmarked = elements.dragonmarkedToggle.checked;
      localStorage.setItem(DRAGONMARKED_STORAGE_KEY, String(enableDragonmarked));
      refreshSpeciesAfterSettingsChange();
    });
    elements.backToHome.addEventListener("click", () => showScreen("landing"));
    elements.galleryPrevious.addEventListener("click", () => scrollGallery(-1));
    elements.galleryNext.addEventListener("click", () => scrollGallery(1));
    elements.speciesGallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") scrollGallery(-1);
      if (event.key === "ArrowRight") scrollGallery(1);
    });

    try {
      await loadData();
      renderSpeciesGallery();
      renderClassSection();
    } catch (error) {
      elements.selectionStatus.textContent = error.message;
    }
  }

  showScreen("landing");
  init();
})();
