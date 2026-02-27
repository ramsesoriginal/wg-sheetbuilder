// js/main.js
import {
  listCharacterNames,
  loadCharacter,
  saveCharacter,
  deleteCharacter,
  getLastActiveName,
  exportAll,
  importData,
} from "./storage.js";
import { recalculateAll } from "./calc.js";

const SAVE_DEBOUNCE_MS = 200;

function $(id) {
  return document.getElementById(id);
}

function setStatus(msg) {
  const el = $("saveStatus");
  if (!el) return;
  el.textContent = msg;
}

function getCharacterName() {
  const el = $("characterName");
  if (!el) return "";
  return el.value.trim();
}

function serializeForm(form) {
  /** @type {Record<string, any>} */
  const out = { schemaVersion: 1 };

  const fields = form.querySelectorAll("input[name], textarea[name], select[name]");
  fields.forEach((el) => {
    if (el.disabled) return;
    if ("readOnly" in el && el.readOnly) return;
    if (el.dataset.derived === "true") return;

    if (el.type === "checkbox") {
      out[el.name] = el.checked;
      return;
    }
    out[el.name] = el.value;
  });

  return out;
}

function applyStateToForm(form, state) {
  if (!state || typeof state !== "object") return;

  const fields = form.querySelectorAll("input[name], textarea[name], select[name]");
  fields.forEach((el) => {
    if (!(el.name in state)) return;

    if (el.type === "checkbox") {
      el.checked = Boolean(state[el.name]);
      return;
    }
    el.value = state[el.name] ?? "";
  });
}

function clearForm(form) {
  form.reset();

  const fields = form.querySelectorAll("input[name], textarea[name], select[name]");
  fields.forEach((el) => {
    if (el.type === "checkbox") el.checked = false;
    else el.value = "";
  });
}

function rebuildCharacterSelect(activeName = "") {
  const sel = $("characterSelect");
  if (!sel) return;

  const names = listCharacterNames();
  sel.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = names.length ? "Select a character…" : "No saved characters";
  sel.appendChild(placeholder);

  for (const name of names) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  }

  if (activeName && names.includes(activeName)) sel.value = activeName;
  else sel.value = "";
}

function debounce(fn, ms) {
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function pickNextActiveName() {
  const names = listCharacterNames();
  return names[0] || "";
}

function init() {
  const form = document.querySelector("form.sheet");
  if (!form) {
    console.warn("Sheet form not found (expected: form.sheet).");
    return;
  }

  const doAutosave = () => {
    const name = getCharacterName();
    if (!name) {
      setStatus("Name required to save");
      return;
    }
    const state = serializeForm(form);
    saveCharacter(name, state);
    rebuildCharacterSelect(name);
    setStatus("Saved");
  };

  const autosaveDebounced = debounce(() => {
    recalculateAll();
    doAutosave();
  }, SAVE_DEBOUNCE_MS);

  // Startup load
  rebuildCharacterSelect(getLastActiveName());
  const last = getLastActiveName();
  if (last) {
    const state = loadCharacter(last);
    if (state) {
      applyStateToForm(form, state);
      rebuildCharacterSelect(last);
      setStatus(`Loaded: ${last}`);
    }
  }

  recalculateAll();

  // Autosave after every change
  form.addEventListener("input", autosaveDebounced);
  form.addEventListener("change", autosaveDebounced);

  // Load on selection
  const sel = $("characterSelect");
  if (sel) {
    sel.addEventListener("change", () => {
      const name = sel.value;
      if (!name) return;
      const state = loadCharacter(name);
      if (!state) return;

      clearForm(form);
      applyStateToForm(form, state);
      recalculateAll();
      rebuildCharacterSelect(name);
      setStatus(`Loaded: ${name}`);
    });
  }

  // New character (reset)
  const btnNew = $("btnNewCharacter");
  if (btnNew) {
    btnNew.addEventListener("click", () => {
      clearForm(form);
      recalculateAll();
      rebuildCharacterSelect("");
      setStatus("New character (not saved yet)");
    });
  }

  // Delete character (current name)
  const btnDelete = $("btnDeleteCharacter");
  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      const name = getCharacterName();
      if (!name) {
        setStatus("Enter a name to delete a saved character");
        return;
      }

      if (!confirm(`Delete saved character "${name}"? This cannot be undone.`)) return;

      const ok = deleteCharacter(name);
      if (!ok) {
        setStatus(`No saved character named: ${name}`);
        return;
      }

      // If you deleted the active sheet, clear form and load next (if any)
      clearForm(form);
      recalculateAll();

      const next = pickNextActiveName();
      rebuildCharacterSelect(next);

      if (next) {
        const st = loadCharacter(next);
        if (st) applyStateToForm(form, st);
        recalculateAll();
        setStatus(`Deleted "${name}". Loaded: ${next}`);
      } else {
        setStatus(`Deleted "${name}". No characters left.`);
      }
    });
  }

  // Export current
  const btnExportCurrent = $("btnExportCurrent");
  if (btnExportCurrent) {
    btnExportCurrent.addEventListener("click", () => {
      const name = getCharacterName();
      if (!name) {
        setStatus("Name required to export current character");
        return;
      }
      const state = serializeForm(form);
      // Single-character export is just the state object (simple)
      downloadJson(`wg-character-${name}.json`, state);
      setStatus(`Exported: ${name}`);
    });
  }

  // Export all (bundle)
  const btnExportAll = $("btnExportAll");
  if (btnExportAll) {
    btnExportAll.addEventListener("click", () => {
      const bundle = exportAll();
      downloadJson(`wg-characters-export.json`, bundle);
      setStatus("Exported all characters");
    });
  }

  // Import
  const btnImport = $("btnImport");
  const importFile = $("importFile");
  if (btnImport && importFile) {
    btnImport.addEventListener("click", () => importFile.click());

    importFile.addEventListener("change", async () => {
      const file = importFile.files?.[0];
      importFile.value = ""; // allow re-importing same file
      if (!file) return;

      try {
        const text = await file.text();
        const payload = JSON.parse(text);

        const { importedNames, totalStored } = importData(payload);
        const toLoad = importedNames[0] || pickNextActiveName();

        rebuildCharacterSelect(toLoad);

        if (toLoad) {
          const st = loadCharacter(toLoad);
          clearForm(form);
          if (st) applyStateToForm(form, st);
          recalculateAll();
          setStatus(
            `Imported ${importedNames.length} character(s). Total: ${totalStored}. Loaded: ${toLoad}`
          );
        } else {
          setStatus(`Imported ${importedNames.length} character(s). Total: ${totalStored}.`);
        }
      } catch (err) {
        console.error(err);
        setStatus("Import failed: invalid JSON or unsupported format");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
