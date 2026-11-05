// Einstellungen + eigene Katalog-Ergänzungen in localStorage.
const KEY = "escooter-settings";
const CUSTOM_KEY = "escooter-custom-catalog";

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Speicher nicht verfügbar */ }
}

export const settings = {
  get: () => ({ apiKey: "", model: "claude-opus-5-5", ...read(KEY, {}) }),
  set: (patch) => write(KEY, { ...settings.get(), ...patch }),
};

// { brands: [{id,name,type,country,models:[]}], models: { brandId: [modelName] } }
export const customCatalog = {
  get: () => ({ brands: [], models: {}, ...read(CUSTOM_KEY, {}) }),
  addModel(brandId, model) {
    const c = customCatalog.get();
    c.models[brandId] = [...new Set([...(c.models[brandId] || []), model])];
    write(CUSTOM_KEY, c);
  },
  addBrand(name, type) {
    const c = customCatalog.get();
    const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!c.brands.some((b) => b.id === id)) {
      c.brands.push({ id, name, type: type || "privat", country: "", models: [] });
      write(CUSTOM_KEY, c);
    }
    return id;
  },
  replace: (c) => write(CUSTOM_KEY, c),
};
