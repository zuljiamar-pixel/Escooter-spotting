import { BRANDS, findBrandByName, findModel, normalize } from "./catalog.js";
import { db } from "./db.js";
import { settings, customCatalog } from "./settings.js";

const $ = (sel) => document.querySelector(sel);
const NEW = "__new__";

const state = {
  spots: [],
  photo: null,        // { full: dataURL (für KI), thumb: dataURL (zum Speichern) }
  aiResult: null,     // Rohantwort der KI
  aiMatch: null,      // { brandId, brandName, model, type }
  editingId: null,    // wenn ein bestehender Spot geändert wird
};

// ---------- Katalog (eingebaut + eigene Ergänzungen) ----------
function getCatalog() {
  const custom = customCatalog.get();
  const brands = [...BRANDS, ...custom.brands].map((b) => ({
    ...b,
    models: [...new Set([...b.models, ...(custom.models[b.id] || [])])],
  }));
  return brands;
}
const brandOf = (id) => getCatalog().find((b) => b.id === id);
const modelKey = (brandId, model) => `${brandId}::${normalize(model)}`;

// ---------- Navigation ----------
function show(view) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
  if (view === "spots") renderSpots();
  if (view === "catalog") renderCatalog();
  if (view === "stats") renderStats();
  if (view === "settings") loadSettingsForm();
  if (view === "scan") updateKeyHint();
  window.scrollTo({ top: 0 });
}
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));
document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => show(b.dataset.goto)));

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.add("hidden"), 2800);
}

function updateKeyHint() {
  $("#no-key-hint").classList.toggle("hidden", !!settings.get().apiKey);
}

// ---------- Bild laden ----------
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = src;
  });
}

function resize(img, max, quality) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function handleFile(file) {
  if (!file || !file.type.startsWith("image/")) return toast("Bitte ein Bild auswählen.");
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    state.photo = { full: resize(img, 1400, 0.88), thumb: resize(img, 640, 0.78) };
  } catch (e) {
    return toast(e.message);
  } finally {
    URL.revokeObjectURL(url);
  }
  state.editingId = null;
  startStage();
}

function startStage() {
  state.aiResult = null;
  state.aiMatch = null;
  $("#scan-photo").src = state.photo.thumb;
  $("#dropzone").classList.add("hidden");
  $("#scan-stage").classList.remove("hidden");
  $("#scan-actions").classList.remove("hidden");
  $("#result").classList.add("hidden");
  $("#correct-form").classList.add("hidden");
  setStatus(null);
}

function resetScan() {
  state.photo = null;
  state.editingId = null;
  $("#scan-stage").classList.add("hidden");
  $("#dropzone").classList.remove("hidden");
  $("#camera-input").value = "";
  $("#file-input").value = "";
}

$("#camera-input").addEventListener("change", (e) => handleFile(e.target.files[0]));
$("#file-input").addEventListener("change", (e) => handleFile(e.target.files[0]));
const dz = $("#dropzone");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag"); });
dz.addEventListener("dragleave", () => dz.classList.remove("drag"));
dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("drag"); handleFile(e.dataTransfer.files[0]); });
$("#btn-reset").addEventListener("click", resetScan);

function setStatus(msg, isError = false) {
  const el = $("#scan-status");
  el.classList.toggle("hidden", !msg);
  el.classList.toggle("error", isError);
  el.textContent = msg || "";
}

