let incidents = [];

const state = {
  search: "",
  industry: "all",
  category: "all",
  impact: "all",
  year: "all",
  sortBy: "date_desc",
  pageSize: 5,
  currentPage: 1,
  selectedId: null
};

const els = {
  searchInput: document.querySelector("#searchInput"),
  industryFilter: document.querySelector("#industryFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  impactFilter: document.querySelector("#impactFilter"),
  yearFilter: document.querySelector("#yearFilter"),
  sortBy: document.querySelector("#sortBy"),
  pageSize: document.querySelector("#pageSize"),
  incidentList: document.querySelector("#incidentList"),
  resultCount: document.querySelector("#resultCount"),
  prevPage: document.querySelector("#prevPage"),
  nextPage: document.querySelector("#nextPage"),
  pageMeta: document.querySelector("#pageMeta"),
  detailEmpty: document.querySelector("#detailEmpty"),
  detailCard: document.querySelector("#detailCard"),
  detailMeta: document.querySelector("#detailMeta"),
  detailTitle: document.querySelector("#detailTitle"),
  detailSummary: document.querySelector("#detailSummary"),
  detailImpact: document.querySelector("#detailImpact"),
  detailLearn: document.querySelector("#detailLearn"),
  detailSource: document.querySelector("#detailSource"),
  detailIncidentPage: document.querySelector("#detailIncidentPage"),
  detailSimulator: document.querySelector("#detailSimulator")
};

function uniqueValues(list, key) {
  return [...new Set(list.map((item) => item[key]))].sort();
}

function yearFromDate(date) {
  return new Date(date).getFullYear().toString();
}

function populateFilters() {
  uniqueValues(incidents, "industry").forEach((value) => {
    els.industryFilter.insertAdjacentHTML("beforeend", `<option value="${value}">${value}</option>`);
  });

  uniqueValues(incidents, "category").forEach((value) => {
    els.categoryFilter.insertAdjacentHTML("beforeend", `<option value="${value}">${value}</option>`);
  });

  [...new Set(incidents.map((item) => yearFromDate(item.date)))]
    .sort((a, b) => Number(b) - Number(a))
    .forEach((year) => {
      els.yearFilter.insertAdjacentHTML("beforeend", `<option value="${year}">${year}</option>`);
    });
}

function applyFilters() {
  const filtered = incidents.filter((incident) => {
    const matchesSearch =
      state.search === "" ||
      [incident.title, incident.company, incident.category, incident.summary]
        .join(" ")
        .toLowerCase()
        .includes(state.search);

    const matchesIndustry = state.industry === "all" || incident.industry === state.industry;
    const matchesCategory = state.category === "all" || incident.category === state.category;
    const matchesImpact = state.impact === "all" || incident.impact === state.impact;
    const matchesYear = state.year === "all" || yearFromDate(incident.date) === state.year;

    return matchesSearch && matchesIndustry && matchesCategory && matchesImpact && matchesYear;
  });

  if (state.sortBy === "date_desc") {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (state.sortBy === "date_asc") {
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (state.sortBy === "impact_desc") {
    const weight = { high: 3, medium: 2, low: 1 };
    filtered.sort((a, b) => weight[b.impact] - weight[a.impact]);
  }

  return filtered;
}

function paginate(list) {
  const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
  state.currentPage = Math.min(totalPages, Math.max(1, state.currentPage));
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  return {
    items: list.slice(start, end),
    totalPages
  };
}

function renderIncidentList(pageItems) {
  if (pageItems.length === 0) {
    els.incidentList.innerHTML = `<p>No incidents match your current filters.</p>`;
    return;
  }

  els.incidentList.innerHTML = pageItems
    .map((incident) => {
      const isActive = state.selectedId === incident.id;
      const learnings = incident.learnings.slice(0, 2).map((item) => `<li>${item}</li>`).join("");

      return `
        <article class="incident-card ${isActive ? "active" : ""}" data-id="${incident.id}">
          <div class="card-meta">
            <span>${new Date(incident.date).toLocaleDateString()}</span>
            <span>${incident.company}</span>
          </div>
          <h3 class="card-title">${incident.title}</h3>
          <div class="chips">
            <span class="chip">${incident.industry}</span>
            <span class="chip">${incident.category}</span>
            <span class="chip impact-${incident.impact}">${incident.impact.toUpperCase()} IMPACT</span>
          </div>
          <ul class="card-learnings">${learnings}</ul>
        </article>
      `;
    })
    .join("");

  [...els.incidentList.querySelectorAll(".incident-card")].forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedId = card.dataset.id;
      render();
    });
  });
}

