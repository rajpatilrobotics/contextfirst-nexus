import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const expectedTesseractVersion = "7.0.0";
const expectedLanguageVersion = "1.0.0";
const repoRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const tesseractRoot = join(repoRoot, "node_modules", "tesseract.js");
const coreRoot = join(repoRoot, "node_modules", "tesseract.js-core");
const languageRoot = join(
  repoRoot,
  "node_modules",
  "@tesseract.js-data",
  "eng",
);
const destinationRoot = join(repoRoot, "public", "vendor", "tesseract");

async function packageVersion(path) {
  return JSON.parse(await readFile(path, "utf8")).version;
}

async function assertReadableFile(path, label) {
  const fileStat = await stat(path);
  if (!fileStat.isFile() || fileStat.size === 0) {
    throw new Error(`${label} is missing or empty: ${path}`);
  }
}

const tesseractVersion = await packageVersion(join(tesseractRoot, "package.json"));
const languageVersion = await packageVersion(join(languageRoot, "package.json"));
if (tesseractVersion !== expectedTesseractVersion) {
  throw new Error(
    `Expected tesseract.js@${expectedTesseractVersion}, found ${tesseractVersion}.`,
  );
}
if (languageVersion !== expectedLanguageVersion) {
  throw new Error(
    `Expected @tesseract.js-data/eng@${expectedLanguageVersion}, found ${languageVersion}.`,
  );
}

const assets = [
  {
    source: join(tesseractRoot, "dist", "worker.min.js"),
    destination: join(destinationRoot, "worker.min.js"),
  },
  {
    source: join(coreRoot, "tesseract-core-lstm.wasm.js"),
    destination: join(destinationRoot, "core", "tesseract-core-lstm.wasm.js"),
  },
  {
    source: join(coreRoot, "tesseract-core-simd-lstm.wasm.js"),
    destination: join(
      destinationRoot,
      "core",
      "tesseract-core-simd-lstm.wasm.js",
    ),
  },
  {
    source: join(coreRoot, "tesseract-core-relaxedsimd-lstm.wasm.js"),
    destination: join(
      destinationRoot,
      "core",
      "tesseract-core-relaxedsimd-lstm.wasm.js",
    ),
  },
  {
    source: join(
      languageRoot,
      "4.0.0_best_int",
      "eng.traineddata.gz",
    ),
    destination: join(destinationRoot, "lang", "eng.traineddata.gz"),
  },
];

for (const asset of assets) {
  await assertReadableFile(asset.source, "OCR asset source");
  await mkdir(dirname(asset.destination), { recursive: true });
  await copyFile(asset.source, asset.destination);
  await assertReadableFile(asset.destination, "OCR asset destination");
}

console.log(
  `Copied browser OCR assets for tesseract.js@${expectedTesseractVersion}.`,
);