// ---------- KI-Scan ----------
$("#btn-analyze").addEventListener("click", async () => {
  const { apiKey, model } = settings.get();
  if (!apiKey) {
    toast("Bitte zuerst einen API-Key in den Einstellungen eintragen.");
    return show("settings");
  }
  const btn = $("#btn-analyze");
  btn.disabled = true;
  $("#scanline").classList.remove("hidden");
  $(".photo-wrap").classList.add("scanning");
  $("#result").classList.add("hidden");
  $("#correct-form").classList.add("hidden");
  setStatus("🔍 KI scannt den E-Scooter … Rahmen, Lenker, Räder, Logos …");

  try {
    const { identifyScooter } = await import("./ai.js");
    const [, mediaType, data] = state.photo.full.match(/^data:(.+?);base64,(.*)$/);
    const result = await identifyScooter({
      apiKey, model, imageBase64: data, mediaType, catalog: getCatalog(),
    });
    state.aiResult = result;
    setStatus(null);
    showResult(result);
  } catch (err) {
    console.error(err);
    setStatus("⚠️ " + (err.message || "Unbekannter Fehler"), true);
  } finally {
    btn.disabled = false;
    $("#scanline").classList.add("hidden");
    $(".photo-wrap").classList.remove("scanning");
  }
});

function matchToCatalog(brandName, modelName) {
  const known = (s) => s && !/^unbekannt$/i.test(s.trim());
  if (!known(brandName)) return null;
  const brand = findBrandByName(brandName) ||
    getCatalog().find((b) => normalize(b.name) === normalize(brandName));
  if (!brand) {
    return { brandId: null, brandName, model: known(modelName) ? modelName : "Unbekanntes Modell", type: "privat" };
  }
  const model = findModel(brand, modelName) || (known(modelName) ? modelName : null);
  return model ? { brandId: brand.id, brandName: brand.name, model, type: brand.type } : null;
}

function showResult(r) {
  if (!r.is_escooter) {
    setStatus("🤔 Die KI hat auf dem Bild keinen E-Scooter gefunden. Du kannst ihn manuell auswählen.", true);
    return openCorrect();
  }
  const match = matchToCatalog(r.brand, r.model);
  if (!match) {
    setStatus("🤔 Die KI konnte den Scooter nicht sicher erkennen. Bitte wähle ihn manuell aus.", true);
    return openCorrect();
  }
  state.aiMatch = match;

  $("#res-title").textContent = `${match.brandName} ${match.model}`;
  const type = $("#res-type");
  type.textContent = match.type === "sharing" ? "Sharing" : "Privat-Scooter";
  type.className = `pill ${match.type}`;
  const pct = Math.round(Math.max(0, Math.min(1, r.confidence)) * 100);
  $("#res-conf").textContent = `${pct}%`;
  $("#res-ring").style.strokeDasharray = "0 100";
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $("#res-ring").style.strokeDasharray = `${pct} 100`;
  }));
  $("#res-ring").style.stroke = pct >= 70 ? "var(--accent)" : pct >= 40 ? "#ffc857" : "var(--danger)";

  const inCatalog = !!(match.brandId && findModel(brandOf(match.brandId), match.model));
  const alreadySpotted = match.brandId && state.spots.some((s) => modelKey(s.brandId, s.model) === modelKey(match.brandId, match.model));
  $("#res-new").classList.toggle("hidden", !!alreadySpotted);
  $("#res-new").textContent = inCatalog ? "✨ Neu in deiner Sammlung!" : "✨ Neues Modell – wird zum Katalog hinzugefügt!";

  $("#res-features").innerHTML = "";
  (r.features || []).forEach((f) => {
    const li = document.createElement("li");
    li.textContent = f;
    $("#res-features").appendChild(li);
  });
  $("#res-notes").textContent = r.notes || "";

  const alts = $("#res-alts");
  alts.innerHTML = "";
  const altList = (r.alternatives || []).map((a) => ({ a, m: matchToCatalog(a.brand, a.model) })).filter((x) => x.m);
  if (altList.length) {
    const label = document.createElement("div");
    label.className = "muted small";
    label.style.width = "100%";
    label.textContent = "Oder vielleicht:";
    alts.appendChild(label);
    altList.forEach(({ a, m }) => {
      const chip = document.createElement("button");
      chip.className = "alt-chip";
      chip.textContent = `${m.brandName} ${m.model} · ${Math.round(a.confidence * 100)}%`;
      chip.addEventListener("click", () => openCorrect(m));
      alts.appendChild(chip);
    });
  }

  $("#scan-actions").classList.remove("hidden");
  $("#result").classList.remove("hidden");
}

