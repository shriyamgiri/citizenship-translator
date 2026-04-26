import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15 MB per file

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("\n⚠️  GEMINI_API_KEY is missing. Add it to your .env file.\n");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const EXTRACTION_PROMPT = `You are an expert translator of Nepali government documents. The attached file(s) are a Nepali Citizenship Certificate (front and/or back side). Extract the following fields and translate any Nepali (Devanagari) text into English. Return ONLY a valid JSON object with this exact shape — no markdown, no code fences, no commentary:

{
  "serial_no": "",
  "citizenship_certificate_no": "",
  "full_name": "",
  "sex": "",
  "date_of_birth_ad": { "year": "", "month": "", "day": "" },
  "birth_place": { "district": "", "sub_metropolitan": "", "ward_no": "" },
  "permanent_address": { "district": "", "sub_metropolitan": "", "ward_no": "" },
  "father_name": "",
  "father_address": "",
  "father_cc_no": "",
  "father_citizenship_type": "",
  "mother_name": "",
  "mother_address": "",
  "mother_cc_no": "",
  "mother_citizenship_type": "",
  "spouse_name": "",
  "spouse_address": "",
  "spouse_cc_no": "",
  "spouse_citizenship_type": "",
  "citizenship_type": "",
  "issuing_authority_name": "",
  "issuing_authority_designation": "",
  "issue_date_ad": "",
  "office_name": "",
  "notary_verification_date": "",
  "notary_name": "",
  "notary_certificate_number": "",
  "notary_expiry_date": ""
}

Rules:
- Translate Devanagari script to English (Roman). Use proper transliteration for names.
- If a field is not visible or unclear, set its value to "".
- For sex, use "Male" or "Female".
- For month, use 3-letter English abbreviation (JAN, FEB, etc.).
- "serial_no" is the S.N. number typically shown near the Nepal Notary Public Council stamp at top-left (often a 7-digit number like "6537145").
- father_cc_no, mother_cc_no, spouse_cc_no refer to the "ना.प्र.नं." / "C.C.No." (Citizenship Certificate Number) of that person, if listed. Leave empty if not shown.
- father_citizenship_type, mother_citizenship_type, spouse_citizenship_type refer to the citizenship type of that person (e.g. "Descent", "Birth", "Naturalized"), if listed.
- "citizenship_type" (the top-level one) is the main holder's citizenship type.
- "notary_verification_date" is the date stamp on the notary verification line (e.g. "09 FEB 2026"). Format as "DD MMM YYYY" in English.
- "notary_name" is the name of the notary public, if visible near the "Translation Copy is True and Verified" stamp.
- "notary_certificate_number" is the notary's own certificate number (e.g. "3252").
- "notary_expiry_date" is the notary certificate expiry date (e.g. "July08, 2028").
- If the address field shows "XXX" or is blank, return "XXX".
- Return ONLY the JSON object. No other text.`;

// Flash-Lite first: 1000 req/day free tier vs Flash's 20 req/day
const MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
const MAX_RETRIES_PER_MODEL = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(parts) {
  let lastError;
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        console.log(`  → Trying ${model} (attempt ${attempt}/${MAX_RETRIES_PER_MODEL})...`);
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts }],
        });
        console.log(`  ✅ Success with ${model}`);
        return response;
      } catch (err) {
        lastError = err;
        const msg = err.message || String(err);
        const isOverload = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("overload");
        const isRateLimit = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
        const isQuotaExhausted = msg.includes("GenerateRequestsPerDay") || msg.includes("free_tier_requests");

        // If daily quota is truly exhausted for this model, skip retries and move to next model
        if (isQuotaExhausted) {
          console.log(`  🚫 ${model} daily free quota exhausted. Moving to next model...`);
          break; // exit inner loop, try next model
        }

        if (isOverload || isRateLimit) {
          // For 429 rate limits, Google sometimes says "retry in 12s". Wait longer.
          const waitMs = isRateLimit ? 15000 : 2000 * attempt;
          console.log(`  ⚠️  ${model} is busy. Waiting ${waitMs / 1000}s before retry...`);
          await sleep(waitMs);
          continue;
        }
        // Non-retryable error (e.g. invalid key, bad request) — throw immediately
        throw err;
      }
    }
    console.log(`  ↻ Done with ${model}. Moving to next model if available...`);
  }
  throw lastError;
}

app.post("/api/extract", upload.array("files", 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    // Build content parts: each image/PDF as inlineData, plus the text prompt
    const parts = req.files.map((file) => ({
      inlineData: {
        mimeType: file.mimetype,
        data: file.buffer.toString("base64"),
      },
    }));
    parts.push({ text: EXTRACTION_PROMPT });

    console.log(`\n📄 Extraction request: ${req.files.length} file(s)`);
    const response = await generateWithRetry(parts);

    let text = response.text || "";
    text = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error("Extraction error:", err.message);
    const msg = err.message || "Extraction failed";
    const friendly = msg.includes("503") || msg.includes("UNAVAILABLE")
      ? "Gemini is overloaded right now (tried Flash and Flash-Lite). Please wait a minute and try again."
      : msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")
      ? "You've hit your free tier daily limit. Try again tomorrow or upgrade your API plan."
      : msg;
    res.status(500).json({ error: friendly });
  }
});

app.get("/api/health", (_, res) => res.json({ ok: true, provider: "gemini" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Server running on http://localhost:${PORT}\n`);
  console.log(`   Using Gemini 2.5 Flash (free tier)\n`);
});
