
import { performance } from "node:perf_hooks";
import { llm } from "./client.js";

export interface MeteredCall {
  model: string;
  promptTokens: number;
  completionTokens: number;
  thougthTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  status: "ok" | "error";
  errorCode?: string;
  errorMessage?: string;
}


const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-3.5-flash": { input: 1.50, output: 9.00 },
  "gemini-3.5-flash-lite": { input: 0.30, output: 2.50 },
  
};

function estimateCost(model: string, usage: { promptTokens: number; completionTokens: number }): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (usage.promptTokens / 1_000_000) * price.input +
         (usage.completionTokens / 1_000_000) * price.output;
}

const RETRYABLE_STATUSES = new Set([429, 500, 503]); 
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 2_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorCodeOf(err: unknown): string {
  const anyErr = err as { status?: number | string };
  return anyErr?.status !== undefined ? String(anyErr.status) : "UNKNOWN";
}

function errorMessageOf(err: unknown): string {
  const msg = (err as Error)?.message ?? String(err);
  return msg.replace(/[",\n\r]/g, " ").slice(0, 120); 
}

export async function meteredChat(model: string, prompt: string): Promise<MeteredCall> {
  const start = performance.now();
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await llm.models.generateContent({ model, contents: prompt });
      
      const usage = response.usageMetadata;
      const promptTokens = usage?.promptTokenCount;
      const completionTokens = usage?.candidatesTokenCount;
      const thougthTokens = usage?.thoughtsTokenCount ?? 0;

      if (promptTokens === undefined || completionTokens === undefined) {
        const usageErr = new Error("Gemini returned incomplete usage data") as Error & { status: string };
        usageErr.status = "INCOMPLETE_USAGE";
        throw usageErr;
      }

      return {
        model,
        promptTokens,
        completionTokens,
        thougthTokens,
        totalTokens: usage?.totalTokenCount ?? promptTokens + completionTokens + thougthTokens,
        costUsd: estimateCost(model, { promptTokens, completionTokens: completionTokens + thougthTokens }),
        latencyMs: Math.round(performance.now() - start),
        status: "ok",
      };
    } catch (err) {
      lastError = err;
      const retryable = RETRYABLE_STATUSES.has(Number(errorCodeOf(err)));
      if (!retryable || attempt === MAX_RETRIES) break;

      const waitMs = BASE_DELAY_MS * 2 ** attempt; 
      console.warn(`[meter] status ${errorCodeOf(err)} transiente — retry ${attempt + 1}/${MAX_RETRIES} em ${waitMs}ms`);
      await delay(waitMs);
    }
  }

  return {
    model,
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    thougthTokens: 0,
    costUsd: 0,
    latencyMs: Math.round(performance.now() - start),
    status: "error",
    errorCode: errorCodeOf(lastError),
    errorMessage: errorMessageOf(lastError),
  };
}