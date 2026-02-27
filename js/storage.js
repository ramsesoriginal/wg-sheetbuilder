// js/storage.js
const CHAR_KEY = "wg.characters.v1";
const META_KEY = "wg.meta.v1";

/** @returns {Record<string, any>} */
function readAllCharacters() {
  try {
    const raw = localStorage.getItem(CHAR_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** @param {Record<string, any>} data */
function writeAllCharacters(data) {
  localStorage.setItem(CHAR_KEY, JSON.stringify(data));
}

function readMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { lastActiveName: "" };
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : { lastActiveName: "" };
  } catch {
    return { lastActiveName: "" };
  }
}

/** @param {{lastActiveName?: string}} meta */
function writeMeta(meta) {
  const current = readMeta();
  const next = { ...current, ...meta };
  localStorage.setItem(META_KEY, JSON.stringify(next));
}

/** @returns {string[]} */
function listCharacterNames() {
  return Object.keys(readAllCharacters()).sort((a, b) => a.localeCompare(b));
}

/** @param {string} name */
function loadCharacter(name) {
  const all = readAllCharacters();
  return all[name] ?? null;
}

/** @param {string} name @param {any} state */
function saveCharacter(name, state) {
  const all = readAllCharacters();
  all[name] = state;
  writeAllCharacters(all);
  writeMeta({ lastActiveName: name });
}

/** @param {string} name */
function deleteCharacter(name) {
  const all = readAllCharacters();
  if (!(name in all)) return false;
  delete all[name];
  writeAllCharacters(all);

  const meta = readMeta();
  if (meta.lastActiveName === name) {
    writeMeta({ lastActiveName: "" });
  }
  return true;
}

function getLastActiveName() {
  return readMeta().lastActiveName || "";
}

/** Export bundle format (v1) */
function exportAll() {
  const all = readAllCharacters();
  const meta = readMeta();
  return {
    type: "wg-sheetbuilder-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    meta,
    characters: all,
  };
}

/**
 * Import supports:
 * - bundle: {type, version, characters:{...}}
 * - single character state object (must contain characterName or be wrapped)
 *
 * Merges into existing storage.
 * @param {any} payload
 * @returns {{importedNames: string[], totalStored: number}}
 */
function importData(payload) {
  const existing = readAllCharacters();
  const importedNames = [];

  // Helper: ensure unique name if collision
  const uniqueName = (base) => {
    let name = String(base || "Imported Character").trim() || "Imported Character";
    if (!(name in existing)) return name;
    let i = 2;
    while (`${name} (${i})` in existing) i++;
    return `${name} (${i})`;
  };

  // Bundle import
  if (
    payload &&
    typeof payload === "object" &&
    payload.type === "wg-sheetbuilder-export" &&
    payload.version === 1 &&
    payload.characters &&
    typeof payload.characters === "object"
  ) {
    for (const [name, state] of Object.entries(payload.characters)) {
      const safeName = uniqueName(name);
      existing[safeName] = state;
      importedNames.push(safeName);
    }

    // If bundle has meta.lastActiveName and it exists in imported set, keep it; else ignore.
    if (payload.meta && typeof payload.meta === "object") {
      const last = String(payload.meta.lastActiveName || "").trim();
      if (last) {
        // If last name collides and got renamed, we can’t reliably map it. Leave lastActiveName empty.
        // main.js will choose what to load after import.
      }
    }

    writeAllCharacters(existing);
    return { importedNames, totalStored: Object.keys(existing).length };
  }

  // Single character import (either wrapped or raw state)
  // Accept {characterName:"X", ...} as state
  if (payload && typeof payload === "object") {
    const rawName = String(payload.characterName || payload.name || "").trim();
    const safeName = uniqueName(rawName || "Imported Character");
    existing[safeName] = payload;
    writeAllCharacters(existing);
    importedNames.push(safeName);
    return { importedNames, totalStored: Object.keys(existing).length };
  }

  throw new Error("Unsupported import format");
}

export {
  listCharacterNames,
  loadCharacter,
  saveCharacter,
  deleteCharacter,
  getLastActiveName,
  exportAll,
  importData,
};
