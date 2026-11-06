import { meteredChat } from "../src/meter.js";
import { logCall } from "../src/logger.js";

const MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const PROMPTS = [
    "Diga olá em 3 palavras.",
    "Explique o que é um token de LLM em uma frase.",
    "Resuma em 2 frases por que janelas de contexto grandes custam mais caro.",
    "liste 5 casos de uso de IA para um e-commerce, com justificativa de uma linha cada.",
    "Escreva um parágrafo sobre embeddings com um exemplo concreto de busca semântica."
];

async function main() {
    for (const model of MODELS) {
        for (let i = 0; i < PROMPTS.length * 2; i++) {
            const prompt = PROMPTS[i % PROMPTS.length];
            
            if(!prompt) {
                throw new Error(`Prompt indefinido no índice ${i} — PROMPTS tem ${PROMPTS.length} itens`)    
            }

            const result = await meteredChat(model, prompt);
            logCall(result);
            console.log(
                `${model} ${i + 1}/10 - ${result.status} - ${result.totalTokens} tokens - $${result.costUsd.toFixed(6)} - ${result.latencyMs}ms`
            );
            await new Promise((r) => setTimeout(r, 4000));
        }
    }
}

main();