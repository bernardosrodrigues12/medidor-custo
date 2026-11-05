// src/smoke-test.ts — temporary, delete after validation
import { llm } from "./client.js";

async function main() {
  const pager = await llm.models.list();
  console.log("✅ client.ts OK — models found:");
  for await (const model of pager) {
    console.log("  -", model.name); // ex.: "models/gemini-3.8-flash"
  }
}

main().catch((err) => {
  console.error("❌ client.ts failed:", err.message);
  process.exit(1);
});