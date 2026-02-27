# ADR-0001: Static semantic HTML sheet with print-first CSS and minimal JavaScript

## Status
Accepted

## Context
We are building a static, frontend-only Wrath & Glory sheet tool hosted on GitHub Pages.
The first functional milestone must be field-complete, accessible, mobile-first, and printable to PDF.
We must not reproduce the official sheet layout; the reference PDF is used only to identify fields and groupings.

The product also requires a strict privacy boundary:
- Public sheet state must be shareable via URL fragment.
- Private notes must never be included in shareable URLs.

## Decision
1) Implement the character sheet as semantic HTML using `<main>`, `<section>`, `<form>`, `<fieldset>`, `<legend>`, `<label>`, `<input>`, `<textarea>`, and tables only where tabular data is truly tabular.
2) Use print-first CSS:
   - `css/normalize.css` 
   - `css/layout.css` for structure, responsive layout, and print scaffolding
   - `css/style.css` for typography and visual styling
3) Use minimal JavaScript (deferred to later milestones) only for:
   - Calculations and validation
   - Serialization/storage (LocalStorage)
   - Optional GitHub Gist sync
   - Generating a shareable public state in the URL fragment
4) Define data boundaries early (even before implementation):
   - Public model: all gameplay-relevant fields needed at the table
   - Private model: secrets / GM notes / session notes (local + optional gist), never in URL fragment

## Consequences
- Pros:
  - Accessibility-friendly by default (labels, fieldsets, logical navigation)
  - Easy to print cleanly; CSS can enforce page breaks and hide screen-only UI
  - Maintainable structure; fields map directly to a future data model
  - Avoids copying the official visual expression while preserving functional completeness
- Cons:
  - Initial UI may look utilitarian until style iterations are added
  - Some interactions (repeatable rows, auto-calc) require later JS milestones

## Alternatives considered
- Canvas/PNG/PDF “sheet replica” layout: rejected (accessibility, maintenance, and copying risk).
- Framework-heavy SPA (React/Vue): rejected for this stage (unnecessary complexity, heavier JS).
- Single monolithic CSS file: rejected (harder to reason about print vs layout vs theming).
- Server-backed storage: rejected (GitHub Pages constraint).

## Links
- Reference: W_G-Character-Sheet-Print-Friendly.pdf (fields and grouping only)
- Repo: wg-sheetbuilder (GitHub Pages)
