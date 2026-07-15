import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const expectedVersion = "6.1.200";
const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJsonPath = join(repoRoot, "node_modules", "pdfjs-dist", "package.json");
const sourcePath = join(repoRoot, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destinationPath = join(repoRoot, "public", "vendor", "pdfjs", "pdf.worker.min.mjs");

async function assertReadableFile(path, label) {
  const fileStat = await stat(path);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`${label} is missing or empty: ${path}`);
  }
}

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));

if (packageJson.version !== expectedVersion) {
  throw new Error(
    `Expected pdfjs-dist@${expectedVersion}, found ${packageJson.version}. Refusing to copy worker.`,
  );
}

await assertReadableFile(sourcePath, "PDF.js worker source");
await mkdir(dirname(destinationPath), { recursive: true });
await copyFile(sourcePath, destinationPath);
await assertReadableFile(destinationPath, "PDF.js worker destination");

console.log(`Copied pdfjs-dist@${expectedVersion} worker to ${destinationPath}`);
