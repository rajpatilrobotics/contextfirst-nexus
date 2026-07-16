#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, relative } from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const CLIENT_DIRECTIVE = /(^|\n)\s*["']use client["'];?/;
const CLIENT_IMPORT_PROHIBITED = /\b(from\s+["'](?:openai|@google\/genai|@mistralai\/mistralai|server-only|\.{1,2}\/.*(?:ai\/server|prompts))["']|require\(["'](?:openai|@google\/genai|@mistralai\/mistralai)["']\))/;
const BROWSER_PROVIDER_ENDPOINT = /https:\/\/(?:api\.openai\.com|generativelanguage\.googleapis\.com|api\.mistral\.ai)\b/i;
const SECRET_LIKE_VALUE = /\b(?:sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)\b/;
const UNSAFE_HTML_RENDERING = /\bdangerouslySetInnerHTML\s*=/;
const PERSISTED_RAW_CONTENT = /\b(rawPdf|rawText|providerBody|modelBody|promptBody|currentExportPdf|generatedPdfBlob)\b/;
const FORBIDDEN_PUBLIC_SECRET_NAME = /\bNEXT_PUBLIC_[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|COOKIE|PASSWORD|PRIVATE)[A-Z0-9_]*\b/;

const ignoredPrefixes = [
  ".git/",
  ".next/",
  "node_modules/",
  "playwright-report/",
  "test-results/",
  "coverage/",
];

function trackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean)
    .filter((file) => !ignoredPrefixes.some((prefix) => file.startsWith(prefix)))
    .filter((file) => TEXT_EXTENSIONS.has(extname(file)));
}

function requestedFiles() {
  return process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("-"))
    .filter((file) => !ignoredPrefixes.some((prefix) => file.startsWith(prefix)))
    .filter((file) => TEXT_EXTENSIONS.has(extname(file)));
}

function lineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function pushFinding(findings, file, pattern, message) {
  const match = pattern.exec(file.contents);
  if (!match) return;
  findings.push({
    file: file.path,
    line: lineNumber(file.contents, match.index),
    message,
  });
}

const findings = [];
const sourcePaths = requestedFiles();
const files = (sourcePaths.length > 0 ? sourcePaths : trackedFiles())
  .filter((path) => existsSync(path))
  .map((path) => ({
    path,
    relativePath: relative(process.cwd(), path),
    contents: readFileSync(path, "utf8"),
  }));

for (const file of files) {
  const isClientSurface = CLIENT_DIRECTIVE.test(file.contents) || file.path.startsWith("app/") || file.path.startsWith("components/") || file.path.startsWith("features/");
  if (isClientSurface) {
    pushFinding(findings, file, CLIENT_IMPORT_PROHIBITED, "Client or UI surface imports a server-only provider, prompt, or SDK boundary.");
    pushFinding(findings, file, BROWSER_PROVIDER_ENDPOINT, "Browser-reachable code contains a direct live-provider endpoint.");
  }

  pushFinding(findings, file, SECRET_LIKE_VALUE, "Tracked file contains a secret-like value.");
  pushFinding(findings, file, FORBIDDEN_PUBLIC_SECRET_NAME, "Tracked file exposes a secret-like NEXT_PUBLIC variable name.");
  pushFinding(findings, file, UNSAFE_HTML_RENDERING, "Tracked file uses dangerouslySetInnerHTML.");
}

const stateFiles = files.filter((file) => file.path.startsWith("lib/state/") || file.path.startsWith("components/shell/case-state"));
for (const file of stateFiles) {
  pushFinding(findings, file, PERSISTED_RAW_CONTENT, "State or persistence surface references raw provider, source, prompt, or export blob content.");
}

if (findings.length > 0) {
  console.error("Boundary verification failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.message}`);
  }
  process.exit(1);
}

console.log(`Boundary verification passed for ${files.length} text files.`);
