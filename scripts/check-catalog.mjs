import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { testCatalog } from "../src/data/testCatalog.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function findArrayEnd(source, openIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
    } else if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Не удалось определить границы массива вариантов.");
}

function countArrayItems(source, openIndex, closeIndex) {
  let depth = 1;
  let quote = "";
  let escaped = false;
  let commas = 0;
  let hasItem = false;

  for (let index = openIndex + 1; index < closeIndex; index += 1) {
    const character = source[index];
    if (quote) {
      hasItem = true;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      hasItem = true;
    } else if (character === "[" || character === "{" || character === "(") {
      depth += 1;
      hasItem = true;
    } else if (character === "]" || character === "}" || character === ")") {
      depth -= 1;
    } else if (character === "," && depth === 1) {
      commas += 1;
    } else if (!/\s/.test(character)) {
      hasItem = true;
    }
  }

  return hasItem ? commas + 1 : 0;
}

function collectOptionCounts(source) {
  const counts = [];
  const marker = /\b(?:options|answers)\s*:\s*\[/g;
  let match;

  while ((match = marker.exec(source)) !== null) {
    const openIndex = source.indexOf("[", match.index);
    const closeIndex = findArrayEnd(source, openIndex);
    counts.push(countArrayItems(source, openIndex, closeIndex));
    marker.lastIndex = closeIndex + 1;
  }

  return counts;
}

async function checkTest(test) {
  const folder = path.join(root, "public", "tests", test.folder);
  const [html, script] = await Promise.all([
    readFile(path.join(folder, "index.html"), "utf8"),
    readFile(path.join(folder, "script.js"), "utf8"),
  ]);
  const answerIndexes = [...script.matchAll(/\b(?:correct|answer)\s*:\s*(\d+)\b/g)]
    .map((match) => Number(match[1]));
  const optionCounts = collectOptionCounts(script);
  const stylesheet = html.match(/<link\b[^>]*href=["']([^"']+\.css)["']/i)?.[1];
  const scriptReference = html.match(/<script\b[^>]*src=["']([^"']+\.js)["']/i)?.[1];

  if (answerIndexes.length === 0 || optionCounts.length !== answerIndexes.length) {
    failures.push(`${test.folder}: число вопросов и массивов вариантов не совпадает.`);
  }
  if (optionCounts.some((count) => count !== 3)) {
    failures.push(`${test.folder}: найден вопрос не с тремя вариантами ответа.`);
  }
  if (answerIndexes.some((answer, index) => answer < 0 || answer >= optionCounts[index])) {
    failures.push(`${test.folder}: индекс правильного ответа выходит за границы вариантов.`);
  }
  if (!stylesheet || !(await fileExists(path.join(folder, stylesheet)))) {
    failures.push(`${test.folder}: таблица стилей из HTML не найдена.`);
  }
  if (!scriptReference || !(await fileExists(path.join(folder, scriptReference)))) {
    failures.push(`${test.folder}: JavaScript из HTML не найден.`);
  }

  console.log(`${test.folder}: ${answerIndexes.length} вопросов, варианты: ${[...new Set(optionCounts)].join(", ") || "не найдены"}`);
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

for (const test of testCatalog) {
  try {
    await checkTest(test);
  } catch (error) {
    failures.push(`${test.folder}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error("\nПроверка каталога не пройдена:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`\nПроверка пройдена: ${testCatalog.length} тестов.`);
}