function renderDetail(filtered) {
  const current = filtered.find((item) => item.id === state.selectedId);
  if (!current) {
    els.detailCard.classList.add("hidden");
    els.detailEmpty.classList.remove("hidden");
    return;
  }

  els.detailEmpty.classList.add("hidden");
  els.detailCard.classList.remove("hidden");

  els.detailMeta.textContent = `${current.company} | ${current.industry} | ${new Date(current.date).toLocaleDateString()}`;
  els.detailTitle.textContent = current.title;
  els.detailSummary.textContent = current.summary;
  els.detailImpact.innerHTML = current.impactDetails.map((item) => `<li>${item}</li>`).join("");
  els.detailLearn.innerHTML = current.learnings.map((item) => `<li>${item}</li>`).join("");
  els.detailSource.href = current.sourceUrl;
  els.detailIncidentPage.href = `./incident/?id=${encodeURIComponent(current.id)}`;
  els.detailSimulator.href = `./simulator/?id=${encodeURIComponent(current.id)}`;
}

function renderPagination(totalCount, totalPages) {
  els.pageMeta.textContent = `Page ${state.currentPage} of ${totalPages}`;
  els.prevPage.disabled = state.currentPage <= 1;
  els.nextPage.disabled = state.currentPage >= totalPages;
  els.resultCount.textContent = `${totalCount} incident${totalCount === 1 ? "" : "s"} match current filters`;
}

function render() {
  const filtered = applyFilters();
  const pagination = paginate(filtered);

  if (!state.selectedId && filtered.length > 0) {
    state.selectedId = filtered[0].id;
  }

  if (state.selectedId && !filtered.some((item) => item.id === state.selectedId)) {
    state.selectedId = pagination.items[0]?.id || null;
  }

  renderIncidentList(pagination.items);
  renderDetail(filtered);
  renderPagination(filtered.length, pagination.totalPages);
}

function onFilterChange(key, value) {
  state[key] = value;
  state.currentPage = 1;
  render();
}

function bindEvents() {
  els.searchInput.addEventListener("input", (event) => {
    onFilterChange("search", event.target.value.trim().toLowerCase());
  });

  [
    [els.industryFilter, "industry"],
    [els.categoryFilter, "category"],
    [els.impactFilter, "impact"],
    [els.yearFilter, "year"],
    [els.sortBy, "sortBy"]
  ].forEach(([element, key]) => {
    element.addEventListener("change", (event) => {
      onFilterChange(key, event.target.value);
    });
  });

  els.pageSize.addEventListener("change", (event) => {
    state.pageSize = Number(event.target.value);
    state.currentPage = 1;
    render();
  });

  els.prevPage.addEventListener("click", () => {
    state.currentPage = Math.max(1, state.currentPage - 1);
    render();
  });

  els.nextPage.addEventListener("click", () => {
    state.currentPage += 1;
    render();
  });
}

async function init() {
  const data = await window.loadPostmortemData();
  incidents = data.incidents;
  populateFilters();
  bindEvents();
  render();
}

init().catch((error) => {
  els.incidentList.innerHTML = `<p>Failed to load incident data: ${error.message}</p>`;
});
