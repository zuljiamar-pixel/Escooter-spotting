// Katalog aller bekannten E-Scooter (Marken + Modelle).
// type: "privat" = Kauf-Scooter, "sharing" = Leih-/Sharing-Anbieter.
// Fehlende Modelle können in der App über "Korrigieren → Anderes Modell" ergänzt werden.

export const BRANDS = [
  { id: "xiaomi", name: "Xiaomi", country: "CN", type: "privat", models: [
    "Mi Electric Scooter M365", "Mi Electric Scooter M365 Pro", "Mi Electric Scooter 1S",
    "Mi Electric Scooter Pro 2", "Mi Electric Scooter Essential", "Mi Electric Scooter 3",
    "Electric Scooter 3 Lite", "Electric Scooter 4", "Electric Scooter 4 Lite", "Electric Scooter 4 Lite (2nd Gen)",
    "Electric Scooter 4 Go", "Electric Scooter 4 Pro", "Electric Scooter 4 Pro (2nd Gen)",
    "Electric Scooter 4 Ultra", "Electric Scooter 5", "Electric Scooter 5 Pro", "Electric Scooter 5 Max",
  ]},
  { id: "segway", name: "Segway-Ninebot", country: "CN", type: "privat", models: [
    "ES1", "ES2", "ES4", "Max G30", "Max G30D", "Max G30LP", "Max G30 II", "Max G30D II", "Max G2", "Max G65",
    "F20", "F25", "F30", "F40", "F2", "F2 Plus", "F2 Pro", "F65",
    "E22", "E25", "E45", "E2", "E2 Plus", "E2 Pro",
    "D18", "D28", "D38", "P65", "P100", "GT1", "GT2", "GT3", "ZT3 Pro", "ST2", "Air T15",
  ]},
  { id: "apollo", name: "Apollo", country: "CA", type: "privat", models: [
    "Air", "Air Pro", "City", "City Pro", "Explore", "Ghost", "Phantom", "Phantom 2.0", "Go", "Pro",
  ]},
  { id: "kaabo", name: "Kaabo", country: "CN", type: "privat", models: [
    "Mantis 8", "Mantis 10", "Mantis King GT", "Wolf Warrior 11", "Wolf Warrior X", "Wolf King GT",
    "Skywalker 8", "Skywalker 10",
  ]},
  { id: "dualtron", name: "Dualtron (Minimotors)", country: "KR", type: "privat", models: [
    "Mini", "Popular", "Compact", "Eagle", "Eagle Pro", "Spider", "Raptor 2", "Victor", "Victor Luxury",
    "Thunder", "Thunder 2", "Thunder 3", "Storm", "Storm Limited", "Ultra 2", "X", "X Limited", "Achilleus",
  ]},
  { id: "speedway", name: "Speedway (Minimotors)", country: "KR", type: "privat", models: [
    "Speedway 4", "Speedway 5", "Speedway Leger", "Speedway Leger Pro",
  ]},
  { id: "inokim", name: "Inokim", country: "IL", type: "privat", models: [
    "Light 2", "Light 2 Super", "Quick 3", "Quick 4", "OX", "OXO",
  ]},
  { id: "niu", name: "NIU", country: "CN", type: "privat", models: [
    "KQi1", "KQi2", "KQi3 Sport", "KQi3 Pro", "KQi3 Max", "KQi Air", "KQi 100P", "KQi 300X",
  ]},
  { id: "soflow", name: "SoFlow", country: "CH", type: "privat", models: [
    "SO1", "SO2", "SO3", "SO4", "SO4 Pro", "SO6",
  ]},
  { id: "trittbrett", name: "Trittbrett", country: "DE", type: "privat", models: [
    "Paul", "Emil", "Kalle", "Bruno", "Fritz",
  ]},
  { id: "egret", name: "Egret", country: "DE", type: "privat", models: [
    "One", "Eight V3", "Ten V4", "Pro", "X", "GT",
  ]},
  { id: "iohawk", name: "IO Hawk", country: "DE", type: "privat", models: [
    "Legend", "Sparrow", "Exit Cross", "Infinity",
  ]},
  { id: "eflux", name: "E-Flux", country: "DE", type: "privat", models: [
    "Lite Six", "Vision Pro", "Freeride X2",
  ]},
  { id: "micro", name: "Micro", country: "CH", type: "privat", models: [
    "Explorer II", "Merlin", "Condor", "Falcon X",
  ]},
  { id: "etwow", name: "E-Twow", country: "FR", type: "privat", models: [
    "Booster GT", "Booster V", "S2 Booster",
  ]},
  { id: "pure", name: "Pure Electric", country: "GB", type: "privat", models: [
    "Air", "Air Pro", "Air Go", "Advance", "Advance+", "Advance Flex",
  ]},
  { id: "ducati", name: "Ducati", country: "IT", type: "privat", models: [
    "Pro-I", "Pro-II", "Pro-III",
  ]},
  { id: "navee", name: "Navee", country: "CN", type: "privat", models: [
    "N40", "N65", "S65", "V50", "GT3 Pro",
  ]},
  { id: "vsett", name: "VSETT", country: "CN", type: "privat", models: [
    "8", "8+", "9", "9+", "10+", "11+",
  ]},
  { id: "zero", name: "Zero", country: "CN", type: "privat", models: [
    "8", "9", "10", "10X", "11X",
  ]},
  { id: "nami", name: "Nami", country: "KR", type: "privat", models: [
    "Burn-E 2", "Burn-E 2 Max", "Klima",
  ]},
  { id: "teverun", name: "Teverun", country: "CN", type: "privat", models: [
    "Fighter Mini", "Fighter Mini Pro", "Fighter 11", "Fighter Supreme", "Blade Mini",
  ]},
  { id: "hiboy", name: "Hiboy", country: "US", type: "privat", models: [
    "S2", "S2 Lite", "S2 Pro", "S2 Max", "Titan",
  ]},
  { id: "gotrax", name: "Gotrax", country: "US", type: "privat", models: [
    "GXL V2", "XR Elite", "G4", "G Max Ultra",
  ]},
  { id: "unagi", name: "Unagi", country: "US", type: "privat", models: [
    "Model One E250", "Model One E500", "Model One Voyager",
  ]},
  { id: "okai", name: "Okai", country: "CN", type: "privat", models: [
    "ES10", "ES20", "Neon", "Neon Pro",
  ]},
  { id: "birdprivat", name: "Bird (Kauf)", country: "US", type: "privat", models: [
    "Bird One", "Bird Air", "Bird Flex",
  ]},

  // ---- Sharing-Anbieter ----
  { id: "lime", name: "Lime", country: "US", type: "sharing", models: [
    "Lime-S Gen 2", "Lime Gen 3", "Lime Gen 4",
  ]},
  { id: "tier", name: "TIER", country: "DE", type: "sharing", models: [
    "TIER ES200 (Okai)", "TIER Ninebot Max", "TIER 4", "TIER 5",
  ]},
  { id: "dott", name: "Dott", country: "NL", type: "sharing", models: [
    "Dott (Ninebot Max)", "Dott 2nd Gen", "Dott 3rd Gen",
  ]},
  { id: "voi", name: "Voi", country: "SE", type: "sharing", models: [
    "Voiager 1", "Voiager 2", "Voiager 3", "Voiager 4", "Voi V5", "Voi V6",
  ]},
  { id: "bolt", name: "Bolt", country: "EE", type: "sharing", models: [
    "Bolt Scooter Gen 3", "Bolt Scooter Gen 4", "Bolt Scooter Gen 5",
  ]},
  { id: "bird", name: "Bird (Sharing)", country: "US", type: "sharing", models: [
    "Bird Zero", "Bird One", "Bird Two", "Bird Three",
  ]},
  { id: "spin", name: "Spin", country: "US", type: "sharing", models: [
    "Spin S-100", "Spin S-200",
  ]},
  { id: "hive", name: "Hive", country: "DE", type: "sharing", models: [
    "Hive (Ninebot Max)",
  ]},
  { id: "zeus", name: "Zeus", country: "DE", type: "sharing", models: [
    "Zeus Scooter",
  ]},
  { id: "hopp", name: "Hopp", country: "IS", type: "sharing", models: [
    "Hopp Scooter",
  ]},
  { id: "superpedestrian", name: "Superpedestrian (Link)", country: "US", type: "sharing", models: [
    "Link",
  ]},
  { id: "beam", name: "Beam", country: "SG", type: "sharing", models: [
    "Beam Saturn", "Beam Saturn 360",
  ]},
  { id: "neuron", name: "Neuron", country: "SG", type: "sharing", models: [
    "Neuron N3", "Neuron N4",
  ]},
];

export function brandById(id) {
  return BRANDS.find((b) => b.id === id);
}

export function findBrandByName(name) {
  if (!name) return null;
  const n = normalize(name);
  return BRANDS.find((b) => normalize(b.name) === n || b.id === n) ||
    bestFuzzy(BRANDS, (b) => normalize(b.name), n);
}

export function findModel(brand, modelName) {
  if (!brand || !modelName) return null;
  const n = normalize(modelName);
  return brand.models.find((m) => normalize(m) === n) ||
    bestFuzzy(brand.models, (m) => normalize(m), n);
}

// Längster Teil-Treffer gewinnt (z. B. "Max G30D" vor "Max G30").
function bestFuzzy(list, key, n) {
  let best = null, bestLen = 0;
  for (const item of list) {
    const k = key(item);
    if (!k) continue;
    if ((k.includes(n) || n.includes(k)) && Math.min(k.length, n.length) > bestLen) {
      best = item;
      bestLen = Math.min(k.length, n.length);
    }
  }
  return best;
}

export function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9+]/g, "");
}
