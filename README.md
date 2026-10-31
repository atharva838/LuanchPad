# LaunchPad — Student Opportunity Hub

A responsive, browser-based opportunity discovery and application tracker built with **HTML, CSS, and vanilla JavaScript only**.

> The included organisations and opportunities are sample/demo data, not verified live openings. Always check official sources before applying.

## Features

- **Dashboard:** application counts, saved opportunities, pipeline visualisation, and quick actions.
- **Discover:** search by title, organiser, skills or description; filter by type and mode; sort by deadline or recently added.
- **Application tracker:** track Interested → Applied → Assessment → Interview → Offer / Rejected, add notes, record application dates, edit status and remove records.
- **Saved opportunities:** maintain a shortlist with one click.
- **Add opportunity:** validated form for custom opportunities.
- **XML backup & restore:** export opportunities, saved IDs and applications using `XMLSerializer`; import and merge a backup using `DOMParser`.
- **AJAX / Fetch API:** load the sample dataset from `opportunities.json`.
- **Persistent browser storage:** opportunities, saved items, applications and theme use `localStorage`.
- **Responsive interface:** desktop sidebar, mobile navigation, dark mode, toast feedback and accessible dialog labels.
- **No framework or build step:** no React, Bootstrap, jQuery, npm, backend, or database.

## Run locally

Because the app uses `fetch("./opportunities.json")`, run it through a local HTTP server instead of opening `index.html` directly with `file://`.

### Recommended: VS Code Live Server
1. Extract the ZIP.
2. Open the `LaunchPad-Student-Opportunity-Tracker` folder in VS Code.
3. Install/enable the **Live Server** extension if needed.
4. Right-click `index.html` → **Open with Live Server**.

Alternatively, from the project folder run a static server if Python is installed:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500`.

## Project structure

```text
LaunchPad-Student-Opportunity-Tracker/
├── index.html          # App layout, views, forms and dialogs
├── styles.css          # Responsive UI, design system and dark mode
├── app.js              # State, rendering, events, storage, fetch and XML
├── opportunities.json  # Sample data loaded using Fetch API
└── README.md           # Setup and feature guide
```

## JavaScript concepts demonstrated

| Concept | Where / why |
|---|---|
| `fetch()` and `async/await` | Load JSON data asynchronously |
| JSON parsing/stringifying | Read the dataset and persist application state |
| `localStorage` | Keep changes after refreshing the browser |
| Event delegation | Handle buttons on dynamically rendered opportunity cards |
| DOM manipulation | Render cards, dashboard stats, tables and feedback |
| `FormData` + validation | Collect and validate new opportunity forms |
| `DOMParser` | Parse and validate XML imports |
| `XMLSerializer` | Generate a structured XML backup |
| `Blob` + object URLs | Download a backup without a server |
| `Set`, `Map`, array methods | Manage saved IDs, merge imports, filter and sort data |
| Error handling | Handle fetch failures, malformed backups and storage errors |
| Responsive CSS | Adapt layout for desktop, tablet and mobile |

## Important scope notes

This is a **frontend-only project**. `localStorage` belongs to one browser profile on one device; it is not a shared database. There is no secure multi-user login, server-side access control, or real-time synchronisation. Do not store passwords or sensitive information here.

The URLs and listings in `opportunities.json` are illustrative sample links. This app does not scrape job boards or guarantee that sample opportunities are open.

## Suggested manual test checklist

1. Open Discover and search for `JavaScript`.
2. Filter by `Workshop`, then clear filters.
3. Save an opportunity and verify it appears under Saved opportunities.
4. Track an opportunity, update its status to Applied, and add a follow-up note.
5. Refresh the page and verify data persists.
6. Add a custom opportunity.
7. Export XML, reset demo data, then import the XML backup.
8. Toggle dark mode and test the mobile sidebar by narrowing the browser window.

## GitHub publishing

Create a new repository named `LaunchPad-Student-Opportunity-Tracker`, upload these files, and enable GitHub Pages from **Settings → Pages → Deploy from a branch → main → /(root)**. Since this project is static, GitHub Pages can host it directly.

## Next improvements (still vanilla JS)

- Add a weekly calendar view.
- Add CSV export.
- Add browser notifications for upcoming deadlines.
- Connect to a real opportunity API once an appropriate API and CORS policy are available.