$("#btn-confirm").addEventListener("click", async () => {
  const m = state.aiMatch;
  await saveSpot({ brandId: m.brandId, brandName: m.brandName, model: m.model, type: m.type, corrected: false });
});
$("#btn-correct").addEventListener("click", () => openCorrect(state.aiMatch));
$("#btn-manual").addEventListener("click", () => openCorrect());
$("#btn-cancel-correct").addEventListener("click", () => {
  $("#correct-form").classList.add("hidden");
  if (state.editingId) { resetScan(); show("spots"); }
});

// ---------- Korrigieren / manuell auswählen ----------
function fillBrandSelect(selectedId) {
  const sel = $("#sel-brand");
  const cat = getCatalog();
  const group = (label, list) => {
    const g = document.createElement("optgroup");
    g.label = label;
    list.sort((a, b) => a.name.localeCompare(b.name)).forEach((b) => g.appendChild(new Option(b.name, b.id)));
    return g;
  };
  sel.innerHTML = "";
  sel.appendChild(new Option("– Marke wählen –", ""));
  sel.appendChild(group("Privat-Scooter", cat.filter((b) => b.type === "privat")));
  sel.appendChild(group("Sharing-Anbieter", cat.filter((b) => b.type === "sharing")));
  sel.appendChild(new Option("➕ Andere Marke …", NEW));
  sel.value = selectedId || "";
}

function fillModelSelect(brandId, selectedModel) {
  const sel = $("#sel-model");
  sel.innerHTML = "";
  const brand = brandOf(brandId);
  if (brandId && brandId !== NEW && brand) {
    sel.appendChild(new Option("– Modell wählen –", ""));
    brand.models.forEach((m) => sel.appendChild(new Option(m, m)));
  }
  sel.appendChild(new Option("➕ Anderes Modell …", NEW));
  const match = brand && selectedModel ? findModel(brand, selectedModel) : null;
  sel.value = match || (selectedModel ? NEW : (brandId === NEW ? NEW : ""));
  $("#new-model").value = !match && selectedModel ? selectedModel : "";
  toggleNewFields();
}

function toggleNewFields() {
  $("#new-brand-wrap").classList.toggle("hidden", $("#sel-brand").value !== NEW);
  $("#new-model-wrap").classList.toggle("hidden", $("#sel-model").value !== NEW);
}

$("#sel-brand").addEventListener("change", (e) => fillModelSelect(e.target.value));
$("#sel-model").addEventListener("change", toggleNewFields);

function openCorrect(preset) {
  const brandId = preset?.brandId || (preset?.brandName ? NEW : "");
  fillBrandSelect(brandId);
  $("#new-brand").value = !preset?.brandId && preset?.brandName ? preset.brandName : "";
  fillModelSelect(brandId, preset?.model);
  if (!state.editingId) $("#spot-place").value = "";
  $("#correct-title").textContent = state.editingId ? "Spot bearbeiten" : state.aiMatch ? "KI korrigieren" : "Scooter auswählen";
  $("#correct-form").classList.remove("hidden");
  $("#correct-form").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

$("#correct-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  let brandId = $("#sel-brand").value;
  let model = $("#sel-model").value;
  if (!brandId) return toast("Bitte eine Marke auswählen.");
  if (brandId === NEW) {
    const name = $("#new-brand").value.trim();
    if (!name) return toast("Bitte den Namen der Marke eingeben.");
    brandId = findBrandByName(name)?.id || customCatalog.addBrand(name, "privat");
  }
  if (!model || model === NEW) {
    model = $("#new-model").value.trim();
    if (!model) return toast("Bitte ein Modell auswählen oder eingeben.");
  }
  const brand = brandOf(brandId);
  const ai = state.aiMatch;
  const corrected = !!ai && modelKey(ai.brandId, ai.model) !== modelKey(brandId, model);
  await saveSpot({ brandId, brandName: brand.name, model, type: brand.type, corrected });
});

