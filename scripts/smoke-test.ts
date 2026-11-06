//TODO: src/smoke-test.ts — temporary, delete after validation
import { llm } from "../src/client.js";

async function main() {
  const pager = await llm.models.list();
  console.log("✅ client.ts OK — models found:");
  for await (const model of pager) {
    console.log("  -", model.name); 
  }
}

main().catch((err) => {
  console.error("❌ client.ts failed:", err.message);
  process.exit(1);
});