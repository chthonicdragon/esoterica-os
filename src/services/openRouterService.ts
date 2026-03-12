// ── Public types ──────────────────────────────────────────────────────────────

export interface Node {
  id: string;
  name: string;
  type: "deity" | "spirit" | "ritual" | "symbol" | "concept" | "place" | "creature" | "artifact" | "spell" | "sigil";
  description?: string;
  aliases?: string[];
  tags?: string[];
  sigil_id?: string;
  image_url?: string;
  linked_entity_id?: string;
  pantheon?: string;
  planet?: string;
  element?: string;
  offerings?: string[];
}

export interface Link {
  source: string;
  target: string;
  relation: "associated_with" | "controls" | "appears_in" | "teaches" | "symbol_of";
  strength?: "weak" | "medium" | "strong" | "personal";
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

// ── Config ────────────────────────────────────────────────────────────────────

type Provider = "groq" | "openrouter" | "deepseek";

const DEV = import.meta.env.DEV;
const AI_GATEWAY_MODE = (import.meta.env.VITE_AI_GATEWAY_MODE as string | undefined)?.trim()?.toLowerCase() || 'direct';
const USE_GATEWAY = AI_GATEWAY_MODE === 'gateway';
const GROQ_API_URL = USE_GATEWAY ? "/api/groq" : "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_API_URL = USE_GATEWAY ? "/api/openrouter" : "https://openrouter.ai/api/v1/chat/completions";
const DEEPSEEK_API_URL = USE_GATEWAY ? "/api/deepseek" : "https://api.deepseek.com/chat/completions";

const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim();
const OPENROUTER_API_KEY = (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined)?.trim();
const DEEPSEEK_API_KEY = (import.meta.env.VITE_DEEPSEEK_API_KEY as string | undefined)?.trim();

const PROVIDERS: Provider[] = []
if (GROQ_API_KEY) PROVIDERS.push("groq")
if (OPENROUTER_API_KEY) PROVIDERS.push("openrouter")
if (DEEPSEEK_API_KEY) PROVIDERS.push("deepseek")

// Fallback chain по скорости: быстрая → большая → запасная.
const GROQ_MODELS = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "gemma2-9b-it",
  "mixtral-8x7b-32768",
];

const OPENROUTER_MODELS = [
  "openrouter/free",
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-pro-exp-02-05:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "openai/gpt-4o-mini",
];

const DEEPSEEK_MODELS = [
  "deepseek-chat",
]

function getModels(provider: Provider): string[] {
  if (provider === "openrouter") return OPENROUTER_MODELS
  if (provider === "groq") return GROQ_MODELS
  return DEEPSEEK_MODELS
}

const REQUEST_TIMEOUT_MS = 22000;
const MENTOR_RETRY_COUNT = 2;
const MENTOR_BACKOFF_MS = 1200;
const MENTOR_CIRCUIT_THRESHOLD = 3;
const MENTOR_CIRCUIT_COOLDOWN_MS = 45000;

let mentorFailureCount = 0;
let mentorCircuitOpenUntil = 0;

