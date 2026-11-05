// src/meter.ts (adaptação)
import { performance } from "node:perf_hooks";
import { llm } from "./client.js";

export interface MeteredCall {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number;
  status: "ok" | "error";
}

const PRICING: Record<string, { input: number; output: number }> = {
  // Confira os preços atuais na página de pricing do Gemini
  "gemini-3.8-flash": { input: 0.75, output: 3.00 },
};

function estimateCost(model: string, usage: {
  promptTokens: number;
  completionTokens: number;
}): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (
    (usage.promptTokens / 1_000_000) * price.input +
    (usage.completionTokens / 1_000_000) * price.output
  );
}

export async function meteredChat(
  model: string,
  prompt: string
): Promise<MeteredCall> {
  const start = performance.now();

  const response = await llm.models.generateContent({
    model,
    contents: prompt,
  });

  const latencyMs = performance.now() - start;


  const usage = response.usageMetadata;
  const promptTokens = usage?.promptTokenCount;
  const completionTokens = usage?.candidatesTokenCount;

  if (promptTokens === undefined || completionTokens === undefined) {
    throw new Error(
      `Gemini response has incomplete usage data — cannot meter call (status: ${response.text ? "ok" : "empty"})`
    );
  }

  return {
    model,
    promptTokens,
    completionTokens,
    totalTokens: usage?.totalTokenCount ?? promptTokens + completionTokens,
    costUsd: estimateCost(model, { promptTokens, completionTokens }),
    latencyMs: Math.round(latencyMs),
    status: "ok",
  };
}