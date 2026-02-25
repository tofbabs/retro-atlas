let incidents = [];
let scenarios = {};

function findIncidentById(id) {
  return incidents.find((item) => item.id === id);
}

function relatedIncidents(current) {
  return incidents
    .filter((item) => item.id !== current.id && (item.category === current.category || item.industry === current.industry))
    .slice(0, 4);
}

function renderIncident(incident) {
  const container = document.querySelector("#incidentContainer");
  const simLink = document.querySelector("#incidentToSim");
  const scenario = scenarios[incident.simulatorId];
  simLink.href = `../simulator/?id=${encodeURIComponent(incident.id)}`;

  const related = relatedIncidents(incident)
    .map(
      (item) => `
        <li>
          <a href="./?id=${encodeURIComponent(item.id)}">${item.title}</a>
          <span>${item.company} · ${new Date(item.date).toLocaleDateString()}</span>
        </li>
      `
    )
    .join("");

  const resolution = scenario
    ? scenario.canonicalResolution
        .map(
          (step, index) => `
            <li>
              <strong>Step ${index + 1}: ${step.action}</strong>
              <p>${step.outcome}</p>
            </li>
          `
        )
        .join("")
    : "<li><span>No simulator flow linked for this incident yet.</span></li>";

  container.innerHTML = `
    <div class="incident-header">
      <p class="detail-meta">${incident.company} | ${incident.industry} | ${new Date(incident.date).toLocaleDateString()}</p>
      <h2>${incident.title}</h2>
      <div class="chips">
        <span class="chip">${incident.category}</span>
        <span class="chip impact-${incident.impact}">${incident.impact.toUpperCase()} IMPACT</span>
      </div>
    </div>

    <section class="incident-section">
      <h3>What happened</h3>
      <p>${incident.summary}</p>
    </section>

    <section class="incident-section">
      <h3>Impact</h3>
      <ul>${incident.impactDetails.map((line) => `<li>${line}</li>`).join("")}</ul>
    </section>

    <section class="incident-section">
      <h3>Key learnings</h3>
      <ul>${incident.learnings.map((line) => `<li>${line}</li>`).join("")}</ul>
    </section>

    <section class="incident-section">
      <h3>Canonical resolution sequence</h3>
      <ul class="resolution-list">${resolution}</ul>
    </section>

    <section class="incident-section action-row">
      <a class="ghost-btn link-btn" href="${incident.sourceUrl}" target="_blank" rel="noreferrer">Open original postmortem (${incident.sourceLabel})</a>
      <a class="solid-btn link-btn" href="../simulator/?id=${encodeURIComponent(incident.id)}">Try simulator for this incident</a>
    </section>

    <section class="incident-section">
      <h3>Related incidents</h3>
      <ul class="related-list">${related || "<li><span>No related incidents yet.</span></li>"}</ul>
    </section>
  `;
}

function renderNotFound() {
  const container = document.querySelector("#incidentContainer");
  container.innerHTML = `
    <div class="detail-empty">
      <h2>Incident not found</h2>
      <p>The requested incident id is missing. Return to the incident list and choose another item.</p>
      <a class="solid-btn link-btn" href="../">Back to incidents</a>
    </div>
  `;
}

async function init() {
  const data = await window.loadPostmortemData();
  incidents = data.incidents;
  scenarios = data.simulatorScenarios;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const incident = id ? findIncidentById(id) : null;

  if (!incident) {
    renderNotFound();
    return;
  }

  renderIncident(incident);
}

init().catch((error) => {
  const container = document.querySelector("#incidentContainer");
  container.innerHTML = `<div class="detail-empty"><h2>Failed to load incident data</h2><p>${error.message}</p></div>`;
});
