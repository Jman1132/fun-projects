const loginScreen = document.querySelector("#login-screen");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const signedInUser = document.querySelector("#signed-in-user");
const logoutButton = document.querySelector("#logout-button");
const form = document.querySelector("#intake-form");
const summaryOutput = document.querySelector("#summary-output");
const felonyFields = document.querySelector("#felony-fields");
const misdemeanorFields = document.querySelector("#misdemeanor-fields");
const potentialChargeFields = document.querySelector("#potential-charge-fields");
const subordinateMidtermList = document.querySelector("#subordinate-midterm-list");
const addSubordinateMidtermButton = document.querySelector("#add-subordinate-midterm");
const custodyCreditField = document.querySelector("#custody-credit-field");
const criminalHistoryField = document.querySelector("#criminal-history-field");
const pleaDealField = document.querySelector("#plea-deal-field");
const printButton = document.querySelector("#print-button");
let codeDetailsClosedForPrint = [];
let penalCodeDataPromise = null;
let penalCodeDataError = "";

function hasPenalCodeData() {
  return Boolean(window.PENAL_CODE_DATA?.sections || window.PENAL_CODE_SECTIONS);
}

function getPenalCodeSections() {
  if (window.PENAL_CODE_DATA?.sections) {
    return window.PENAL_CODE_DATA.sections;
  }

  if (window.PENAL_CODE_SECTIONS) {
    return Object.fromEntries(
      Object.entries(window.PENAL_CODE_SECTIONS).map(([section, text]) => [
        section,
        { text, sourceUrl: "", heading: "" },
      ])
    );
  }

  return {};
}

function loadPenalCodeData() {
  if (hasPenalCodeData()) {
    return Promise.resolve();
  }

  if (!penalCodeDataPromise) {
    penalCodeDataPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "penal-code-data.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Penal Code data."));
      document.head.append(script);
    })
      .then(() => {
        penalCodeDataError = "";
        renderSummary();
      })
      .catch((error) => {
        penalCodeDataError = error.message;
        penalCodeDataPromise = null;
        throw error;
      });
  }

  return penalCodeDataPromise;
}

function getCurrentUser() {
  return sessionStorage.getItem("sentencingAppDisplayName") || "";
}

function setCurrentUser(displayName) {
  sessionStorage.setItem("sentencingAppDisplayName", displayName);
}

function clearCurrentUser() {
  sessionStorage.removeItem("sentencingAppDisplayName");
}

function clearSessionFormState() {
  if (loginError) {
    loginError.hidden = true;
    loginError.textContent = "";
  }
  loginForm?.reset();
}

function updateAuthView() {
  const user = getCurrentUser();
  const isLoggedIn = Boolean(user);

  document.body.classList.remove("login-active");
  loginScreen?.setAttribute("aria-hidden", "true");
  if (signedInUser) {
    signedInUser.textContent = isLoggedIn
      ? `Session name: ${user}`
      : "Using without an account";
  }
  if (logoutButton) {
    logoutButton.textContent = isLoggedIn ? "Clear Name" : "Name Session";
  }
}

function openLoginView() {
  document.body.classList.add("login-active");
  loginScreen?.setAttribute("aria-hidden", "false");
  clearSessionFormState();
}

function getFormValue(name) {
  if (!form) {
    return "";
  }

  return new FormData(form).get(name)?.toString().trim() || "";
}

function getNumber(name) {
  const value = parseFloat(getFormValue(name));
  return Number.isFinite(value) ? value : 0;
}

function getNumberState(name, label) {
  const rawValue = getFormValue(name);
  if (!rawValue) {
    return {
      value: 0,
      errors: [`${label} is needed.`],
    };
  }

  const value = parseFloat(rawValue);
  if (!Number.isFinite(value)) {
    return {
      value: 0,
      errors: [`${label} must be a number.`],
    };
  }

  return { value, errors: [] };
}

function getNumbers(name) {
  if (!form) {
    return [];
  }

  return new FormData(form)
    .getAll(name)
    .map((value) => parseFloat(value.toString()))
    .filter((value) => Number.isFinite(value));
}

function isChecked(name) {
  return form.elements[name]?.checked || false;
}

