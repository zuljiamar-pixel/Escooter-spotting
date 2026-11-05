// KI-Erkennung mit der Claude-API (läuft direkt im Browser mit dem eigenen API-Key).
import Anthropic from "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.0.0/+esm";
import { SCHEMA, systemPrompt } from "./prompt.js";

export async function identifyScooter({ apiKey, model, imageBase64, mediaType, catalog }) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const params = {
    model,
    max_tokens: 16000,
    system: systemPrompt(catalog),
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
        { type: "text", text: "Welcher E-Scooter ist das? Scanne ihn komplett und bestimme Marke und Modell." },
      ],
    }],
  };

  let response;
  const supportsFallback = ["claude-opus-5-5", "claude-sonnet-5-5"].includes(model);
  try {
    response = supportsFallback
      ? await client.beta.messages.create({
          ...params,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        })
      : await client.messages.create(params);
  } catch (err) {
    // Falls das Fallback-Feature für den Account nicht verfügbar ist: ohne nochmal versuchen.
    if (supportsFallback && err instanceof Anthropic.BadRequestError && /fallback/i.test(err.message)) {
      response = await client.messages.create(params);
    } else {
      throw friendlyError(err);
    }
  }

  if (response.stop_reason === "refusal") {
    throw new Error("Die KI hat die Analyse dieses Bildes abgelehnt. Bitte wähle den Scooter manuell aus.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Die Antwort der KI war unvollständig. Bitte nochmal versuchen.");
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Die KI hat keine Antwort geliefert.");
  return JSON.parse(text);
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error("Der API-Key ist ungültig. Bitte in den Einstellungen prüfen.");
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error("Zu viele Anfragen – bitte kurz warten und nochmal versuchen.");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new Error("Keine Verbindung zur KI. Bist du online?");
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`KI-Fehler (${err.status ?? "?"}): ${err.message}`);
  }
  return err;
}
