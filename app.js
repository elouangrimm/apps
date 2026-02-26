/**
 * Apps Showcase — Elouan Grimm
 * Fetches projects.json, renders cards, handles tag filtering + search.
 */

(function () {
  "use strict";

  const GITHUB_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>`;

  let allProjects = [];
  let activeTags = new Set();

  const grid = document.getElementById("project-grid");
  const tagContainer = document.getElementById("tag-filters");
  const searchInput = document.getElementById("search");
  const noResults = document.getElementById("no-results");

  // --- Fetch & Init ---

  async function init() {
    try {
      const res = await fetch("projects.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      allProjects = await res.json();
    } catch (err) {
      grid.innerHTML = `<p class="text-faint">Failed to load projects. <br><code>${err.message}</code></p>`;
      return;
    }

    buildTagFilters();
    render();

    searchInput.addEventListener("input", render);
  }

  // --- Tag Filters ---

  function buildTagFilters() {
    const tags = new Set();
    allProjects.forEach((p) => p.tags.forEach((t) => tags.add(t)));

    const sorted = [...tags].sort();

    // "All" button
    const allBtn = document.createElement("button");
    allBtn.className = "tag-btn active";
    allBtn.textContent = "all";
    allBtn.setAttribute("data-tag", "__all__");
    allBtn.addEventListener("click", () => {
      activeTags.clear();
      updateTagButtons();
      render();
    });
    tagContainer.appendChild(allBtn);

    sorted.forEach((tag) => {
      const btn = document.createElement("button");
      btn.className = "tag-btn";
      btn.textContent = tag;
      btn.setAttribute("data-tag", tag);
      btn.addEventListener("click", () => toggleTag(tag));
      tagContainer.appendChild(btn);
    });
  }

  function toggleTag(tag) {
    if (activeTags.has(tag)) {
      activeTags.delete(tag);
    } else {
      activeTags.add(tag);
    }
    updateTagButtons();
    render();
  }

  function updateTagButtons() {
    tagContainer.querySelectorAll(".tag-btn").forEach((btn) => {
      const t = btn.getAttribute("data-tag");
      if (t === "__all__") {
        btn.classList.toggle("active", activeTags.size === 0);
      } else {
        btn.classList.toggle("active", activeTags.has(t));
      }
    });
  }

  // --- Render ---

  function render() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = allProjects
      .slice()
      .sort((a, b) => (a.index ?? Infinity) - (b.index ?? Infinity))
      .filter((p) => {
        // Tag filter
        if (activeTags.size > 0) {
          const hasTag = p.tags.some((t) => activeTags.has(t));
          if (!hasTag) return false;
        }
        // Search filter
        if (query) {
          const haystack = `${p.name} ${p.description} ${p.tags.join(" ")}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      });

    grid.innerHTML = "";

    if (filtered.length === 0) {
      noResults.classList.remove("hidden");
    } else {
      noResults.classList.add("hidden");
    }

    filtered.forEach((project, i) => {
      grid.appendChild(createCard(project, i));
    });

    // Update project count
    let countEl = document.getElementById("project-count");
    if (!countEl) {
      countEl = document.createElement("p");
      countEl.id = "project-count";
      countEl.className = "project-count";
      grid.parentElement.insertBefore(countEl, grid);
    }
    const total = allProjects.length;
    const shown = filtered.length;
    countEl.textContent =
      shown === total
        ? `${total} project${total !== 1 ? "s" : ""}`
        : `${shown} of ${total} project${total !== 1 ? "s" : ""}`;
  }

  // --- Card ---

  function createCard(project, index) {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${index * 0.05}s`;

    let coverHTML = "";
    if (project.cover) {
      coverHTML = `<img class="card-cover" src="${escapeHTML(project.cover)}" alt="${escapeHTML(project.name)} cover" loading="lazy">`;
    }

    const SPECIAL_TAGS = {
      "new": "tag-new",
      "update soon": "tag-update-soon",
      "updated": "tag-updated",
      "featured": "tag-featured",
    };

    const tagsHTML = project.tags
      .map((t) => {
        const special = SPECIAL_TAGS[t.toLowerCase()] || "";
        return `<span class="tag ${special}">${escapeHTML(t)}</span>`;
      })
      .join("");

    card.innerHTML = `
      ${coverHTML}
      <a href="${escapeHTML(project.url)}" class="card-link-overlay" aria-label="Open ${escapeHTML(project.name)}" target="_blank" rel="noopener"></a>
      <div class="card-body">
        <div class="card-header">
          <h3 class="card-title">
            <a href="${escapeHTML(project.url)}" target="_blank" rel="noopener">${escapeHTML(project.name)}</a>
          </h3>
          ${project.github ? `<a href="${escapeHTML(project.github)}" class="card-github" title="View source on GitHub" target="_blank" rel="noopener" aria-label="GitHub repository for ${escapeHTML(project.name)}">${GITHUB_ICON}</a>` : ""}
        </div>
        <p class="card-desc">${escapeHTML(project.description)}</p>
        <div class="card-tags">${tagsHTML}</div>
      </div>
    `;

    return card;
  }

  // --- Helpers ---

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Go ---

  document.addEventListener("DOMContentLoaded", init);
})();