function buildHeaders(provider: Provider, usingServerless: boolean): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (!usingServerless) {
    if (provider === "groq" && GROQ_API_KEY) headers.Authorization = `Bearer ${GROQ_API_KEY}`
    if (provider === "deepseek" && DEEPSEEK_API_KEY) headers.Authorization = `Bearer ${DEEPSEEK_API_KEY}`
    if (provider === "openrouter" && OPENROUTER_API_KEY) {
      headers.Authorization = `Bearer ${OPENROUTER_API_KEY}`
      const ENV_SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
      const ENV_SITE_TITLE = (import.meta.env.VITE_SITE_TITLE as string | undefined)?.trim();
      const FALLBACK_SITE_URL = "https://esoterica-os.vercel.app";
      let siteUrl = FALLBACK_SITE_URL;
      try {
        if (typeof window !== "undefined") {
          const origin = window.location.origin;
          if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.)/i.test(origin)) {
            siteUrl = ENV_SITE_URL || FALLBACK_SITE_URL;
          } else {
            siteUrl = origin;
          }
        } else {
          siteUrl = ENV_SITE_URL || FALLBACK_SITE_URL;
        }
      } catch {
        siteUrl = ENV_SITE_URL || FALLBACK_SITE_URL;
      }
      headers["HTTP-Referer"] = siteUrl;
      headers["X-Title"] = ENV_SITE_TITLE || "Esoterica OS";
    }
  }
  return headers
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`[AI] Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isRetryableMentorError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("429") ||
    m.includes("all models unavailable") ||
    m.includes("http 500") ||
    m.includes("http 502") ||
    m.includes("http 503") ||
    m.includes("http 504") ||
    m.includes("failed to fetch") ||
    m.includes("network")
  );
}

function getRateLimitSnapshot(res: Response) {
  return {
    retryAfter: res.headers.get("retry-after") || "-",
    limitRequests: res.headers.get("x-ratelimit-limit-requests") || "-",
    limitTokens: res.headers.get("x-ratelimit-limit-tokens") || "-",
    remainingRequests: res.headers.get("x-ratelimit-remaining-requests") || "-",
    remainingTokens: res.headers.get("x-ratelimit-remaining-tokens") || "-",
    resetRequests: res.headers.get("x-ratelimit-reset-requests") || "-",
    resetTokens: res.headers.get("x-ratelimit-reset-tokens") || "-",
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const firstObj = raw.indexOf("{");
  const lastObj = raw.lastIndexOf("}");
  const firstArr = raw.indexOf("[");
  const lastArr = raw.lastIndexOf("]");

  if (firstArr !== -1 && lastArr > firstArr && (firstObj === -1 || firstArr < firstObj)) {
    return raw.slice(firstArr, lastArr + 1);
  }
  if (firstObj !== -1 && lastObj > firstObj) return raw.slice(firstObj, lastObj + 1);
  if (firstArr !== -1 && lastArr > firstArr) return raw.slice(firstArr, lastArr + 1);
  return raw.trim();
}

function removeTrailingCommaLikeArtifacts(input: string): string {
  return input
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/[\s,]+$/g, "")
}

function autoCloseJsonFragment(input: string): string {
  const src = input.trim()
  let out = ""
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    out += ch

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === "\\") {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === "{" || ch === "[") {
      stack.push(ch)
      continue
    }
    if (ch === "}") {
      if (stack.length && stack[stack.length - 1] === "{") stack.pop()
      continue
    }
    if (ch === "]") {
      if (stack.length && stack[stack.length - 1] === "[") stack.pop()
    }
  }

  out = removeTrailingCommaLikeArtifacts(out)
  if (inString) out += '"'

  for (let i = stack.length - 1; i >= 0; i--) {
    out += stack[i] === "{" ? "}" : "]"
  }

  return out
}

function salvageLinksArray(input: string): string | null {
  const linksMarker = '"links"'
  const markerIdx = input.indexOf(linksMarker)
  if (markerIdx === -1) return null

  const arrStart = input.indexOf("[", markerIdx)
  if (arrStart === -1) return null

  let inString = false
  let escaped = false
  let objDepth = 0
  let arrDepth = 0
  let lastCompleteObjEnd = -1

  for (let i = arrStart; i < input.length; i++) {
    const ch = input[i]

    if (escaped) {
      escaped = false
      continue
    }
    if (ch === "\\") {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (ch === "[") {
      arrDepth++
      continue
    }
    if (ch === "]") {
      arrDepth--
      if (arrDepth === 0) {
        const candidate = input.slice(0, i + 1)
        return autoCloseJsonFragment(candidate)
      }
      continue
    }
    if (ch === "{") {
      objDepth++
      continue
    }
    if (ch === "}") {
      objDepth--
      if (arrDepth >= 1 && objDepth === 0) {
        lastCompleteObjEnd = i
      }
    }
  }

  if (lastCompleteObjEnd !== -1) {
    const prefix = input.slice(0, arrStart + 1)
    const completeLinks = input.slice(arrStart + 1, lastCompleteObjEnd + 1)
    return autoCloseJsonFragment(`${prefix}${completeLinks}]}`)
  }

  return null
}

function parseGraphJsonWithRecovery(rawCandidate: string): GraphData {
  const candidate = rawCandidate.replace(/^\uFEFF/, "").trim()
  const attempts: string[] = []

  attempts.push(candidate)
  attempts.push(removeTrailingCommaLikeArtifacts(candidate))
  attempts.push(autoCloseJsonFragment(candidate))

  const linksSalvaged = salvageLinksArray(candidate)
  if (linksSalvaged) attempts.push(linksSalvaged)

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as GraphData
      if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) continue
      return parsed
    } catch {
      // try next strategy
    }
  }

  throw new Error("Unable to recover valid graph JSON")
}

function parseLinksJsonWithRecovery(rawCandidate: string): Link[] {
  const candidate = rawCandidate.replace(/^\uFEFF/, "").trim();
  const attempts: string[] = [];

  attempts.push(candidate);
  attempts.push(removeTrailingCommaLikeArtifacts(candidate));
  attempts.push(autoCloseJsonFragment(candidate));

  const linksSalvaged = salvageLinksArray(candidate);
  if (linksSalvaged) attempts.push(linksSalvaged);

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as { links?: Link[] };
      if (Array.isArray(parsed?.links)) return parsed.links;
    } catch {
      // try next strategy
    }
  }

  throw new Error("Unable to recover valid links JSON");
}

function parseJsonArrayWithRecovery(rawCandidate: string): unknown[] {
  const candidate = rawCandidate.replace(/^\uFEFF/, "").trim()
  const attempts: string[] = []

  attempts.push(candidate)
  attempts.push(removeTrailingCommaLikeArtifacts(candidate))
  attempts.push(autoCloseJsonFragment(candidate))

  const firstArr = candidate.indexOf("[")
  const lastArr = candidate.lastIndexOf("]")
  if (firstArr !== -1 && lastArr > firstArr) {
    const sliced = candidate.slice(firstArr, lastArr + 1)
    attempts.push(sliced)
    attempts.push(removeTrailingCommaLikeArtifacts(sliced))
    attempts.push(autoCloseJsonFragment(sliced))
  }

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // try next strategy
    }
  }

  throw new Error("Unable to recover valid JSON array")
}

async function extractMissingLinksFallback(
  text: string,
  nodes: Node[],
  language: "en" | "ru",
  isRitual: boolean,
  ritualName?: string
): Promise<Link[]> {
  if (!nodes.length) return [];

  const langInstruction = language === "ru"
    ? "Use Russian entity context and names but keep IDs exactly as provided."
    : "Use English entity context and names but keep IDs exactly as provided.";

  const ritualInstruction = isRitual
    ? `Context includes ritual mode (${ritualName || "Unknown Ritual"}). Prefer appears_in and associated_with.`
    : "General context mode. Use semantically grounded links.";

  const nodeList = JSON.stringify(nodes.map((n) => ({ id: n.id, name: n.name, type: n.type })), null, 2);

  const systemPrompt = [
    "You are repairing a partially truncated knowledge graph extraction.",
    "Given a source text and a fixed node list, return ONLY valid JSON with links.",
    "JSON schema: { \"links\": [{ \"source\": string, \"target\": string, \"relation\": \"associated_with\"|\"controls\"|\"appears_in\"|\"teaches\"|\"symbol_of\" }] }",
    "Rules:",
    "1) Use ONLY node IDs from the provided list.",
    "2) No duplicate links.",
    "3) No self-links (source !== target).",
    langInstruction,
    ritualInstruction,
    `NODE LIST:\n${nodeList}`,
  ].join("\n\n");

  const rawText = await fetchWithFallback({
    temperature: 0,
    max_tokens: 1800,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  });

  const jsonStr = extractJSON(rawText);
  return parseLinksJsonWithRecovery(jsonStr);
}

export async function analyzeChakras(text: string, lang: 'en' | 'ru' = 'en'): Promise<{ emotions: string[], chakraImpact: Record<string, number>, analysis: string }> {
  const systemPrompt = `You are an expert in Eastern philosophy and energy work. Analyze the user's journal entry for emotional content and map it to the 7 chakras.
