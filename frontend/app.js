(function () {
  const GENDER_STORAGE_KEY = "dnd-character-builder.selectedGender";
  const SPECIES_STORAGE_KEY = "dnd-character-builder.selectedSpecies";
  const SUB_SPECIES_STORAGE_KEY = "dnd-character-builder.selectedSubSpecies";
  const SOURCE_MODE_STORAGE_KEY = "dnd-character-builder.sourceMode";
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
  const GENDER_OPTIONS = [
    { id: "male", name: "Male" },
    { id: "female", name: "Female" },
    { id: "androgynous", name: "Androgynous" },
  ];

  const screens = {
    landing: document.querySelector("#landing-screen"),
    settings: document.querySelector("#settings-screen"),
    subSpeciesSettings: document.querySelector("#sub-species-settings-screen"),
    enabledSources: document.querySelector("#enabled-sources-screen"),
    app: document.querySelector("#app-shell"),
  };

  const elements = {
    startButton: document.querySelector("#start-button"),
    settingsButton: document.querySelector("#settings-button"),
    subSpeciesSettingsButton: document.querySelector("#sub-species-settings-button"),
    enabledSourcesButton: document.querySelector("#enabled-sources-button"),
    settingsBackButton: document.querySelector("#settings-back-button"),
    subSpeciesSettingsBackButton: document.querySelector("#sub-species-settings-back-button"),
    enabledSourcesBackButton: document.querySelector("#enabled-sources-back-button"),
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
  };

  let catalog = [];
  let groupManifest = { groups: [] };
  let selectedGender = localStorage.getItem(GENDER_STORAGE_KEY);
  let selectedSpeciesId = localStorage.getItem(SPECIES_STORAGE_KEY);
  let selectedSubSpeciesId = localStorage.getItem(SUB_SPECIES_STORAGE_KEY);
  let selectedSourceModeId = localStorage.getItem(SOURCE_MODE_STORAGE_KEY) || "2024";
  let enableDragonmarked = localStorage.getItem(DRAGONMARKED_STORAGE_KEY) === "true";

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

    return groups.length
      ? groups
      : visibleCatalog.map((option) => ({
          id: slugify(option.species),
          name: option.species,
          subSpecies: getSubSpecies(option.species, visibleCatalog),
          description: getDescription(option.species, visibleCatalog),
          imageVariants: {},
        }));
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
        localStorage.setItem(SPECIES_STORAGE_KEY, selectedSpeciesId);
        localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
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
        renderSubSpeciesSelector(group);
      });
      elements.subSpeciesSelector.appendChild(button);
    });

    const selectedOption = options.find((option) => option.id === selectedSubSpeciesId);
    elements.subSpeciesStatus.textContent = selectedOption
      ? `${selectedOption.name} selected.`
      : "Choose a sub-species.";
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
        localStorage.setItem(GENDER_STORAGE_KEY, selectedGender);
        localStorage.removeItem(SPECIES_STORAGE_KEY);
        localStorage.removeItem(SUB_SPECIES_STORAGE_KEY);
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

  function updateSettingsSummary() {
    const mode = SOURCE_MODES.find((option) => option.id === selectedSourceModeId) || SOURCE_MODES[0];
    elements.enabledSourcesSummary.textContent = mode.name;
    elements.dragonmarkedToggle.checked = enableDragonmarked;
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
    const [catalogResponse, groupResponse, speciesResponse, subSpeciesResponse] = await Promise.all([
      fetch("../backend/data/species-catalog.json?v=3"),
      fetch("../backend/data/species-groups.json?v=3"),
      fetch("../backend/data/species.json?v=3"),
      fetch("../backend/data/species-subspecies.csv?v=1"),
    ]);
    if (
      !catalogResponse.ok ||
      !groupResponse.ok ||
      !speciesResponse.ok ||
      !subSpeciesResponse.ok
    ) {
      throw new Error("Could not load species data.");
    }
    await catalogResponse.json();
    groupManifest = await groupResponse.json();
    const speciesData = await speciesResponse.json();
    const subSpeciesRows = parseSubSpeciesCsv(await subSpeciesResponse.text());
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
    updateSettingsSummary();
    elements.startButton.addEventListener("click", () => showScreen("app"));
    elements.settingsButton.addEventListener("click", () => showScreen("settings"));
    elements.subSpeciesSettingsButton.addEventListener("click", () => {
      updateSettingsSummary();
      showScreen("subSpeciesSettings");
    });
    elements.enabledSourcesButton.addEventListener("click", () => showScreen("enabledSources"));
    elements.settingsBackButton.addEventListener("click", () => showScreen("landing"));
    elements.subSpeciesSettingsBackButton.addEventListener("click", () => showScreen("settings"));
    elements.enabledSourcesBackButton.addEventListener("click", () => showScreen("subSpeciesSettings"));
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
    } catch (error) {
      elements.selectionStatus.textContent = error.message;
    }
  }

  showScreen("landing");
  init();
})();
