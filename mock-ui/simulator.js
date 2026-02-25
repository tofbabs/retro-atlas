let incidents = [];
let scenarioMap = {};

const simState = {
  stepIndex: 0,
  questionsAnswered: 0,
  detours: 0,
  signals: 0,
  lastEvent: "",
  chosenActions: []
};

const els = {
  simContext: document.querySelector("#simContext"),
  simTitle: document.querySelector("#simTitle"),
  simPrompt: document.querySelector("#simPrompt"),
  simChoices: document.querySelector("#simChoices"),
  simRestart: document.querySelector("#simRestart"),
  simToIncident: document.querySelector("#simToIncident"),
  statQuestions: document.querySelector("#statQuestions"),
  statDetours: document.querySelector("#statDetours"),
  statSignals: document.querySelector("#statSignals"),
  simSummary: document.querySelector("#simSummary"),
  simChains: document.querySelector("#simChains")
};

function findIncidentById(id) {
  return incidents.find((item) => item.id === id);
}

function shuffle(list) {
  const clone = [...list];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function updateStats() {
  els.statQuestions.textContent = simState.questionsAnswered.toString();
  els.statDetours.textContent = simState.detours.toString();
  els.statSignals.textContent = simState.signals.toString();
}

function renderDebrief(scenario, done) {
  if (!done) {
    const msg = simState.lastEvent || "No strict wrong answers. Some actions create detours before resolution.";
    els.simSummary.innerHTML = `<p class="sim-status">${msg}</p>`;
    els.simChains.innerHTML = "";
    return;
  }

  const extraSteps = Math.max(0, simState.questionsAnswered - scenario.shortestPath);
  const optimalChain = scenario.canonicalResolution.map((step) => step.action);
  const chosenSet = new Set(simState.chosenActions);
  const overlapCount = optimalChain.filter((step) => chosenSet.has(step)).length;
  const yourChain = simState.chosenActions
    .map((action) => {
      const overlap = optimalChain.includes(action);
      return `<li class="${overlap ? "overlap" : "detour"}">${action}</li>`;
    })
    .join("");
  const optimalRendered = optimalChain
    .map((action) => {
      const overlap = chosenSet.has(action);
      return `<li class="${overlap ? "overlap" : "missed"}">${action}</li>`;
    })
    .join("");

  els.simSummary.innerHTML = `
    <p><strong>Resolution reached.</strong> You completed this scenario in ${simState.questionsAnswered} decisions.</p>
    <p>Shortest known path is ${scenario.shortestPath} decisions. Additional detours: ${extraSteps}.</p>
    <p>Required-step overlap: ${overlapCount} / ${optimalChain.length}.</p>
  `;

  els.simChains.innerHTML = `
    <div class="chain-grid">
      <div>
        <h4>Your decision chain</h4>
        <ol class="chain-list">${yourChain}</ol>
      </div>
      <div>
        <h4>Optimal decision chain</h4>
        <ol class="chain-list">${optimalRendered}</ol>
      </div>
    </div>
  `;
}

function choiceButton(label, kind) {
  return `
    <button class="sim-choice" data-kind="${kind}" data-label="${label}">
      <strong>${label}</strong>
    </button>
  `;
}

function renderChoices(scenario, done) {
  if (done) {
    els.simChoices.innerHTML = `
      <button class="sim-choice" disabled>
        <strong>Scenario complete. Restart to practice another path.</strong>
      </button>
    `;
    return;
  }

  const step = scenario.canonicalResolution[simState.stepIndex];
  const distractorOptions = shuffle(scenario.distractors).slice(0, 2).map((text) => ({
    label: text,
    kind: "detour"
  }));

  const canonicalOption = {
    label: step.action,
    kind: "signal"
  };

  const options = shuffle([canonicalOption, ...distractorOptions]);

  els.simChoices.innerHTML = options
    .map((option) => choiceButton(option.label, option.kind))
    .join("");

  [...els.simChoices.querySelectorAll(".sim-choice")].forEach((button) => {
    button.addEventListener("click", () => {
      simState.questionsAnswered += 1;
      const kind = button.dataset.kind;
      simState.chosenActions.push(button.dataset.label);

      if (kind === "signal") {
        simState.signals += 1;
        simState.lastEvent = step.outcome;
        simState.stepIndex += 1;
      } else {
        simState.detours += 1;
        simState.lastEvent = "That action consumed time, but the incident state remains unresolved. Continue investigation.";
      }

      renderSimulator(currentScenario);
    });
  });
}

let currentScenario = null;

function renderSimulator(scenario) {
  currentScenario = scenario;
  const done = simState.stepIndex >= scenario.canonicalResolution.length;
  const step = scenario.canonicalResolution[Math.min(simState.stepIndex, scenario.canonicalResolution.length - 1)];

  if (done) {
    els.simPrompt.textContent = `Incident stabilized. Final validated action: ${scenario.canonicalResolution[scenario.canonicalResolution.length - 1].action}.`;
  } else if (simState.stepIndex === 0 && !simState.lastEvent) {
    els.simPrompt.textContent = scenario.openingPrompt;
  } else {
    els.simPrompt.textContent = `Current state: ${simState.lastEvent} Next best action is not obvious; choose your next move.`;
  }

  renderChoices(scenario, done, step);
  updateStats();
  renderDebrief(scenario, done);
}

function resetSimulator() {
  simState.stepIndex = 0;
  simState.questionsAnswered = 0;
  simState.detours = 0;
  simState.signals = 0;
  simState.lastEvent = "";
  simState.chosenActions = [];
  renderSimulator(currentScenario);
}

function initContext() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const incident = id ? findIncidentById(id) : null;

  if (!incident) {
    return null;
  }

  const scenario = scenarioMap[incident.simulatorId];

  els.simTitle.textContent = `${incident.title} - Simulator`;
  els.simContext.textContent = `${incident.company} | ${incident.industry} | ${incident.category}`;
  els.simToIncident.href = `../incident/?id=${encodeURIComponent(incident.id)}`;
  els.simToIncident.textContent = "Open incident page";

  return scenario;
}

function renderNoIncidentSelected() {
  els.simTitle.textContent = "No incident selected";
  els.simContext.textContent = "Select an incident first to run a scenario-based simulation.";
  els.simPrompt.textContent =
    "This simulator requires an incident context. Open an incident from the list and start the simulator from there.";
  els.simChoices.innerHTML =
    '<a class="solid-btn link-btn" href="../">Go to all incidents</a>';
  els.simSummary.innerHTML = "";
  els.simChains.innerHTML = "";
  els.simToIncident.href = "../";
  els.simToIncident.textContent = "Back to incidents";
}

function bindEvents() {
  els.simRestart.addEventListener("click", resetSimulator);
}

async function init() {
  const data = await window.loadPostmortemData();
  incidents = data.incidents;
  scenarioMap = data.simulatorScenarios;
  const scenario = initContext();
  if (!scenario) {
    renderNoIncidentSelected();
    return;
  }
  renderSimulator(scenario);
  bindEvents();
}

init().catch((error) => {
  els.simPrompt.textContent = `Failed to load simulator data: ${error.message}`;
});