async function saveSpot({ brandId, brandName, model, type, corrected }) {
  // Unbekannte Marke/Modell automatisch zum Katalog hinzufügen
  if (!brandId) brandId = customCatalog.addBrand(brandName, type);
  const brand = brandOf(brandId);
  const exact = brand.models.find((m) => normalize(m) === normalize(model));
  if (exact) model = exact;
  else customCatalog.addModel(brandId, model);

  const existing = state.editingId ? state.spots.find((s) => s.id === state.editingId) : null;
  const isNew = !state.spots.some((s) => s.id !== existing?.id && modelKey(s.brandId, s.model) === modelKey(brandId, model));
  const spot = {
    ...(existing || {}),
    id: existing?.id || crypto.randomUUID(),
    createdAt: existing?.createdAt || Date.now(),
    brandId,
    brandName: brand.name,
    model,
    type: brand.type,
    place: $("#spot-place").value.trim() || existing?.place || "",
    image: existing?.image || state.photo.thumb,
    ai: existing ? existing.ai : state.aiResult ? {
      brand: state.aiResult.brand, model: state.aiResult.model, confidence: state.aiResult.confidence,
    } : null,
    corrected: existing ? (existing.corrected || corrected) : corrected,
  };
  await db.put(spot);
  await refreshSpots();
  toast(existing ? "✔ Spot aktualisiert" : isNew ? `🎉 Neuer Scooter: ${brand.name} ${model}!` : `✔ ${brand.name} ${model} gespeichert`);
  const wasEditing = !!existing;
  resetScan();
  if (wasEditing) show("spots");
}