Return a VALID JSON object (no markdown, no extra text) with the following structure:
{
  "emotions": ["emotion1", "emotion2"],
  "chakraImpact": {
    "root": -5,
    "sacral": 10,
    "solar_plexus": 0,
    "heart": 5,
    "throat": -2,
    "third_eye": 0,
    "crown": 0
  },
  "analysis": "Brief explanation of the energy shift."
}
Impact values should be between -20 and +20. Use negative values for fear, guilt, shame, grief, lies, illusion, attachment. Use positive for safety, pleasure, willpower, love, truth, insight, connection.

IMPORTANT: The user's language is "${lang}".
If lang is "ru", the "analysis" and "emotions" fields MUST be in Russian.
If lang is "en", keep them in English.
`;

  try {
    const rawText = await fetchWithFallback({
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    });

    const jsonStr = extractJSON(rawText);
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (error) {
    console.error("[ChakraAI] Analysis failed:", error);
    // Return neutral fallback
    return {
      emotions: ["neutral"],
      chakraImpact: {},
      analysis: "Energy analysis unavailable.",
    };
  }
}

// ── HTTP с fallback по моделям (при 429 или 404 — следующая модель) ─────────

async function fetchWithFallback(body: object, providerIndex = 0, modelIndex = 0): Promise<string> {
  if (!PROVIDERS.length) {
    throw new Error("[AI] Missing API key. Set VITE_GROQ_API_KEY or VITE_OPENROUTER_API_KEY or VITE_DEEPSEEK_API_KEY.");
  }
  if (providerIndex >= PROVIDERS.length) {
    throw new Error(`[AI] All providers unavailable`);
  }
  const provider = PROVIDERS[providerIndex]
  const apiUrl = provider === "groq" ? GROQ_API_URL : provider === "openrouter" ? OPENROUTER_API_URL : DEEPSEEK_API_URL
  const models = getModels(provider)
  if (modelIndex >= models.length) {
    return fetchWithFallback(body, providerIndex + 1, 0)
  }
  const model = models[modelIndex]
  const usingServerless = apiUrl.startsWith('/api/')
  const headers = buildHeaders(provider, usingServerless)
  const res = await fetchWithTimeout(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, model }),
  }, REQUEST_TIMEOUT_MS);
  const rate = getRateLimitSnapshot(res);
  if (res.status === 429 || res.status === 404 || res.status === 400) {
    return fetchWithFallback(body, providerIndex, modelIndex + 1)
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`[AI:${provider}] HTTP ${res.status}: ${errText} | rate=${JSON.stringify(rate)}`)
  }
  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error(`[AI:${provider}] Empty response from model`);
  return text;
}

// ── AI Mentor ─────────────────────────────────────────────────────────────────

export async function askOpenRouter(prompt: string): Promise<string> {
  const now = Date.now();
  if (mentorCircuitOpenUntil > now) {
    const waitSec = Math.max(1, Math.ceil((mentorCircuitOpenUntil - now) / 1000));
    throw new Error(`[AI] Circuit breaker open. Retry after ${waitSec}s`);
  }

  let lastError = "Unknown AI error";

  try {
    for (let attempt = 0; attempt <= MENTOR_RETRY_COUNT; attempt++) {
      try {
        const text = await fetchWithFallback({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 800,
        });

        mentorFailureCount = 0;
        mentorCircuitOpenUntil = 0;
        return text;
      } catch (error: any) {
        lastError = error?.message ?? "Unknown AI error";
        const canRetry = attempt < MENTOR_RETRY_COUNT && isRetryableMentorError(lastError);
        if (!canRetry) break;

        const backoff = MENTOR_BACKOFF_MS * (attempt + 1);
        console.warn(`[AI] Mentor retry ${attempt + 1}/${MENTOR_RETRY_COUNT} in ${backoff}ms: ${lastError}`);
        await wait(backoff);
      }
    }

    mentorFailureCount += 1;
    if (mentorFailureCount >= MENTOR_CIRCUIT_THRESHOLD) {
      mentorCircuitOpenUntil = Date.now() + MENTOR_CIRCUIT_COOLDOWN_MS;
      mentorFailureCount = 0;
      throw new Error(`[AI] Circuit breaker open. Retry after ${Math.ceil(MENTOR_CIRCUIT_COOLDOWN_MS / 1000)}s`);
    }

    throw new Error(lastError);
  } catch (error: any) {
    const message = error?.message ?? "Unknown AI error";
    console.error("[AI] askOpenRouter failed:", message);
    throw new Error(message);
  }
}

// ── Knowledge Graph Extraction ────────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are an expert in esoteric knowledge and graph database structures.
Your task is to extract entities and relationships from the provided text.

Entity Types: deity, spirit, ritual, symbol, concept, place, creature, artifact, spell, sigil
Relation Types: associated_with, controls, appears_in, teaches, symbol_of

INTELLIGENT MERGING RULES:
1. Normalize names to canonical form (e.g. "Hecate's" → "Hecate").
2. Merge semantic synonyms: "wealth", "money magic", "prosperity" → id: "money_magic".
3. Reuse existing node IDs if the entity matches.
4. id = short lowercase slug, no spaces (e.g. "hecate", "money_magic").
5. relation must be one of the specified types.

EXTENDED ATTRIBUTES:
- pantheon: Greek, Goetia, Egyptian, Norse, Chaos, Folk, etc.
- planet: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.
- element: Fire, Water, Air, Earth, Spirit.
- offerings: list of items (incense, wine, blood, etc.).
- link strength: weak, medium, strong.

CRITICAL: Return ONLY a valid JSON object — no markdown, no code fences, no extra text.
Schema: {
  "nodes": [{
    "id": string,
    "name": string,
    "type": string,
    "description"?: string,
    "pantheon"?: string,
    "planet"?: string,
    "element"?: string,
    "offerings"?: string[],
    "image_url"?: string
  }],
  "links": [{
    "source": string,
    "target": string,
    "relation": string,
    "strength"?: "weak" | "medium" | "strong"
  }]
}
`;

