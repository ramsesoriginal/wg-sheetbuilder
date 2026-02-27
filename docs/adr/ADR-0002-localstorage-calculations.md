# ADR-0002: LocalStorage autosave, multi-character selector UI, and derived-value calculations

## Status
Accepted

## Context
We need the next functional milestone after the static, field-complete character sheet:

1) Persist character sheets locally (no server; GitHub Pages).
2) Provide minimal UI to:
   - See all stored characters
   - Load a character
   - Create a new character (reset form)
3) Autosave after every change.
4) Use **character name** as the save key:
   - If the character name changes, it becomes a **new character** (new saved entry).
5) On page reload, automatically load the **last opened** character.

Additionally, we want basic derived stats to be calculated automatically:
- Derived values must **not be editable**.
- Derived values must **not be stored** (they’re computed).
- Derived values must recalc after:
  - Any input change
  - Loading a character
  - Creating/resetting a character

We also must preserve the project constraints:
- Minimal JS
- Accessible UI
- Print remains clean
- Future privacy boundary (public/shareable vs private) is not implemented yet, but we should avoid painting ourselves into a corner.

## Decision

### 1) Storage mechanism
Use **LocalStorage** as the only persistence layer for now.

We store a **collection** of character documents and a small **meta** record.

- Key: `wg.characters.v1` → JSON object of character sheets keyed by character name.
- Key: `wg.meta.v1` → JSON with:
  - `lastActiveName`: string (character name last loaded)
  - optional future fields (schema version, UI prefs)

### 2) Character identity and keying
Use **character name** as the identifier for the saved record.

Rules:
- Autosave always writes to the record keyed by the **current character name**.
- If the user changes the name from `Old` to `New`, subsequent saves write to `New` (creating it if missing).
- The previous record (`Old`) is not automatically deleted (to avoid accidental loss).

Edge cases:
- Empty/whitespace-only names: autosave is disabled until a valid name exists (UI shows “Name required to save”).
- Collisions: if `New` already exists, saving updates that record. (We accept this as “name is the key” behavior; later we can add unique IDs if needed.)

### 3) Autosave strategy
Autosave triggers on every `input`/`change` event, with a small debounce (e.g., 150–300ms) to avoid excessive writes.

Autosave operations:
- Serialize the **editable** form state only (no derived outputs).
- Persist to `wg.characters.v1`.
- Update `wg.meta.v1.lastActiveName` to the current name.

### 4) Minimal UI for character management
Add a small “Character Manager” bar (screen-only) with:
- A `<select>` listing all saved characters (by name)
- A “Load” action (or load-on-select)
- A “New” button to reset the form to defaults/blank
- Optional “Delete” is explicitly out of scope for this milestone (can be added later)

On startup:
- If `lastActiveName` exists and matches a stored character, load it.
- Else if any characters exist, load the first (or most recently updated if we store timestamps later).
- Else start with a blank sheet.

### 5) Derived value calculations
Derived values are computed in JS and written to `<output>` elements (or read-only fields) after any change.

Derived fields:
- Are **not editable** (rendered as `<output>` or `readonly` inputs).
- Are **not stored**.
- Are recomputed from the current in-memory/editable state immediately after:
  - Any user edit
  - Loading a character
  - Resetting/creating a new character

### 6) Calculation model and overrides
For this milestone we implement only the “simple, straightforward basics” already noted on the reference sheet:
- Wounds max = Toughness + (2 × Tier)
- Shock max = Willpower + Tier
- Defence = Initiative − 1
- Resilience base = Toughness + 1
- Resilience total = Resilience base + Armour bonus (AR)
- Conviction = Willpower
- Resolve = Willpower − 1
- Influence = Fellowship − 1
- Wealth = Tier
- Passive Awareness = Awareness total ÷ 2 (rounded down)

We **do not** implement manual overrides in this ADR; that becomes a later milestone if house rules require it.

## Consequences

### Positive
- Fully offline and robust on GitHub Pages.
- Multi-character support with minimal complexity.
- Autosave reduces accidental data loss.
- Derived values stay consistent and always up to date.
- Not storing derived values avoids stale/corrupt state and simplifies migrations.

### Negative / tradeoffs
- Using character name as key can cause collisions and accidental overwrites if names repeat.
- Renaming creates a new record and can leave orphaned old names (by design; avoids surprise deletion).
- LocalStorage size limits could constrain very large notes/fields (unlikely for typical sheets, but possible).
- No cross-device sync yet (future Gist sync can be added later).

## Alternatives considered
- IndexedDB: rejected for now (more complexity than needed for milestone).
- Use generated UUIDs for character IDs: rejected for now because the user explicitly wants “save based on character name.”
- Store derived values: rejected (risk of stale values; extra complexity; contradicts requirement).
- Autosave only on “Save” button: rejected (requirement is autosave after every change).

## Implementation notes
- Add a `schemaVersion: 1` in stored payloads for future migrations.
- Store timestamps later if we want “recently opened/updated” ordering.
- Keep a clear split in serialization:
  - `serializeEditableState(form)` ignores `<output>` and readonly-calculated fields.
  - `applyState(form, state)` sets inputs then calls `recalculateAll()`.

## Links
- ADR-0001: Static semantic HTML sheet with print-first CSS and minimal JavaScript
- Reference field list and derived formulas are taken from the sheet audit milestone (not reproducing layout or rules text)
