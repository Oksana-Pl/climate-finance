const DEFAULTS = {
    globalTarget: 1300,
    currentTotal: 0,
    funds: {
        mitigation: 0,
        adaptation: 0,
        lossDamage: 0
    },
    targets: {
        mitigation: 355,
        adaptation: 365,
        lossDamage: 580
    }
};

const FUND_LABELS = {
    mitigation: "Mitigation",
    adaptation: "Adaptation",
    lossDamage: "Loss & Damage"
};

const COUNTRIES = [
    { id: "ireland-eu", label: "Ireland and EU", checked: true },
    { id: "us", label: "US", checked: true },
    { id: "china", label: "China", checked: true },
    { id: "emdes", label: "EMDEs", checked: false },
    { id: "petro-chemical-states", label: "Petro-chemical States", checked: false },
    { id: "uk", label: "UK", checked: false },
    { id: "sids", label: "SIDS", checked: false },
    { id: "ldcs", label: "LDCs", checked: false }
];

const state = {
    globalTarget: DEFAULTS.globalTarget,
    currentTotal: DEFAULTS.currentTotal,
    funds: { ...DEFAULTS.funds },
    targets: { ...DEFAULTS.targets },
    activeCountries: new Set(COUNTRIES.map((country) => country.id)),
    countryTotals: Object.fromEntries(COUNTRIES.map((country) => [country.id, 0])),
    view: "dashboard"
};