function detectQueryLanguage(text: string, fallback: "en" | "ru" = "en"): "en" | "ru" {
  if (/[а-яА-ЯёЁ]/.test(text)) return "ru"
  if (/[a-zA-Z]/.test(text)) return "en"
  return fallback
}

function slugifyId(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s_-]/gi, "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 48) || `ritual_${Date.now().toString(36)}`;
}

function ensureRitualNode(graph: GraphData, fullText: string, ritualName?: string): GraphData {
  const cloned: GraphData = {
    nodes: [...graph.nodes],
    links: [...graph.links],
  };

  const requestedName = ritualName?.trim() || "Ritual";
  let ritualNode = cloned.nodes.find((n) => n.type === "ritual");

  if (!ritualNode) {
    ritualNode = {
      id: slugifyId(`ritual_${requestedName}_${Date.now().toString(36)}`),
      name: requestedName,
      type: "ritual",
      description: fullText.trim(),
    };
    cloned.nodes.push(ritualNode);
  } else {
    if (ritualName?.trim()) ritualNode.name = ritualName.trim();
    ritualNode.description = fullText.trim();
  }

  const existing = new Set(cloned.links.map((l) => `${l.source}|${l.target}|${l.relation}`));
  cloned.nodes.forEach((node) => {
    if (node.id === ritualNode!.id) return;
    const key = `${node.id}|${ritualNode!.id}|appears_in`;
    if (!existing.has(key)) {
      cloned.links.push({
        source: node.id,
        target: ritualNode!.id,
        relation: "appears_in",
      });
      existing.add(key);
    }
  });

  return cloned;
}

