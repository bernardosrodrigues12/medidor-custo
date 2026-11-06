import { meteredChat } from "../src/meter.js";

async function main() {
  const result = await meteredChat("modelo-inexistente-xyz", "hi");
  console.log(result);
}

main().catch((err) => {
  console.error("Error name:", (err as Error).name);
  console.error("Status:", (err as any).status);
  console.error("Message:", (err as Error).message);
});