// ---------- Meine Spots ----------
async function refreshSpots() {
  state.spots = await db.all();
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderSpots() {
  const q = normalize($("#spots-search").value || "");
  const list = state.spots.filter((s) => !q || normalize(`${s.brandName} ${s.model} ${s.place}`).includes(q));
  $("#spots-count").textContent = `(${state.spots.length})`;
  $("#spots-empty").classList.toggle("hidden", state.spots.length > 0);
  const grid = $("#spots-grid");
  grid.innerHTML = "";
  list.forEach((s) => {
    const card = document.createElement("article");
    card.className = "spot";
    card.innerHTML = `
      <img alt="" loading="lazy">
      <div class="body">
        <div class="brand"></div>
        <div class="model"></div>
        <div class="meta"></div>
      </div>
      <div class="actions">
        <button data-act="edit">✏️ Ändern</button>
        <button data-act="del">🗑️ Löschen</button>
      </div>`;
    card.querySelector("img").src = s.image;
    card.querySelector(".brand").textContent = s.brandName + (s.type === "sharing" ? " · Sharing" : "");
    card.querySelector(".model").textContent = s.model;
    const meta = [fmtDate(s.createdAt), s.place, s.ai ? (s.corrected ? "KI korrigiert" : `KI ${Math.round(s.ai.confidence * 100)}%`) : "manuell"]
      .filter(Boolean).join(" · ");
    card.querySelector(".meta").textContent = meta;
    card.querySelector('[data-act="del"]').addEventListener("click", async () => {
      if (!confirm(`Spot "${s.brandName} ${s.model}" löschen?`)) return;
      await db.remove(s.id);
      await refreshSpots();
      renderSpots();
    });
    card.querySelector('[data-act="edit"]').addEventListener("click", () => editSpot(s));
    grid.appendChild(card);
  });
}
$("#spots-search").addEventListener("input", renderSpots);

function editSpot(s) {
  show("scan");
  state.photo = { full: s.image, thumb: s.image };
  startStage();
  state.editingId = s.id;
  $("#scan-actions").classList.add("hidden");
  $("#spot-place").value = s.place || "";
  openCorrect({ brandId: s.brandId, brandName: s.brandName, model: s.model });
}

// ---------- Katalog ----------
function spotCounts() {
  const byModel = new Map();
  const byBrand = new Map();
  state.spots.forEach((s) => {
    const k = modelKey(s.brandId, s.model);
    byModel.set(k, (byModel.get(k) || 0) + 1);
    byBrand.set(s.brandId, (byBrand.get(s.brandId) || 0) + 1);
  });
  return { byModel, byBrand };
}

function renderCatalog() {
  const q = normalize($("#cat-search").value || "");
  const filter = $("#cat-filter").value;
  const { byModel } = spotCounts();
  const cat = getCatalog();

  const totalModels = cat.reduce((n, b) => n + b.models.length, 0);
  const spottedModels = cat.reduce((n, b) => n + b.models.filter((m) => byModel.has(modelKey(b.id, m))).length, 0);
  const pct = totalModels ? Math.round((spottedModels / totalModels) * 100) : 0;
  $("#cat-summary").innerHTML = `
    <p><b>${spottedModels}</b> von <b>${totalModels}</b> Modellen gespottet (${pct}%) · ${cat.length} Marken</p>
    <div class="progress"><div style="width:${pct}%"></div></div>`;

  const list = $("#cat-list");
  list.innerHTML = "";
  cat
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((b) => {
      if (filter === "privat" || filter === "sharing") { if (b.type !== filter) return; }
      const brandMatch = !q || normalize(b.name).includes(q);
      let models = b.models.filter((m) => brandMatch || normalize(m).includes(q));
      if (filter === "spotted") models = models.filter((m) => byModel.has(modelKey(b.id, m)));
      if (filter === "missing") models = models.filter((m) => !byModel.has(modelKey(b.id, m)));
      if (!models.length) return;

      const spotted = b.models.filter((m) => byModel.has(modelKey(b.id, m))).length;
      const det = document.createElement("details");
      det.className = "brand-card";
      if (q || filter === "spotted") det.open = true;
      det.innerHTML = `
        <summary>
          <span class="name"></span>
          <span class="count">${spotted}/${b.models.length}</span>
          <div class="progress"><div style="width:${b.models.length ? (spotted / b.models.length) * 100 : 0}%"></div></div>
        </summary>
        <div class="model-list"></div>`;
      det.querySelector(".name").textContent = `${b.name} ${b.type === "sharing" ? "· Sharing" : ""}`;
      const ml = det.querySelector(".model-list");
      models.forEach((m) => {
        const n = byModel.get(modelKey(b.id, m)) || 0;
        const item = document.createElement("div");
        item.className = "model-item" + (n ? " spotted" : "");
        item.innerHTML = `<span></span><span class="tick">${n ? `✔ ${n}×` : "–"}</span>`;
        item.firstChild.textContent = m;
        ml.appendChild(item);
      });
      list.appendChild(det);
    });
  if (!list.children.length) list.innerHTML = `<p class="empty">Nichts gefunden.</p>`;
}
$("#cat-search").addEventListener("input", renderCatalog);
$("#cat-filter").addEventListener("change", renderCatalog);

// ---------- Statistik ----------
function renderStats() {
  const { byModel, byBrand } = spotCounts();
  const cat = getCatalog();
  const totalModels = cat.reduce((n, b) => n + b.models.length, 0);
  const sharing = state.spots.filter((s) => s.type === "sharing").length;
  const withAi = state.spots.filter((s) => s.ai);
  const aiRight = withAi.filter((s) => !s.corrected).length;

  const tiles = [
    [state.spots.length, "Spots insgesamt"],
    [byModel.size, `verschiedene Modelle (von ${totalModels})`],
    [byBrand.size, `Marken (von ${cat.length})`],
    [`${state.spots.length - sharing} / ${sharing}`, "Privat / Sharing"],
    [withAi.length ? `${Math.round((aiRight / withAi.length) * 100)}%` : "–", "KI lag richtig"],
  ];
  $("#stat-tiles").innerHTML = "";
  tiles.forEach(([v, l]) => {
    const t = document.createElement("div");
    t.className = "tile";
    t.innerHTML = `<div class="value"></div><div class="label"></div>`;
    t.querySelector(".value").textContent = v;
    t.querySelector(".label").textContent = l;
    $("#stat-tiles").appendChild(t);
  });

  const bars = $("#brand-bars");
  bars.innerHTML = "";
  const rows = [...byBrand.entries()].sort((a, b) => b[1] - a[1]);
  if (!rows.length) {
    bars.innerHTML = `<p class="muted">Noch keine Spots.</p>`;
  } else {
    bars.innerHTML = `<div class="legend"><span><i style="background:var(--accent)"></i>Privat</span><span><i style="background:var(--accent2)"></i>Sharing</span></div>`;
    const max = rows[0][1];
    rows.forEach(([brandId, n]) => {
      const b = brandOf(brandId) || { name: state.spots.find((s) => s.brandId === brandId)?.brandName || "?", type: "privat", models: [] };
      const distinct = [...byModel.keys()].filter((k) => k.startsWith(brandId + "::")).length;
      const row = document.createElement("div");
      row.className = "bar-row";
      row.title = `${b.name}: ${n} Spots, ${distinct} von ${b.models.length} Modellen`;
      row.innerHTML = `<span class="label"></span><div class="track"><div class="fill ${b.type}" style="width:${(n / max) * 100}%"></div></div><span class="num">${n}</span>`;
      row.querySelector(".label").textContent = b.name;
      bars.appendChild(row);
    });
  }

  const top = $("#top-models");
  top.innerHTML = "";
  const modelRows = [...byModel.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!modelRows.length) top.innerHTML = `<p class="muted">Noch keine Spots.</p>`;
  modelRows.forEach(([k, n]) => {
    const s = state.spots.find((x) => modelKey(x.brandId, x.model) === k);
    const li = document.createElement("li");
    li.textContent = `${s.brandName} ${s.model} – ${n}×`;
    top.appendChild(li);
  });
}

// ---------- Einstellungen ----------
function loadSettingsForm() {
  const s = settings.get();
  $("#api-key").value = s.apiKey;
  $("#ai-model").value = s.model;
}
$("#btn-save-settings").addEventListener("click", () => {
  settings.set({ apiKey: $("#api-key").value.trim(), model: $("#ai-model").value });
  $("#settings-saved").classList.remove("hidden");
  setTimeout(() => $("#settings-saved").classList.add("hidden"), 2000);
  updateKeyHint();
});

$("#btn-export").addEventListener("click", () => {
  const data = { version: 1, exportedAt: new Date().toISOString(), spots: state.spots, custom: customCatalog.get() };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `scooter-spots-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$("#import-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.spots)) throw new Error();
    for (const s of data.spots) await db.put(s);
    if (data.custom) {
      const c = customCatalog.get();
      const brands = [...c.brands, ...(data.custom.brands || []).filter((b) => !c.brands.some((x) => x.id === b.id))];
      const models = { ...c.models };
      Object.entries(data.custom.models || {}).forEach(([k, v]) => { models[k] = [...new Set([...(models[k] || []), ...v])]; });
      customCatalog.replace({ brands, models });
    }
    await refreshSpots();
    toast(`✔ ${data.spots.length} Spots importiert`);
  } catch {
    toast("⚠️ Ungültige Backup-Datei");
  }
  e.target.value = "";
});

$("#btn-clear").addEventListener("click", async () => {
  if (!confirm("Wirklich ALLE Spots löschen? Das kann nicht rückgängig gemacht werden.")) return;
  await db.clear();
  await refreshSpots();
  toast("Alle Spots gelöscht");
});

// ---------- Start ----------
await refreshSpots();
updateKeyHint();
