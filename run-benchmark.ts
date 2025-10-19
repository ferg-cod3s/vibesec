import * as fs from "fs";
import * as path from "path";
import { performance } from "perf_hooks";

// Simple parser using regex (like Bun fallback)
function extractFunctions(content: string): string[] {
  const re = /(?:function\s+(\w+)|const\s+(\w+)\s*=|async\s+function\s+(\w+))/g;
  const functions: string[] = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name) functions.push(name);
  }
  return functions;
}

function extractStrings(content: string): string[] {
  const re = /["'`]([^"'`\n]{0,100}?)["'`]/g;
  const strings: string[] = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    strings.push(match[1]);
  }
  return strings;
}

function extractVariables(content: string): string[] {
  const re = /(?:const|let|var)\s+(\w+)/g;
  const variables: string[] = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    variables.push(match[1]);
  }
  return variables;
}

function extractTemplates(content: string): string[] {
  const re = /`([^`]*\$\{[^}]*\}[^`]*)`/g;
  const templates: string[] = [];
  let match;
  while ((match = re.exec(content)) !== null) {
    let template = match[1];
    if (template.length > 100) template = template.substring(0, 100);
    templates.push(template);
  }
  return templates;
}

function parseFile(filePath: string): {
  parse_time_ms: number;
  functions: string[];
  strings: string[];
  variables: string[];
  templates: string[];
} {
  const start = performance.now();
  const content = fs.readFileSync(filePath, "utf-8");
  const end = performance.now();

  return {
    parse_time_ms: end - start,
    functions: extractFunctions(content),
    strings: extractStrings(content),
    variables: extractVariables(content),
    templates: extractTemplates(content),
  };
}

// Main benchmark
const corpusDir = process.argv[2] || "../shared-corpus";
const files = fs.readdirSync(corpusDir)
  .filter((f) => f.endsWith(".js") || f.endsWith(".ts"))
  .map((f) => path.join(corpusDir, f))
  .sort();

console.log("\nRunning benchmark: Bun Parser");
console.log(`Files to process: ${files.length}`);

const startTime = performance.now();
const parseTimes: number[] = [];

for (let i = 0; i < files.length; i++) {
  const result = parseFile(files[i]);
  parseTimes.push(result.parse_time_ms);

  if ((i + 1) % Math.max(1, Math.floor(files.length / 10)) === 0) {
    const progress = (((i + 1) / files.length) * 100).toFixed(0);
    console.log(`  ${progress}% complete (${i + 1}/${files.length})`);
  }
}

const endTime = performance.now();
const totalTime = endTime - startTime;

const totalParseTime = parseTimes.reduce((a, b) => a + b, 0);
const avgTime = totalParseTime / parseTimes.length;
const minTime = Math.min(...parseTimes);
const maxTime = Math.max(...parseTimes);

// Save results
const results = {
  name: "Bun Parser",
  duration: {
    start: Math.floor(startTime),
    end: Math.floor(endTime),
    total_ms: totalTime,
  },
  metrics: {
    total_files: files.length,
    total_parse_time_ms: totalParseTime,
    average_parse_time_ms: avgTime,
    min_parse_time_ms: minTime,
    max_parse_time_ms: maxTime,
    detection_count: 0,
    memory_used_mb: 0,
    timestamp_ms: Date.now(),
  },
};

fs.writeFileSync("bun-benchmark-results.json", JSON.stringify([results], null, 2));

console.log("\nBenchmark results saved to: bun-benchmark-results.json");
console.log("\n=== Benchmark Summary ===");
console.log(`Files processed: ${files.length}`);
console.log(
  `Total parse time: ${totalParseTime.toFixed(2)} ms (${(totalParseTime / 1000).toFixed(2)} s)`
);
console.log(`Average parse time per file: ${avgTime.toFixed(2)} ms`);
console.log(`Min parse time: ${minTime.toFixed(2)} ms`);
console.log(`Max parse time: ${maxTime.toFixed(2)} ms`);
