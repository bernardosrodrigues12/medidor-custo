import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { MeteredCall } from "./meter.js";

const CSV_PATH = 'data/calls.csv';
const HEADER = 'timestamp,model,promptTokens,completionTokens,thoughtTokens,totalTokens,costUsd,latencyMs,status,errorCode,errorMessage';

function ensureFile(): void {
    if (existsSync(CSV_PATH)) return;
    mkdirSync(dirname(CSV_PATH), { recursive: true});
    writeFileSync(CSV_PATH, HEADER + "\n");
}

export function logCall(call: MeteredCall): void {
    ensureFile();
    const row = [
        new Date().toISOString(),
        call.model,
        call.promptTokens,
        call.completionTokens,
        call.thougthTokens,
        call.totalTokens,
        call.costUsd.toFixed(6),
        call.latencyMs,
        call.status,    
    ].join(',');

    appendFileSync(CSV_PATH, row + '\n')
}