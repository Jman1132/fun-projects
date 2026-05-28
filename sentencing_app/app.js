const DEMO_USER = {
  username: "attorney@example.com",
  password: "password123",
};

const loginScreen = document.querySelector("#login-screen");
const loginForm = document.querySelector("#login-form");
const createAccountForm = document.querySelector("#create-account-form");
const loginError = document.querySelector("#login-error");
const createAccountError = document.querySelector("#create-account-error");
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
const criminalHistoryFileField = document.querySelector("#criminal-history-file-field");
const pleaDealField = document.querySelector("#plea-deal-field");
const printButton = document.querySelector("#print-button");

function getCurrentUser() {
  return localStorage.getItem("sentencingAppUser") || "";
}

function setCurrentUser(email) {
  localStorage.setItem("sentencingAppUser", email);
}

function clearCurrentUser() {
  localStorage.removeItem("sentencingAppUser");
}

function getAccounts() {
  const rawAccounts = localStorage.getItem("sentencingAppAccounts");
  if (!rawAccounts) {
    return [];
  }

  try {
    const accounts = JSON.parse(rawAccounts);
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function setAccounts(accounts) {
  localStorage.setItem("sentencingAppAccounts", JSON.stringify(accounts));
}

function getAccountDisplayName(username) {
  const account = getAccounts().find((item) => item.username === username);
  if (!account) {
    return username;
  }

  return `${account.firstName} ${account.lastName}`;
}

function showAuthView(view) {
  const isCreatingAccount = view === "create";
  if (loginForm) {
    loginForm.hidden = isCreatingAccount;
  }
  if (createAccountForm) {
    createAccountForm.hidden = !isCreatingAccount;
  }
  if (loginError) {
    loginError.hidden = true;
  }
  if (createAccountError) {
    createAccountError.hidden = true;
  }
}

function updateAuthView() {
  const user = getCurrentUser();
  const isLoggedIn = Boolean(user);

  document.body.classList.remove("login-active");
  loginScreen?.setAttribute("aria-hidden", "true");
  if (signedInUser) {
    signedInUser.textContent = isLoggedIn
      ? `Signed in as ${getAccountDisplayName(user)}`
      : "Using without an account";
  }
  if (logoutButton) {
    logoutButton.textContent = isLoggedIn ? "Log Out" : "Sign In";
  }
}

function openLoginView() {
  document.body.classList.add("login-active");
  loginScreen?.setAttribute("aria-hidden", "false");
  showAuthView("login");
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

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPdfSummary() {
  if (!form) {
    return "";
  }

  const file = form.elements.policeReportPdf?.files[0];
  if (!file) {
    return "";
  }

  return `${file.name} (${formatFileSize(file.size)})`;
}

function getCriminalHistoryPdfSummary() {
  if (!form) {
    return "";
  }

  const file = form.elements.criminalHistoryPdf?.files[0];
  if (!file) {
    return "";
  }

  return `${file.name} (${formatFileSize(file.size)})`;
}

function displayValue(value) {
  return value || '<span class="missing">Missing</span>';
}

function row(label, value) {
  return `
    <div class="summary-row">
      <div class="summary-label">${label}</div>
      <div>${displayValue(value)}</div>
    </div>
  `;
}

function clearExtraSubordinateMidterms() {
  subordinateMidtermList
    ?.querySelectorAll(".subordinate-midterm-row")
    .forEach((row) => row.remove());
}

function calculateExposure() {
  const crimeType = getFormValue("crimeType") || "felony";

  if (crimeType === "felony") {
    const baseTerm = getNumber("felonyBaseTerm");
    const subordinateTerms = getNumbers("felonyMidterm").reduce(
      (total, midterm) => total + midterm * 0.33,
      0
    );
    const totalFelony = baseTerm + subordinateTerms;
    const potentialCharge = isChecked("hasPotentialCharge")
      ? getNumber("potentialBaseTerm") + getNumber("potentialMidterm") * 0.33
      : null;

    return {
      label: "Total Felony Exposure",
      value: formatYears(totalFelony),
      potentialCharge: potentialCharge === null ? null : formatYears(potentialCharge),
    };
  }

  const totalMisdemeanor =
    getNumber("misdemeanorBaseTerm") +
    getNumber("misdemeanorMidterm");

  return {
    label: "Total Misdemeanor Exposure",
    value: formatYears(totalMisdemeanor),
    potentialCharge: null,
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
  criminalHistoryFileField.hidden = !isChecked("hasCriminalHistory");
  pleaDealField.hidden = !isChecked("hasPleaDeal");
}

function renderSummary() {
  if (!form || !summaryOutput) {
    return;
  }

  updateFieldVisibility();

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
      ${row("Offense(s)", getFormValue("chargedOffense"))}
      <div class="exposure">${exposure.label}: ${exposure.value}</div>
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
      ${row("Report PDF", getPdfSummary())}
      ${row("Criminal History", hasCriminalHistory ? getFormValue("historyDetails") : "No criminal history.")}
      ${
        hasCriminalHistory
          ? row("History PDF", getCriminalHistoryPdfSummary())
          : ""
      }
      ${row("Plea Deal", hasPleaDeal ? getFormValue("pleaBargain") : "No plea deal.")}
      ${row("Rights", clientsRightsExplained ? "The client's rights have been explained." : "The client's rights have not been explained.")}
      ${row("Diversion", medicalRelease)}
    </section>
  `;
}

if (form) {
  form.addEventListener("input", renderSummary);
  form.addEventListener("change", renderSummary);
  form.addEventListener("reset", () => {
    requestAnimationFrame(() => {
      clearExtraSubordinateMidterms();
      renderSummary();
    });
  });
}

addSubordinateMidtermButton?.addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "subordinate-midterm-row";
  row.innerHTML = `
    <label>
      Subordinate midterm
      <input name="felonyMidterm" type="number" min="0" step="0.01">
    </label>
    <button type="button" class="ghost-button remove-subordinate-midterm" aria-label="Remove subordinate midterm">
      Remove
    </button>
  `;

  subordinateMidtermList.append(row);
  row.querySelector("input").focus();
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

    const username = new FormData(loginForm).get("username")?.toString().trim().toLowerCase() || "";
    const password = new FormData(loginForm).get("password")?.toString() || "";
    const account = getAccounts().find((item) => item.username === username);

    if (
      (username === DEMO_USER.username && password === DEMO_USER.password) ||
      (account && account.password === password)
    ) {
      setCurrentUser(username);
      loginError.hidden = true;
      loginError.textContent = "";
      loginForm.reset();
      updateAuthView();
      return;
    }

    loginError.textContent = "Invalid username or password.";
    loginError.hidden = false;
  });
}

if (createAccountForm) {
  createAccountForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(createAccountForm);
    const firstName = formData.get("firstName")?.toString().trim() || "";
    const lastName = formData.get("lastName")?.toString().trim() || "";
    const username = formData.get("username")?.toString().trim().toLowerCase() || "";
    const barNumber = formData.get("barNumber")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";
    const accounts = getAccounts();
    const usernameTaken =
      username === DEMO_USER.username || accounts.some((account) => account.username === username);

    if (usernameTaken) {
      createAccountError.textContent = "That username is already taken.";
      createAccountError.hidden = false;
      return;
    }

    accounts.push({ firstName, lastName, username, barNumber, password });
    setAccounts(accounts);
    setCurrentUser(username);
    createAccountError.hidden = true;
    createAccountError.textContent = "";
    createAccountForm.reset();
    window.location.href = "index.html";
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

updateAuthView();
renderSummary();