const app = document.querySelector(".app");
const contributionForm = document.querySelector("#contribution-form");
const amountInput = document.querySelector("#amount");
const categorySelect = document.querySelector("#category");
const countrySelect = document.querySelector("#country");
const removeButton = document.querySelector("#remove-button");
const resetButton = document.querySelector("#reset-button");
const settingsPanel = document.querySelector("#settings-panel");
const settingsToggles = document.querySelectorAll(".settings-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const menuToggle = document.querySelector(".menu-toggle");

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function formatBillions(value) {
    const rounded = Math.round(value * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}B`;
}

function formatTarget(value) {
    if (value >= 1000) {
        const trillions = Math.round((value / 1000) * 10) / 10;
        return `${Number.isInteger(trillions) ? trillions.toFixed(0) : trillions}T`;
    }

    return formatBillions(value);
}

function formatGlobalAmount(value) {
    return formatTarget(value);
}

function setCssPercent(name, value) {
    document.documentElement.style.setProperty(name, `${clamp(value, 0, 100)}%`);
}

function getActiveCountryOptions() {
    return COUNTRIES.filter((country) => state.activeCountries.has(country.id));
}

function renderCountrySelect() {
    const previousValue = countrySelect.value;
    const activeCountries = getActiveCountryOptions();
    const countryOptions = activeCountries
        .map((country) => `<option value="${country.id}">${country.label}</option>`)
        .join("");

    countrySelect.innerHTML = `${countryOptions}<option value="event">Event</option>`;

    if ([...countrySelect.options].some((option) => option.value === previousValue)) {
        countrySelect.value = previousValue;
    } else if (state.activeCountries.has("ireland-eu")) {
        countrySelect.value = "ireland-eu";
    }
}

function renderCountrySettings(container) {
    container.innerHTML = COUNTRIES.map((country) => {
        const isChecked = state.activeCountries.has(country.id) ? "checked" : "";
        return `
            <label class="country-check">
                <input type="checkbox" name="countries" value="${country.id}" ${isChecked}>
                <span class="check-box" aria-hidden="true"></span>
                <span>${country.label}</span>
            </label>
        `;
    }).join("");
}

function fillSettingsForm(form) {
    const globalInput = form.querySelector('[data-setting="globalTarget"], #setting-global');
    const mitigationInput = form.querySelector('[data-setting="mitigation"], #setting-mitigation');
    const adaptationInput = form.querySelector('[data-setting="adaptation"], #setting-adaptation');
    const lossInput = form.querySelector('[data-setting="lossDamage"], #setting-lossDamage');

    if (globalInput) globalInput.value = state.globalTarget / 1000;
    if (mitigationInput) mitigationInput.value = state.targets.mitigation;
    if (adaptationInput) adaptationInput.value = state.targets.adaptation;
    if (lossInput) lossInput.value = state.targets.lossDamage;
}

function buildPanelSettingsForm() {
    const panelForm = document.querySelector("#panel-settings-form");
    panelForm.innerHTML = `
        <section class="settings-targets" aria-label="Finance targets">
            <label class="settings-row target-row">
                <span>Climate Finance Target:</span>
                <span class="currency">$</span>
                <input type="number" data-setting="globalTarget" value="1.3" min="0" step="0.1">
                <span>T</span>
            </label>

            <h3>Funding Goals:</h3>
            <label class="settings-row">
                <span>Mitigation:</span>
                <span class="currency">$</span>
                <input type="number" data-setting="mitigation" value="355" min="1" step="1">
                <span>B</span>
            </label>
            <label class="settings-row">
                <span>Adaptation:</span>
                <span class="currency">$</span>
                <input type="number" data-setting="adaptation" value="365" min="1" step="1">
                <span>B</span>
            </label>
            <label class="settings-row">
                <span>Loss &amp; Damage:</span>
                <span class="currency">$</span>
                <input type="number" data-setting="lossDamage" value="580" min="1" step="1">
                <span>B</span>
            </label>
        </section>

        <section class="country-settings" aria-labelledby="panel-participating-title">
            <h3 id="panel-participating-title">Participating Countries:</h3>
            <div class="country-options"></div>
        </section>

        <button type="submit" class="btn apply-button">APPLY SETTINGS</button>
    `;
}

function renderSettingsForms() {
    document.querySelectorAll(".country-options").forEach(renderCountrySettings);
    document.querySelectorAll(".settings-form").forEach(fillSettingsForm);
}

function getSettingsValues(form) {
    const globalInput = form.querySelector('[data-setting="globalTarget"], #setting-global');
    const mitigationInput = form.querySelector('[data-setting="mitigation"], #setting-mitigation');
    const adaptationInput = form.querySelector('[data-setting="adaptation"], #setting-adaptation');
    const lossInput = form.querySelector('[data-setting="lossDamage"], #setting-lossDamage');
    const checkedCountries = [...form.querySelectorAll('input[name="countries"]:checked')].map((input) => input.value);

    return {
        globalTarget: Math.max(0, Number(globalInput.value) * 1000 || DEFAULTS.globalTarget),
        targets: {
            mitigation: Math.max(1, Number(mitigationInput.value) || DEFAULTS.targets.mitigation),
            adaptation: Math.max(1, Number(adaptationInput.value) || DEFAULTS.targets.adaptation),
            lossDamage: Math.max(1, Number(lossInput.value) || DEFAULTS.targets.lossDamage)
        },
        countries: checkedCountries.length ? checkedCountries : COUNTRIES.map((country) => country.id)
    };
}

function applySettings(form) {
    const values = getSettingsValues(form);
    state.globalTarget = values.globalTarget;
    state.targets = values.targets;
    state.activeCountries = new Set(values.countries);

    renderCountrySelect();
    renderSettingsForms();
    renderAll();
    closeSettingsPanel();
}

function renderFunds() {
    Object.keys(FUND_LABELS).forEach((fund) => {
        const value = state.funds[fund];
        const target = state.targets[fund];
        const percent = target > 0 ? (value / target) * 100 : 0;

        document.querySelectorAll(`[data-fund-fill="${fund}"]`).forEach((fill) => {
            fill.style.setProperty("--fund-percent", `${clamp(percent, 0, 100)}%`);
        });

        document.querySelectorAll(`[data-fund-value="${fund}"]`).forEach((label) => {
            label.textContent = `$${formatBillions(value)}`;
        });

        document.querySelectorAll(`[data-fund-target="${fund}"]`).forEach((label) => {
            label.textContent = formatBillions(target);
        });
    });
}

function renderGlobal() {
    const globalPercent = state.globalTarget > 0 ? (state.currentTotal / state.globalTarget) * 100 : 0;
    const safePercent = clamp(globalPercent, 0, 100);

    document.querySelector("#current-total-label").textContent = formatGlobalAmount(state.currentTotal);
    document.querySelector("#global-target-label").textContent = formatTarget(state.globalTarget);
    document.querySelector("#mobile-global-target-label").textContent = formatTarget(state.globalTarget);

    setCssPercent("--global-percent", safePercent);
    document.querySelector("#global-fill").style.width = `${safePercent}%`;
}

function renderCountries() {
    const countryList = document.querySelector("#country-list");
    const countriesToShow = COUNTRIES.filter((country) => state.activeCountries.has(country.id));

    countryList.innerHTML = countriesToShow.map((country) => `
        <li class="country-total-item">
            <div class="country-total-card">
                <span>${country.label}</span>
                <img src="images/coins.png" alt="" aria-hidden="true">
                <span class="country-total-value">${formatBillions(state.countryTotals[country.id] || 0)}</span>
            </div>
        </li>
    `).join("");
}

function renderMenuState() {
    document.querySelectorAll("[data-view-target]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.viewTarget === state.view);
    });
}

function renderAll() {
    renderFunds();
    renderGlobal();
    renderCountries();
    renderMenuState();
}

function changeContribution(direction) {
    const amount = Math.max(0, Number(amountInput.value) || 0);
    const category = categorySelect.value;
    const country = countrySelect.value;

    if (!amount || !Object.prototype.hasOwnProperty.call(state.funds, category)) {
        return;
    }

    const signedAmount = direction === "add" ? amount : -amount;
    state.funds[category] = Math.max(0, state.funds[category] + signedAmount);
    state.currentTotal = Math.max(0, state.currentTotal + signedAmount);

    if (country !== "event") {
        state.countryTotals[country] = Math.max(0, (state.countryTotals[country] || 0) + signedAmount);
    }

    renderAll();
}

function resetAll() {
    state.currentTotal = 0;
    Object.keys(state.funds).forEach((fund) => {
        state.funds[fund] = 0;
    });
    COUNTRIES.forEach((country) => {
        state.countryTotals[country.id] = 0;
    });
    renderAll();
}

function openSettingsPanel() {
    settingsPanel.classList.add("is-open");
    settingsPanel.setAttribute("aria-hidden", "false");
    settingsToggles.forEach((button) => {
        button.setAttribute("aria-expanded", "true");
    });
}

function closeSettingsPanel() {
    settingsPanel.classList.remove("is-open");
    settingsPanel.setAttribute("aria-hidden", "true");
    settingsToggles.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });
}

function toggleSettingsPanel() {
    if (settingsPanel.classList.contains("is-open")) {
        closeSettingsPanel();
    } else {
        renderSettingsForms();
        openSettingsPanel();
    }
}

function setView(viewName) {
    state.view = viewName;
    app.dataset.view = viewName;

    document.querySelectorAll(".view").forEach((view) => {
        view.classList.toggle("is-active", view.id === `${viewName}-view`);
    });

    closeSettingsPanel();
    closeMobileMenu();
    renderMenuState();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openMobileMenu() {
    mobileMenu.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close navigation menu");
}

function closeMobileMenu() {
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
}

function bindEvents() {
    contributionForm.addEventListener("submit", (event) => {
        event.preventDefault();
        changeContribution("add");
    });

    removeButton.addEventListener("click", () => changeContribution("remove"));
    resetButton.addEventListener("click", resetAll);

    settingsToggles.forEach((button) => {
        button.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 720px)").matches) {
                setView("settings");
                return;
            }

            toggleSettingsPanel();
        });
    });

    document.querySelectorAll(".settings-form").forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            applySettings(form);
        });
    });

    document.querySelectorAll("[data-view-target]").forEach((button) => {
        button.addEventListener("click", () => setView(button.dataset.viewTarget));
    });

    menuToggle.addEventListener("click", () => {
        if (mobileMenu.classList.contains("is-open")) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSettingsPanel();
            closeMobileMenu();
        }
    });
}

function init() {
    buildPanelSettingsForm();
    renderCountrySelect();
    renderSettingsForms();
    bindEvents();
    renderAll();
}

init();