function formatYears(years) {
  if (Number.isInteger(years)) {
    return String(years);
  }
  return years.toFixed(2).replace(/\.?0+$/, "");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${month}/${day}/${year}`;
}

function displayValue(value) {
  if (!value) {
    return '<span class="missing">Missing</span>';
  }

  return escapeHtml(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function formatMultilineText(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function row(label, value, options = {}) {
  const display = options.html
    ? value || '<span class="missing">Missing</span>'
    : displayValue(value);

  return `
    <div class="summary-row">
      <div class="summary-label">${label}</div>
      <div${options.className ? ` class="${options.className}"` : ""}>${display}</div>
    </div>
  `;
}

function getPenalCodeReferences(value) {
  return window.PenalCodeUtils.parseReferences(value);
}

function formatPenalCodeReference(reference) {
  return window.PenalCodeUtils.formatReference(reference);
}

function getApplicableSectionText(sectionText, reference) {
  return window.PenalCodeUtils.getApplicableSectionText(sectionText, reference);
}

function getOffenseMatch(reference) {
  const penalCodeSections = getPenalCodeSections();
  const sectionRecord = penalCodeSections[reference.section];
  const sectionText = sectionRecord?.text;
  const formattedReference = formatPenalCodeReference(reference);

  if (penalCodeDataError) {
    return {
      formattedReference,
      error: penalCodeDataError,
    };
  }

  if (!hasPenalCodeData()) {
    return {
      formattedReference,
      loading: true,
    };
  }

  if (!sectionText) {
    return {
      formattedReference,
      error: `Penal Code section ${formattedReference} was not found in the loaded Part 1 code data.`,
    };
  }

  const applicableText = getApplicableSectionText(sectionText, reference);
  if (!applicableText) {
    return {
      formattedReference,
      error: `Penal Code section ${formattedReference} was found, but that subdivision was not found in the loaded code text.`,
    };
  }

  return {
    formattedReference,
    text: applicableText,
    sourceUrl: sectionRecord.sourceUrl,
    heading: sectionRecord.heading,
  };
}

function getTextPreview(text) {
  return window.PenalCodeUtils.getTextPreview(text);
}

function getOffenseSummary(offense) {
  const references = getPenalCodeReferences(offense);

  if (!references) {
    return displayValue(offense);
  }

  if (!references.length) {
    return displayValue("");
  }

  return references
    .map((reference) => {
      const match = getOffenseMatch(reference);

      if (match.loading) {
        return `<div class="offense-loading">Loading Penal Code ${escapeHtml(match.formattedReference)}...</div>`;
      }

      if (match.error) {
        return `<div class="offense-error">${formatMultilineText(match.error)}</div>`;
      }

      return `
        <details class="code-details">
          <summary>
            <strong>Penal Code ${escapeHtml(match.formattedReference)}</strong>
            <span>${formatMultilineText(getTextPreview(match.text))}</span>
          </summary>
          <div class="code-full-text">${formatMultilineText(match.text)}</div>
          ${
            match.sourceUrl
              ? `<div class="code-source">Source: <a href="${escapeHtml(match.sourceUrl)}" target="_blank" rel="noreferrer">LegInfo</a></div>`
              : ""
          }
        </details>
      `;
    })
    .join("");
}

function getChargedOffenseSummary() {
  return getOffenseSummary(getFormValue("chargedOffense"));
}

function getSubordinateOffenseSummary() {
  if (!form) {
    return "";
  }

  const offenses = new FormData(form)
    .getAll("felonySubordinateOffense")
    .map((offense) => offense.toString().trim())
    .filter(Boolean);

  if (!offenses.length) {
    return "";
  }

  return offenses
    .map(
      (offense, index) =>
        `<div class="subordinate-offense"><strong>Subordinate ${index + 1}</strong><br>${getOffenseSummary(
          offense
        )}</div>`
    )
    .join("<br>");
}

function getOffenseStatus(value) {
  const references = getPenalCodeReferences(value);
  if (!references || !references.length) {
    return "";
  }

  const matches = references.map(getOffenseMatch);
  if (matches.some((match) => match.loading)) {
    return "Loading Penal Code data...";
  }

  const failedMatch = matches.find((match) => match.error);
  if (failedMatch) {
    return failedMatch.error;
  }

  return `Matched ${matches
    .map((match) => `Penal Code ${match.formattedReference}`)
    .join(", ")}`;
}

function updateOffenseStatus(input) {
  const field =
    input.closest("label")?.querySelector(".offense-status") ||
    document.querySelector(`[data-offense-status-for="${input.name}"]`);

  if (!field) {
    return;
  }

  const status = getOffenseStatus(input.value.trim());
  field.textContent = status;
  field.classList.toggle("is-error", status.includes("not found"));
}

function updateOffenseStatuses() {
  document
    .querySelectorAll('input[name="chargedOffense"], input[name="felonySubordinateOffense"]')
    .forEach(updateOffenseStatus);
}

function hasOffenseInputValue() {
  return Array.from(
    document.querySelectorAll('input[name="chargedOffense"], input[name="felonySubordinateOffense"]')
  ).some((input) => input.value.trim());
}

function renderAndLoadPenalCodeDataIfNeeded() {
  renderSummary();

  if (hasOffenseInputValue() && !hasPenalCodeData()) {
    loadPenalCodeData().catch(() => {
      renderSummary();
    });
  }
}

function clearExtraSubordinateMidterms() {
  subordinateMidtermList
    ?.querySelectorAll(".subordinate-midterm-row")
    .forEach((row) => row.remove());
}

function clearSubordinateOffenses() {
  subordinateMidtermList
    ?.querySelectorAll('input[name="felonySubordinateOffense"]')
    .forEach((input) => {
      input.value = "";
    });
}

function calculateExposure() {
  const crimeType = getFormValue("crimeType") || "felony";

  if (crimeType === "felony") {
    const baseTerm = getNumberState("felonyBaseTerm", "Felony base term");
    const errors = [...baseTerm.errors];
    const subordinateRows = Array.from(
      subordinateMidtermList?.querySelectorAll(".subordinate-midterm-row") || []
    );
    const subordinateTerms = subordinateRows.reduce((total, row, index) => {
      const offense = row.querySelector('input[name="felonySubordinateOffense"]')?.value.trim();
      const midtermInput = row.querySelector('input[name="felonyMidterm"]');
      const midterm = parseFloat(midtermInput?.value || "");

      if (offense && !Number.isFinite(midterm)) {
        errors.push(`Subordinate ${index + 1} needs a midterm.`);
        return total;
      }
      if (!offense && Number.isFinite(midterm)) {
        errors.push(`Subordinate ${index + 1} needs a charged offense.`);
      }

      return Number.isFinite(midterm) ? total + midterm * 0.33 : total;
    }, 0);

    const totalFelony = baseTerm.value + subordinateTerms;
    let potentialCharge = null;
    if (isChecked("hasPotentialCharge")) {
      const potentialBaseTerm = getNumberState("potentialBaseTerm", "Potential base term");
      const potentialMidterm = getNumberState("potentialMidterm", "Potential midterm");
      errors.push(...potentialBaseTerm.errors, ...potentialMidterm.errors);
      potentialCharge = potentialBaseTerm.value + potentialMidterm.value * 0.33;
    }

    return {
      label: "Total Felony Exposure",
      value: formatYears(totalFelony),
      potentialCharge: potentialCharge === null ? null : formatYears(potentialCharge),
      errors,
    };
  }

  const baseTerm = getNumberState("misdemeanorBaseTerm", "Misdemeanor base term");
  const midterm = getNumberState("misdemeanorMidterm", "Misdemeanor midterm");
  const totalMisdemeanor = baseTerm.value + midterm.value;

  return {
    label: "Total Misdemeanor Exposure",
    value: formatYears(totalMisdemeanor),
    potentialCharge: null,
    errors: [...baseTerm.errors, ...midterm.errors],
  };
}

function updateFieldVisibility() {
  const crimeType = getFormValue("crimeType") || "felony";
  const isFelony = crimeType === "felony";

  felonyFields.hidden = !isFelony;
  misdemeanorFields.hidden = isFelony;
  potentialChargeFields.hidden = !isChecked("hasPotentialCharge") || !isFelony;
  custodyCreditField.hidden = !isChecked("inCustodyCredit");
  criminalHistoryField.hidden = !isChecked("hasCriminalHistory");
  pleaDealField.hidden = !isChecked("hasPleaDeal");
}

function renderSummary() {
  if (!form || !summaryOutput) {
    return;
  }

  updateFieldVisibility();
  updateOffenseStatuses();

  const exposure = calculateExposure();
  const hasCriminalHistory = isChecked("hasCriminalHistory");
  const hasPleaDeal = isChecked("hasPleaDeal");
  const inCustodyCredit = isChecked("inCustodyCredit");
  const custodyCreditsYears = getNumber("custodyCredits") * 2;
  const clientsRightsExplained = isChecked("clientsRightsExplained");
  const mentalHealthDiversion = isChecked("mentalHealthDiversion");
  const clientName = getFormValue("clientName");
  const clientBirthdate = formatDate(getFormValue("clientBirthdate"));
  const attorneyName = getFormValue("attorneyName");
  const subordinateOffenseSummary = getSubordinateOffenseSummary();

  const medicalRelease = mentalHealthDiversion
    ? `${clientName || "Client"} ${clientBirthdate || ""} hereby authorizes the release of medical information to the attorney, ${attorneyName || "Attorney"}, for the purpose of Mental Health Diversion. This disclosure of information is limited to records needed for that referral.`
    : "No Mental Health Diversion referral.";

  summaryOutput.innerHTML = `
    <section class="summary-group">
      <h3>Client</h3>
      ${row("Attorney", getFormValue("attorneyName"))}
      ${row("Client", getFormValue("clientName"))}
      ${row("Birthdate", clientBirthdate)}
      ${row("XREF", getFormValue("xref"))}
      ${row("Court Date", formatDate(getFormValue("courtDate")))}
    </section>

    <section class="summary-group">
      <h3>Charge</h3>
      ${row("Crime Type", getFormValue("crimeType"))}
      ${row("Charged Penal Code Text", getChargedOffenseSummary(), {
        html: true,
        className: "code-text",
      })}
      ${
        subordinateOffenseSummary
          ? row("Subordinate Penal Code Text", subordinateOffenseSummary, {
              html: true,
              className: "code-text",
            })
          : ""
      }
      <div class="exposure">${exposure.label}: ${exposure.value}</div>
      ${
        exposure.errors.length
          ? `<div class="summary-warning">${exposure.errors.map(escapeHtml).join("<br>")}</div>`
          : ""
      }
      ${
        exposure.potentialCharge
          ? `<div class="exposure">Potential Charge Exposure: ${exposure.potentialCharge}</div>`
          : ""
      }
    </section>

    <section class="summary-group">
      <h3>Case Details</h3>
      ${row("Police Report", getFormValue("policeReport"))}
      ${row("In Custody Credit", inCustodyCredit ? `The client may be eligible for in custody credit. The client has ${formatYears(custodyCreditsYears)} years of in custody credit.` : "The client is not in custody and is not eligible for in custody credit.")}
      ${row("Criminal History", hasCriminalHistory ? getFormValue("historyDetails") : "No criminal history.")}
      ${row("Plea Deal", hasPleaDeal ? getFormValue("pleaBargain") : "No plea deal.")}
      ${row("Rights", clientsRightsExplained ? "The client's rights have been explained." : "The client's rights have not been explained.")}
      ${row("Diversion", medicalRelease)}
    </section>
  `;
}

if (form) {
  form.addEventListener("input", renderAndLoadPenalCodeDataIfNeeded);
  form.addEventListener("change", renderAndLoadPenalCodeDataIfNeeded);
  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      clearExtraSubordinateMidterms();
      clearSubordinateOffenses();
      renderSummary();
    });
  });
}

addSubordinateMidtermButton?.addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "subordinate-midterm-row";
  const rowId = Date.now().toString(36);
  row.innerHTML = `
    <label>
      Subordinate charged offense
      <input name="felonySubordinateOffense" placeholder="e.g., 422(a)" aria-describedby="subordinate-offense-status-${rowId}">
      <span id="subordinate-offense-status-${rowId}" class="offense-status" aria-live="polite"></span>
    </label>
    <label>
      Subordinate midterm
      <input name="felonyMidterm" type="number" min="0" step="0.01">
    </label>
    <button type="button" class="ghost-button remove-subordinate-midterm" aria-label="Remove subordinate offense">
      Remove
    </button>
  `;

  subordinateMidtermList.append(row);
  row.querySelector('input[name="felonySubordinateOffense"]').focus();
  renderSummary();
});

subordinateMidtermList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-subordinate-midterm");
  if (!removeButton) {
    return;
  }

  removeButton.closest(".subordinate-midterm-row").remove();
  renderSummary();
});

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const displayName = new FormData(loginForm).get("displayName")?.toString().trim() || "";
    if (!displayName) {
      loginError.textContent = "Enter a display name or continue without an account.";
      loginError.hidden = false;
      return;
    }

    setCurrentUser(displayName);
    clearSessionFormState();
    updateAuthView();
  });
}

logoutButton?.addEventListener("click", () => {
  if (!getCurrentUser()) {
    openLoginView();
    return;
  }

  clearCurrentUser();
  updateAuthView();
});

loginScreen?.addEventListener("click", (event) => {
  if (event.target.matches("[data-continue-without-account]")) {
    updateAuthView();
  }
});

printButton?.addEventListener("click", () => {
  window.print();
});

window.addEventListener("beforeprint", () => {
  codeDetailsClosedForPrint = Array.from(document.querySelectorAll(".code-details:not([open])"));
  codeDetailsClosedForPrint.forEach((details) => {
    details.open = true;
  });
});

window.addEventListener("afterprint", () => {
  codeDetailsClosedForPrint.forEach((details) => {
    details.open = false;
  });
  codeDetailsClosedForPrint = [];
});

updateAuthView();
renderSummary();
