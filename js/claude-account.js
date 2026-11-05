// KI über das eigene Claude-Konto – nur verfügbar, wenn die Seite als Claude-Artifact läuft.
// Dann ist kein API-Key nötig.
import { fullPrompt } from "./prompt.js?v=7";

let samplePromise = null;

export function getAccountAI() {
  if (!samplePromise) {
    samplePromise = (async () => {
      if (!window.claude?.use) return null;
      try {
        const sample = await window.claude.use("sample");
        if (!sample) return null;
        const limits = await sample.limits().catch(() => null);
        return limits?.images ? sample : null;
      } catch {
        return null;
      }
    })();
  }
  return samplePromise;
}

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(",");
  const type = head.match(/data:(.*?);/)[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

const MESSAGES = {
  not_granted: "Du hast der Seite nicht erlaubt, Claude zu benutzen. Wähle den Scooter manuell aus.",
  sampling_disabled: "Claude ist für dein Konto hier nicht verfügbar. Wähle den Scooter manuell aus.",
  rate_limited: "Zu viele Scans hintereinander – warte kurz und versuch es nochmal.",
  usage_limit: "Dein Claude-Nutzungslimit ist erreicht. Später nochmal versuchen oder manuell auswählen.",
  images_unavailable: "Bilder können hier nicht an Claude gesendet werden. Wähle den Scooter manuell aus.",
  invalid_json: "Die KI-Antwort war unklar. Bitte nochmal versuchen.",
  refused: "Die KI hat die Analyse dieses Bildes abgelehnt. Bitte manuell auswählen.",
};

export async function identifyWithAccount(sample, { imageDataUrl, catalog }) {
  try {
    const result = await sample.json(fullPrompt(catalog), {
      images: [dataUrlToBlob(imageDataUrl)],
      modelTier: "complex",
    });
    if (!result || typeof result !== "object") throw { code: "invalid_json" };
    return {
      is_escooter: !!result.is_escooter,
      brand: String(result.brand ?? "Unbekannt"),
      model: String(result.model ?? "Unbekannt"),
      confidence: Number(result.confidence) || 0,
      features: Array.isArray(result.features) ? result.features.map(String) : [],
      alternatives: Array.isArray(result.alternatives) ? result.alternatives : [],
      notes: String(result.notes ?? ""),
    };
  } catch (e) {
    throw new Error(MESSAGES[e?.code] || "Die KI ist gerade nicht erreichbar. Bitte nochmal versuchen.");
  }
}
