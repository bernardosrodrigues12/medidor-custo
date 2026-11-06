import { meteredChat } from "../src/meter.js";

async function main() {
  const result = await meteredChat("gemini-3.5-flash", "Say hello in 3 words");
  console.log(result);
}

main().catch((err) => {
  console.error("❌ meter.ts failed:", (err as Error).message);
  process.exit(1);
});