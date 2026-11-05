// Prompt und Antwortformat für die KI-Erkennung (gemeinsam für API-Key und Claude-Konto).

export const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["is_escooter", "brand", "model", "confidence", "features", "alternatives", "notes"],
  properties: {
    is_escooter: { type: "boolean", description: "Ist auf dem Bild ein E-Scooter zu sehen?" },
    brand: { type: "string", description: "Marke exakt wie im Katalog, oder 'Unbekannt'" },
    model: { type: "string", description: "Modell exakt wie im Katalog, oder bester Name, oder 'Unbekannt'" },
    confidence: { type: "number", description: "Sicherheit zwischen 0 und 1" },
    features: {
      type: "array",
      description: "Erkannte Merkmale, die zur Entscheidung geführt haben (Deutsch, kurz)",
      items: { type: "string" },
    },
    alternatives: {
      type: "array",
      description: "Bis zu 3 andere mögliche Treffer",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["brand", "model", "confidence"],
        properties: {
          brand: { type: "string" },
          model: { type: "string" },
          confidence: { type: "number" },
        },
      },
    },
    notes: { type: "string", description: "Kurzer Kommentar auf Deutsch (z. B. Zustand, Farbe, Sharing-Anbieter)" },
  },
};

export function systemPrompt(catalog) {
  const list = catalog
    .map((b) => `- ${b.name} [${b.type}]: ${b.models.join(", ")}`)
    .join("\n");
  return `Du bist ein Experte für E-Scooter (Elektro-Tretroller) und hilfst beim "E-Scooter-Spotting".
Analysiere das Foto gründlich: Rahmenform, Lenker/Display, Klappmechanismus, Räder und Reifengröße,
Federung, Beleuchtung, Schutzbleche, Farbe, Logos, Schriftzüge, QR-Codes und Sharing-Branding.

Bestimme Marke und Modell. Nutze für "brand" und "model" möglichst exakt die Schreibweise aus diesem Katalog:
${list}

Wenn der Scooter sicher nicht im Katalog ist, gib den echten Marken-/Modellnamen an.
Wenn du es nicht erkennen kannst, schreibe "Unbekannt". Sei ehrlich bei der Sicherheit (confidence).
Antworte auf Deutsch.`;
}


const EXAMPLE = {
  is_escooter: true,
  brand: "Segway-Ninebot",
  model: "Max G30",
  confidence: 0.82,
  features: ["Dicker grauer Rahmen", "Akku im Trittbrett", "10-Zoll-Luftreifen"],
  alternatives: [{ brand: "Segway-Ninebot", model: "Max G30D", confidence: 0.12 }],
  notes: "Gut erhaltener Privat-Scooter in Grau.",
};

// Komplette Anweisung für einen einzelnen Aufruf ohne System-Prompt.
export function fullPrompt(catalog) {
  return `${systemPrompt(catalog)}

Welcher E-Scooter ist auf dem Bild? Scanne ihn komplett und bestimme Marke und Modell.
Antworte NUR mit einem JSON-Objekt mit genau diesen Feldern (Beispiel):
${JSON.stringify(EXAMPLE, null, 2)}
"confidence" ist eine Zahl von 0 bis 1. "alternatives" darf leer sein (höchstens 3 Einträge).
Wenn kein E-Scooter zu sehen ist: is_escooter=false und brand/model "Unbekannt".`;
}