export async function suggestConnections(
  node: Node,
  allNodes: Node[],
  language: "en" | "ru" = "en"
): Promise<{ targetId: string; relation: string; reason: string; strength: string }[]> {
  const resolvedLanguage = detectQueryLanguage(node.name + " " + (node.description || ""), language)
  const contextNodes = allNodes
    .filter(n => n.id !== node.id)
    .map(n => `${n.name} (${n.type}) [id:${n.id}]`)
    .slice(0, 50)
    .join(", ");

  const prompt = resolvedLanguage === "ru"
    ? `Ты — ассистент по эзотерической базе знаний и графам связей.
Проанализируй сущность "${node.name}" (${node.type}, ${node.description || ""}) и список существующих узлов:
${contextNodes}

Предложи 1–3 новых осмысленных связи между "${node.name}" и существующими узлами. Связи должны быть уместны в оккультной/алхимической практике (соответствия, символика, мифологические и ритуальные связи) и НЕ быть совсем очевидными повторениями.

Верни ТОЛЬКО JSON-массив:
[{ "targetId": "id_from_list", "relation": "associated_with", "reason": "краткое объяснение на русском", "strength": "medium" }]

relation: associated_with|controls|appears_in|teaches|symbol_of
strength: weak|medium|strong|personal`
    : `You are an esoteric knowledge graph assistant.
Analyze the entity "${node.name}" (${node.type}, ${node.description || ""}) and the following existing nodes:
${contextNodes}

Suggest 1–3 new meaningful connections between "${node.name}" and existing nodes. The suggestions must be relevant in occult/alchemical practice (correspondences, symbolism, mythic/ritual links) and not trivial duplicates.

Return ONLY a JSON array:
[{ "targetId": "id_from_list", "relation": "associated_with", "reason": "short explanation in English", "strength": "medium" }]

relation: associated_with|controls|appears_in|teaches|symbol_of
strength: weak|medium|strong|personal`

  try {
    const raw = await fetchWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });
    const jsonStr = extractJSON(raw);
    return parseJsonArrayWithRecovery(jsonStr) as any;
  } catch (e) {
    console.error("Failed to suggest connections", e);
    return [];
  }
}

