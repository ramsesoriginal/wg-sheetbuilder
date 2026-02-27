# wg-sheetbuilder

Static, frontend-only bootstrap for a Wrath & Glory sheet tool (character + party sheets).
Hosted via GitHub Pages from `main` branch, root folder.

## Local Development

Run a simple static server:

```bash
python3 -m http.server 8080
```

Then open:

 - http://localhost:8080

## Deployment

GitHub Pages:
 - Branch: main
 - Folder: / (root)
 - No build step

## Roadmap (next)

 - Define a minimal data model (character + party)
 - Build a printable “sheet-like” form UI
 - Add local storage + export/import JSON
 - Add shareable public state via URL fragment (later)
