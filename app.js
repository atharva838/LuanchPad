/* LaunchPad — vanilla JavaScript application
   Concepts demonstrated: modules-by-concern, event delegation, Fetch API/AJAX,
   JSON, XML DOMParser/XMLSerializer, localStorage, form validation and async UI. */
(() => {
  "use strict";

  const STORAGE = {
    opportunities: "launchpad_opportunities_v1",
    saved: "launchpad_saved_v1",
    applications: "launchpad_applications_v1",
    theme: "launchpad_theme_v1"
  };
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const state = {
    opportunities: [],
    saved: new Set(),
    applications: [],
    view: "overview",
    appStatusFilter: "all",
    search: "",
    type: "all",
    mode: "all",
    sort: "recommended",
    appSearch: "",
    editingApplicationId: null
  };
  const colors = { purple: "mark-purple", orange: "mark-orange", green: "mark-green", blue: "mark-blue", pink: "mark-pink" };
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const formatDate = value => {
    if (!value) return "Not set";
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Not set";
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
  };
  const initials = name => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const statusClass = status => ({ Applied:"status-applied", Interview:"status-interview", Offer:"status-offer", Rejected:"status-rejected", Assessment:"status-assessment", Interested:"status-interested" }[status] || "status-interested");
  const byId = id => state.opportunities.find(item => item.id === id);
  const getApplication = id => state.applications.find(item => item.opportunityId === id);

  function toast(message, type = "success") {
    const region = $("#toastRegion");
    const node = document.createElement("div");
    node.className = `toast ${type === "error" ? "error" : ""}`;
    node.innerHTML = `<span class="toast-mark">${type === "error" ? "!" : "✓"}</span><span>${escapeHTML(message)}</span>`;
    region.append(node);
    window.setTimeout(() => { node.style.opacity = "0"; node.style.transform = "translateY(6px)"; window.setTimeout(() => node.remove(), 220); }, 3100);
  }

  function persist() {
    localStorage.setItem(STORAGE.opportunities, JSON.stringify(state.opportunities));
    localStorage.setItem(STORAGE.saved, JSON.stringify([...state.saved]));
    localStorage.setItem(STORAGE.applications, JSON.stringify(state.applications));
  }

  async function loadInitialData() {
    // AJAX: fetch the bundled JSON file. Run this project with VS Code Live Server
    // or another local static server; file:// URLs block fetch in most browsers.
    try {
      const response = await fetch("./opportunities.json", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Dataset request failed (${response.status})`);
      const payload = await response.json();
      if (!Array.isArray(payload.opportunities)) throw new Error("Unexpected dataset format");
      const stored = localStorage.getItem(STORAGE.opportunities);
      state.opportunities = stored ? JSON.parse(stored) : payload.opportunities;
    } catch (error) {
      console.warn("Could not fetch opportunities.json; using built-in fallback data.", error);
      // Keep a resilient offline fallback for environments where fetch is unavailable.
      state.opportunities = state.opportunities.length ? state.opportunities : fallbackOpportunities();
      const saved = localStorage.getItem(STORAGE.opportunities);
      if (saved) {
        try { state.opportunities = JSON.parse(saved); } catch { /* ignore invalid local data */ }
      }
      toast("Loaded offline fallback data. Use Live Server for JSON fetch.", "error");
    }
    try {
      state.saved = new Set(JSON.parse(localStorage.getItem(STORAGE.saved) || "[]"));
      state.applications = JSON.parse(localStorage.getItem(STORAGE.applications) || "[]");
      if (!Array.isArray(state.applications)) state.applications = [];
    } catch {
      state.saved = new Set();
      state.applications = [];
      toast("Some local data could not be read; a clean workspace was opened.", "error");
    }
    if (localStorage.getItem(STORAGE.theme) === "dark") document.body.classList.add("dark");
    renderAll();
  }

  function fallbackOpportunities() {
    return [
      { id:"opp-001", title:"Frontend Developer Intern", company:"PixelForge", type:"Internship", mode:"Remote", location:"Remote · India", pay:"₹12,000 / month", deadline:"2026-11-18", url:"https://github.com/", skills:["HTML","CSS","JavaScript"], description:"Build polished, accessible web experiences with a small product team.", color:"purple", addedAt:"2026-10-28" },
      { id:"opp-002", title:"National Innovation Hackathon", company:"Buildathon India", type:"Hackathon", mode:"Hybrid", location:"Ahmedabad, Gujarat", pay:"₹1,00,000 prize pool", deadline:"2026-11-12", url:"https://devpost.com/", skills:["Problem solving","Teamwork"], description:"Team up to solve practical challenges and present a working prototype.", color:"orange", addedAt:"2026-10-27" },
      { id:"opp-003", title:"JavaScript & Web APIs Lab", company:"CodeCraft Community", type:"Workshop", mode:"Remote", location:"Online", pay:"Free", deadline:"2026-11-08", url:"https://developer.mozilla.org/", skills:["JavaScript","Fetch API","XML"], description:"A hands-on session covering asynchronous JavaScript, Fetch, JSON and APIs.", color:"blue", addedAt:"2026-10-29" }
    ];
  }

  function renderAll() {
    renderStats();
    renderFeatured();
    renderPipeline();
    renderDiscover();
    renderApplications();
    renderSaved();
    $("#discoverCount").textContent = state.opportunities.length;
    $("#tipProgress").style.width = `${Math.min(state.applications.length * 12, 100)}%`;
    $("#tipProgressLabel").textContent = `${state.applications.length} application${state.applications.length === 1 ? "" : "s"} tracked`;
    $("#todayLabel").textContent = state.applications.length ? `${state.applications.length} step${state.applications.length === 1 ? "" : "s"} in motion` : "Your next step starts today";
  }

  function renderStats() {
    const apps = state.applications;
    $("#statApplications").textContent = apps.length;
    $("#statInProgress").textContent = apps.filter(a => ["Interested","Applied","Assessment","Interview"].includes(a.status)).length;
    $("#statSaved").textContent = state.saved.size;
    $("#statWins").textContent = apps.filter(a => ["Interview","Offer"].includes(a.status)).length;
    $("#statApplicationFoot").textContent = apps.length ? `${apps.filter(a => a.status === "Applied").length} marked as applied` : "Your journey starts here";
    const now = new Date();
    $("#fullDate").textContent = new Intl.DateTimeFormat("en-IN", { weekday:"long", day:"numeric", month:"long" }).format(now);
    $("#tipProgressLabel").textContent = `${apps.length} application${apps.length === 1 ? "" : "s"} tracked`;
  }

  function renderFeatured() {
    const featured = [...state.opportunities].sort((a,b) => (a.deadline || "9999").localeCompare(b.deadline || "9999")).slice(0, 4);
    $("#featuredList").innerHTML = featured.map(item => `
      <article class="featured-item">
        <div class="company-mark ${colors[item.color] || colors.purple}">${escapeHTML(initials(item.company))}</div>
        <div class="featured-info"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.company)} · ${escapeHTML(item.mode)}</small><div class="featured-tags"><span class="tag tag-purple">${escapeHTML(item.type)}</span><span class="tag">${escapeHTML(item.pay || "Details inside")}</span></div></div>
        <button class="save-btn ${state.saved.has(item.id) ? "saved" : ""}" data-save="${escapeHTML(item.id)}" aria-label="${state.saved.has(item.id) ? "Unsave" : "Save"} ${escapeHTML(item.title)}">${state.saved.has(item.id) ? "♥" : "♡"}</button>
      </article>`).join("") || `<p class="page-subtitle">Add your first opportunity to get started.</p>`;
  }

  function renderPipeline() {
    const count = status => state.applications.filter(a => a.status === status).length;
    const values = [{label:"Applied", value:count("Applied"), cls:"applied"},{label:"Interview", value:count("Interview"), cls:"interview"},{label:"Offer", value:count("Offer"), cls:"offer"}];
    const max = Math.max(1, ...values.map(item => item.value));
    $("#pipelineChart").innerHTML = values.map(item => `<div class="pipeline-column"><div class="pipeline-bar ${item.cls}" style="height:${Math.max(5, item.value / max * 100)}%"></div><span class="pipeline-label">${item.label} <b>${item.value}</b></span></div>`).join("");
  }

  function deadlineLabel(value) {
    if (!value) return "No deadline";
    const days = Math.ceil((new Date(`${value}T23:59:59`) - new Date()) / 86400000);
    if (days < 0) return "Deadline passed";
    if (days === 0) return "Due today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  }

  function cardMarkup(item) {
    const saved = state.saved.has(item.id);
    const app = getApplication(item.id);
    const skills = (item.skills || []).slice(0, 3).map(skill => `<span class="tag">${escapeHTML(skill)}</span>`).join("");
    const deadline = deadlineLabel(item.deadline);
    const soon = item.deadline && (new Date(`${item.deadline}T23:59:59`) - new Date()) < 4 * 86400000;
    return `<article class="opportunity-card">
      <div class="card-top"><div class="card-company"><span class="company-mark ${colors[item.color] || colors.purple}">${escapeHTML(initials(item.company))}</span><div><strong>${escapeHTML(item.company)}</strong><small>${escapeHTML(item.location || item.mode || "Location not set")}</small></div></div><button class="save-btn ${saved ? "saved" : ""}" data-save="${escapeHTML(item.id)}" aria-label="${saved ? "Unsave" : "Save"} ${escapeHTML(item.title)}">${saved ? "♥" : "♡"}</button></div>
      <h3 class="card-title">${escapeHTML(item.title)}</h3><p class="card-description">${escapeHTML(item.description || "No description provided.")}</p>
      <div class="card-tags"><span class="tag tag-purple">${escapeHTML(item.type)}</span><span class="tag">${escapeHTML(item.mode)}</span>${skills}</div>
      <div class="card-bottom"><div class="card-pay"><strong>${escapeHTML(item.pay || "See details")}</strong><small class="deadline-tag ${soon ? "soon" : ""}">${escapeHTML(deadline)}</small></div><div class="card-actions">${app ? `<button class="secondary-btn" data-edit-app="${escapeHTML(item.id)}">Track: ${escapeHTML(app.status)}</button>` : `<button class="primary-btn" data-track="${escapeHTML(item.id)}">Track ↗</button>`}${item.url ? `<button class="secondary-btn" data-open-url="${escapeHTML(item.url)}" aria-label="Open opportunity link">↗</button>` : ""}</div></div>
    </article>`;
  }

  function filteredOpportunities() {
    const query = state.search.trim().toLowerCase();
    let items = state.opportunities.filter(item => {
      const searchable = [item.title,item.company,item.type,item.mode,item.location,item.description,...(item.skills || [])].join(" ").toLowerCase();
      return (!query || searchable.includes(query)) && (state.type === "all" || item.type === state.type) && (state.mode === "all" || item.mode === state.mode);
    });
    if (state.sort === "deadline") items.sort((a,b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
    if (state.sort === "newest") items.sort((a,b) => (b.addedAt || "").localeCompare(a.addedAt || ""));
    return items;
  }

  function renderDiscover() {
    const items = filteredOpportunities();
    $("#discoverGrid").innerHTML = items.map(cardMarkup).join("");
    $("#resultsCount").textContent = `Showing ${items.length} of ${state.opportunities.length} opportunities`;
    $("#discoverEmpty").classList.toggle("hidden", items.length > 0);
    $("#discoverGrid").classList.toggle("hidden", items.length === 0);
  }

  function renderSaved() {
    const items = state.opportunities.filter(item => state.saved.has(item.id));
    $("#savedGrid").innerHTML = items.map(cardMarkup).join("");
    $("#savedEmpty").classList.toggle("hidden", items.length > 0);
    $("#savedGrid").classList.toggle("hidden", items.length === 0);
    $("#savedCountPill").textContent = `${items.length} saved`;
  }

  function renderApplications() {
    const counts = {
      total: state.applications.length,
      applied: state.applications.filter(a => a.status === "Applied").length,
      interview: state.applications.filter(a => a.status === "Interview").length,
      offer: state.applications.filter(a => a.status === "Offer").length
    };
    $("#applicationSummary").innerHTML = [
      ["Total tracked", counts.total],["Applied", counts.applied],["Interviews", counts.interview],["Offers", counts.offer]
    ].map(([label,value]) => `<div class="summary-chip"><small>${label}</small><strong>${value}</strong></div>`).join("");
    const query = state.appSearch.toLowerCase().trim();
    const apps = state.applications.filter(app => {
      const item = byId(app.opportunityId);
      const matchesStatus = state.appStatusFilter === "all" || (state.appStatusFilter === "Rejected" ? app.status === "Rejected" : app.status === state.appStatusFilter);
      return matchesStatus && (!query || `${item?.title || ""} ${item?.company || ""} ${app.status} ${app.note || ""}`.toLowerCase().includes(query));
    });
    $("#applicationsTableBody").innerHTML = apps.map(app => {
      const item = byId(app.opportunityId) || { title:app.title || "Imported opportunity", company:app.company || "Unknown", color:"purple", deadline:"" };
      return `<tr><td><div class="table-opportunity"><span class="company-mark ${colors[item.color] || colors.purple}">${escapeHTML(initials(item.company))}</span><div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.company)}</small></div></div></td><td><span class="status-badge ${statusClass(app.status)}">${escapeHTML(app.status)}</span></td><td>${escapeHTML(formatDate(item.deadline))}</td><td>${escapeHTML(formatDate(app.appliedOn))}</td><td><div class="row-actions"><button data-edit-app="${escapeHTML(app.opportunityId)}" aria-label="Edit application">✎</button><button data-remove-app="${escapeHTML(app.opportunityId)}" aria-label="Remove application">×</button></div></td></tr>`;
    }).join("");
    $("#applicationsEmpty").classList.toggle("hidden", apps.length > 0);
    $(".table-wrap").classList.toggle("hidden", apps.length === 0);
  }

  function switchView(view) {
    if (!["overview","discover","applications","saved"].includes(view)) return;
    state.view = view;
    $$(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
    $$(".nav-item[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === view));
    $("#breadcrumbCurrent").textContent = ({overview:"Overview",discover:"Discover",applications:"My applications",saved:"Saved opportunities"})[view];
    $("#sidebar").classList.remove("open");
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function toggleSave(id) {
    if (!byId(id)) return;
    if (state.saved.has(id)) { state.saved.delete(id); toast("Removed from your shortlist."); }
    else { state.saved.add(id); toast("Saved to your shortlist."); }
    persist(); renderAll();
  }

  function trackOpportunity(id) {
    const item = byId(id);
    if (!item) return;
    const existing = getApplication(id);
    if (existing) { openStatusModal(id); return; }
    state.applications.push({ opportunityId:id, status:"Interested", appliedOn:"", note:"", createdAt:todayISO() });
    persist(); renderAll(); toast("Opportunity added to your application tracker.");
  }

  function openModal() {
    $("#opportunityForm").reset();
    $("#modalBackdrop").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => $('[name="title"]', $("#opportunityForm")).focus(), 30);
  }
  function closeModal() { $("#modalBackdrop").classList.add("hidden"); document.body.style.overflow = ""; }

  function openStatusModal(id) {
    const item = byId(id);
    let app = getApplication(id);
    if (!app) {
      if (!item) return;
      app = { opportunityId:id, status:"Interested", appliedOn:"", note:"", createdAt:todayISO() };
      state.applications.push(app);
    }
    const form = $("#statusForm");
    form.elements.id.value = id;
    form.elements.status.value = app.status || "Interested";
    form.elements.appliedOn.value = app.appliedOn || "";
    form.elements.note.value = app.note || "";
    $("#statusModalTitle").textContent = item ? item.title : "Update application";
    $("#statusModalBackdrop").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeStatusModal() { $("#statusModalBackdrop").classList.add("hidden"); document.body.style.overflow = ""; }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function xmlEscape(value) {
    return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  }
  function createXML() {
    const doc = document.implementation.createDocument("", "launchpadBackup", null);
    const root = doc.documentElement;
    root.setAttribute("version","1");
    root.setAttribute("exportedAt",new Date().toISOString());
    const opportunitiesNode = doc.createElement("opportunities");
    state.opportunities.forEach(item => {
      const node = doc.createElement("opportunity");
      Object.entries(item).forEach(([key,value]) => {
        if (key === "skills") {
          const skills = doc.createElement("skills");
          (value || []).forEach(skill => { const el = doc.createElement("skill"); el.textContent = skill; skills.appendChild(el); });
          node.appendChild(skills);
        } else { const el = doc.createElement(key); el.textContent = value ?? ""; node.appendChild(el); }
      });
      opportunitiesNode.appendChild(node);
    });
    root.appendChild(opportunitiesNode);
    const savedNode = doc.createElement("saved");
    [...state.saved].forEach(id => { const el = doc.createElement("id"); el.textContent = id; savedNode.appendChild(el); });
    root.appendChild(savedNode);
    const appsNode = doc.createElement("applications");
    state.applications.forEach(app => {
      const node = doc.createElement("application");
      Object.entries(app).forEach(([key,value]) => { const el = doc.createElement(key); el.textContent = value ?? ""; node.appendChild(el); });
      appsNode.appendChild(node);
    });
    root.appendChild(appsNode);
    return new XMLSerializer().serializeToString(doc);
  }
  function exportXML() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n${createXML()}`;
    downloadFile(`launchpad-backup-${todayISO()}.xml`, xml, "application/xml;charset=utf-8");
    toast("XML backup exported successfully.");
  }

  function parseXML(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror") || doc.documentElement.nodeName !== "launchpadBackup") throw new Error("This XML file is not a valid LaunchPad backup.");
    const parseText = (parent, selector) => parent.querySelector(selector)?.textContent?.trim() || "";
    const opportunities = [...doc.querySelectorAll("opportunities > opportunity")].map(node => {
      const item = {};
      [...node.children].forEach(child => {
        if (child.tagName === "skills") item.skills = [...child.querySelectorAll("skill")].map(skill => skill.textContent.trim());
        else item[child.tagName] = child.textContent.trim();
      });
      if (!item.id || !item.title || !item.company) throw new Error("An opportunity is missing a required field.");
      if (!Array.isArray(item.skills)) item.skills = [];
      return item;
    });
    const saved = [...doc.querySelectorAll("saved > id")].map(node => node.textContent.trim()).filter(Boolean);
    const applications = [...doc.querySelectorAll("applications > application")].map(node => {
      const app = {};
      [...node.children].forEach(child => { app[child.tagName] = child.textContent.trim(); });
      if (!app.opportunityId) throw new Error("An application is missing its opportunity ID.");
      return app;
    });
    return { opportunities, saved, applications };
  }

  async function importXMLFile(file) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("Please choose an XML file smaller than 2 MB.");
      const textContent = await file.text();
      const imported = parseXML(textContent);
      const byOpportunityId = new Map(state.opportunities.map(item => [item.id,item]));
      imported.opportunities.forEach(item => byOpportunityId.set(item.id,item));
      state.opportunities = [...byOpportunityId.values()];
      imported.saved.forEach(id => state.saved.add(id));
      const appMap = new Map(state.applications.map(app => [app.opportunityId,app]));
      imported.applications.forEach(app => appMap.set(app.opportunityId,app));
      state.applications = [...appMap.values()];
      persist(); renderAll(); closeDataModal();
      toast(`Imported ${imported.opportunities.length} opportunities and ${imported.applications.length} applications.`);
    } catch (error) { toast(error.message || "Could not import this XML file.", "error"); }
  }

  function closeDataModal() { $("#dataModalBackdrop").classList.add("hidden"); document.body.style.overflow = ""; }
  function openDataModal() { $("#dataModalBackdrop").classList.remove("hidden"); document.body.style.overflow = "hidden"; }

  function bindEvents() {
    $$(".nav-item[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
    $$("[data-go]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.go)));
    $("#addOpportunityTop").addEventListener("click", openModal);
    $("#addOpportunityDiscover").addEventListener("click", openModal);
    $("#closeModal").addEventListener("click", closeModal);
    $("#cancelModal").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", event => { if (event.target === $("#modalBackdrop")) closeModal(); });
    $("#closeStatusModal").addEventListener("click", closeStatusModal);
    $("#cancelStatusModal").addEventListener("click", closeStatusModal);
    $("#statusModalBackdrop").addEventListener("click", event => { if (event.target === $("#statusModalBackdrop")) closeStatusModal(); });
    $("#dataToolsBtn").addEventListener("click", openDataModal);
    $("#closeDataModal").addEventListener("click", closeDataModal);
    $("#dataModalBackdrop").addEventListener("click", event => { if (event.target === $("#dataModalBackdrop")) closeDataModal(); });
    $("#exportXmlBtn").addEventListener("click", exportXML);
    $("#exportApplications").addEventListener("click", exportXML);
    $("#exportQuick").addEventListener("click", exportXML);
    $("#importXmlInput").addEventListener("change", event => { importXMLFile(event.target.files[0]); event.target.value = ""; });
    $("#resetDataBtn").addEventListener("click", async () => {
      if (!window.confirm("Reset all LaunchPad changes in this browser? Your saved items and application tracker will be cleared.")) return;
      Object.values(STORAGE).forEach(key => localStorage.removeItem(key));
      state.opportunities = []; state.saved = new Set(); state.applications = [];
      closeDataModal(); await loadInitialData(); toast("Demo data restored.");
    });
    $("#opportunityForm").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const id = `custom-${Date.now()}`;
      const item = {
        id, title:String(data.get("title")).trim(), company:String(data.get("company")).trim(),
        type:String(data.get("type")), mode:String(data.get("mode")), location:String(data.get("location")).trim(),
        pay:String(data.get("pay")).trim() || "Details inside", deadline:String(data.get("deadline")),
        url:String(data.get("url")).trim(), skills:String(data.get("skills")).split(",").map(s => s.trim()).filter(Boolean),
        description:String(data.get("description")).trim() || "No description provided yet.", color:["purple","orange","green","blue","pink"][state.opportunities.length % 5], addedAt:todayISO()
      };
      state.opportunities.unshift(item); persist(); renderAll(); closeModal(); switchView("discover"); toast("Your opportunity has been added.");
    });
    $("#statusForm").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const id = form.elements.id.value;
      let app = getApplication(id);
      if (!app) { app = { opportunityId:id, createdAt:todayISO() }; state.applications.push(app); }
      app.status = form.elements.status.value;
      app.appliedOn = form.elements.appliedOn.value;
      app.note = form.elements.note.value.trim();
      persist(); renderAll(); closeStatusModal(); toast("Application status updated.");
    });
    $("#searchInput").addEventListener("input", event => { state.search = event.target.value; renderDiscover(); });
    $("#typeFilter").addEventListener("change", event => { state.type = event.target.value; renderDiscover(); });
    $("#modeFilter").addEventListener("change", event => { state.mode = event.target.value; renderDiscover(); });
    $("#sortFilter").addEventListener("change", event => { state.sort = event.target.value; renderDiscover(); });
    const clearFilters = () => { state.search = ""; state.type = "all"; state.mode = "all"; state.sort = "recommended"; $("#searchInput").value = ""; $("#typeFilter").value = "all"; $("#modeFilter").value = "all"; $("#sortFilter").value = "recommended"; renderDiscover(); };
    $("#clearFilters").addEventListener("click", clearFilters);
    $("#emptyClearFilters").addEventListener("click", clearFilters);
    $("#applicationSearch").addEventListener("input", event => { state.appSearch = event.target.value; renderApplications(); });
    $("#applicationTabs").addEventListener("click", event => {
      const button = event.target.closest("button[data-status]");
      if (!button) return;
      state.appStatusFilter = button.dataset.status;
      $$("#applicationTabs button").forEach(item => item.classList.toggle("active", item === button));
      renderApplications();
    });
    // Event delegation means cards can be re-rendered without rebinding every button.
    document.addEventListener("click", event => {
      const save = event.target.closest("[data-save]");
      const track = event.target.closest("[data-track]");
      const edit = event.target.closest("[data-edit-app]");
      const remove = event.target.closest("[data-remove-app]");
      const openUrl = event.target.closest("[data-open-url]");
      if (save) toggleSave(save.dataset.save);
      if (track) trackOpportunity(track.dataset.track);
      if (edit) openStatusModal(edit.dataset.editApp);
      if (remove) {
        const id = remove.dataset.removeApp;
        if (window.confirm("Remove this opportunity from your application tracker?")) {
          state.applications = state.applications.filter(app => app.opportunityId !== id);
          persist(); renderAll(); toast("Application removed.");
        }
      }
      if (openUrl) {
        const url = openUrl.dataset.openUrl;
        try { const parsed = new URL(url); if (["http:","https:"].includes(parsed.protocol)) window.open(parsed.href,"_blank","noopener,noreferrer"); else toast("Only HTTP and HTTPS links are supported.","error"); }
        catch { toast("This opportunity link is invalid.","error"); }
      }
    });
    $("#themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(STORAGE.theme, document.body.classList.contains("dark") ? "dark" : "light");
    });
    $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#profileMenuBtn").addEventListener("click", () => toast("Workspace data is stored locally in this browser."));
    document.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); switchView("discover"); $("#searchInput").focus(); }
      if (event.key === "Escape") { closeModal(); closeStatusModal(); closeDataModal(); $("#sidebar").classList.remove("open"); }
    });
  }

  bindEvents();
  loadInitialData();
})();