export function suggestConnectionsLocal(
  node: Node,
  allNodes: Node[],
  existingLinks: Link[] = [],
  language: "en" | "ru" = "en"
): { targetId: string; relation: string; reason: string; strength: string }[] {
  const connected = new Set<string>()
  existingLinks.forEach(l => {
    const s = String(l.source)
    const t = String(l.target)
    if (s === node.id) connected.add(t)
    if (t === node.id) connected.add(s)
  })

  const nodeTags = new Set((node.tags || []).map(t => String(t).toLowerCase()))
  const nodeOfferings = new Set((((node as any).offerings || []) as any[]).map((o: any) => String(o).toLowerCase()))
  const nodeDesc = String(node.description || "").toLowerCase()

  const scored = allNodes
    .filter(n => n.id !== node.id)
    .filter(n => !connected.has(n.id))
    .map(n => {
      let score = 0
      const reasons: string[] = []

      if (node.pantheon && (n as any).pantheon && String(node.pantheon) === String((n as any).pantheon)) {
        score += 4
        reasons.push(language === "ru" ? `общий пантеон: ${node.pantheon}` : `same pantheon: ${node.pantheon}`)
      }
      if ((node as any).planet && (n as any).planet && String((node as any).planet) === String((n as any).planet)) {
        score += 3
        reasons.push(language === "ru" ? `общая планета: ${(node as any).planet}` : `same planet: ${(node as any).planet}`)
      }
      if ((node as any).element && (n as any).element && String((node as any).element) === String((n as any).element)) {
        score += 3
        reasons.push(language === "ru" ? `общая стихия: ${(node as any).element}` : `same element: ${(node as any).element}`)
      }

      const candOfferings = new Set((((n as any).offerings || []) as any[]).map((o: any) => String(o).toLowerCase()))
      let offeringHits = 0
      nodeOfferings.forEach(o => { if (candOfferings.has(o)) offeringHits++ })
      if (offeringHits > 0) {
        score += Math.min(4, offeringHits * 2)
        reasons.push(language === "ru" ? `общие подношения: ${offeringHits}` : `shared offerings: ${offeringHits}`)
      }

      const candTags = new Set((((n as any).tags || []) as any[]).map((t: any) => String(t).toLowerCase()))
      let tagHits = 0
      nodeTags.forEach(t => { if (candTags.has(t)) tagHits++ })
      if (tagHits > 0) {
        score += Math.min(3, tagHits)
        reasons.push(language === "ru" ? `общие теги: ${tagHits}` : `shared tags: ${tagHits}`)
      }

      const nameLower = String(n.name || "").toLowerCase()
      if (nameLower && nodeDesc.includes(nameLower)) {
        score += 1
        reasons.push(language === "ru" ? "упоминается в описании" : "mentioned in description")
      }

      if (n.type === "ritual" || node.type === "ritual") score += 1

      return { id: n.id, score, reasons }
    })
    .filter(x => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  return scored.map(s => {
    const strength = s.score >= 7 ? "strong" : s.score >= 4 ? "medium" : "weak"
    const reason = s.reasons.slice(0, 3).join("; ")
    return { targetId: s.id, relation: "associated_with", reason, strength }
  })
}

export async function extractGraph(
  text: string,
  language: "en" | "ru" = "en",
  isRitual: boolean = false,
  ritualName?: string,
  existingNodes: Node[] = []
): Promise<GraphData> {
  const resolvedLanguage = detectQueryLanguage(text, language)
  const langInstruction =
    resolvedLanguage === "ru"
      ? "Extract entity names in Russian. Use nominative case (именительный падеж)."
      : "Extract entity names in English.";

  const existingNodesContext =
    existingNodes.length > 0
      ? `EXISTING NODES — reuse these IDs if they match: ${existingNodes.map((n) => `${n.name} (id: ${n.id})`).join(", ")}`
      : "";

  const ritualInstruction = isRitual
    ? `The text describes a ritual named "${ritualName || "Unknown Ritual"}". Extract only primary ritual tags (deities, spirits, symbols, places, artifacts, concepts, spells, creatures, sigils) and one central "ritual" node. Keep extraction concise and high-signal. Link discovered entities to the ritual node using "appears_in" or "associated_with". Store the FULL original ritual text in the ritual node's "description".`
    : "Extract general entities and relations. If the text refers to a sigil explicitly, use type \"sigil\" and include image or name references in description.";

  const systemPrompt = [SYSTEM_INSTRUCTION, langInstruction, ritualInstruction, existingNodesContext]
    .filter(Boolean)
    .join("\n\n");

  const rawText = await fetchWithFallback({
    temperature: 0,
    max_tokens: 3500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  });

  const jsonStr = extractJSON(rawText);
  try {
    const parsed = parseGraphJsonWithRecovery(jsonStr);

    // If output was likely truncated (few links vs many nodes), request a links-only repair pass.
    const expectedMinLinks = Math.max(3, Math.floor(parsed.nodes.length * 0.2));
    if (parsed.nodes.length >= 8 && parsed.links.length < expectedMinLinks) {
      try {
        const repairedLinks = await extractMissingLinksFallback(text, parsed.nodes, resolvedLanguage, isRitual, ritualName);
        const existing = new Set(parsed.links.map((l) => `${l.source}|${l.target}|${l.relation}`));
        repairedLinks.forEach((l) => {
          const key = `${l.source}|${l.target}|${l.relation}`;
          if (!existing.has(key) && l.source !== l.target) {
            parsed.links.push(l);
            existing.add(key);
          }
        });
      } catch (repairErr) {
        console.warn("[Groq] Links repair pass failed:", repairErr);
      }
    }

    return isRitual ? ensureRitualNode(parsed, text, ritualName) : parsed;
  } catch (err) {
    console.error("[Groq] Failed to parse JSON:", jsonStr);
    throw new Error(`[Groq] Invalid JSON: ${err}`);
  }
}
