//TODO: scripts/api-key-test.ts - temporary, delete after validation
import "dotenv/config";

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models",
    { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }
  );
  console.log(res.status, (await res.text()).slice(0, 200));
}

main();