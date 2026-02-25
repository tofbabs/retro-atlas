async function fetchFirst(paths) {
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return res;
    } catch (error) {
      // Try the next candidate path.
    }
  }
  throw new Error("Failed to load JSON data.");
}

async function loadPostmortemData() {
  const [incidentsRes, simulatorsRes] = await Promise.all([
    fetchFirst(["./data/incidents.json", "../data/incidents.json"]),
    fetchFirst(["./data/simulators.json", "../data/simulators.json"])
  ]);

  const [incidents, simulatorScenarios] = await Promise.all([incidentsRes.json(), simulatorsRes.json()]);
  return { incidents, simulatorScenarios };
}

window.loadPostmortemData = loadPostmortemData;
