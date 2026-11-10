# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [`package.json`](./package.json).

> This is the public changelog. It starts at the first public release —
> earlier internal development history is intentionally not carried over.

---

## [0.1.0] — 2026-11-09 · First public release

ShardKit is a **copy-in UI shard kit**: a searchable, previewable gallery of finished
page cases and UI components. Not an npm dependency — you copy the code in.

### Included

**Gallery**
- Registry-driven index: drop a `registry-items/<id>/` directory, run
  `node scripts/build-registry.mjs`, and it appears in the gallery and the search index.
  No page code to touch.
- Live preview — detail pages render the real component, not a screenshot.
- 40 copy-in entries, 42 shadcn-style primitives under `src/components/ui/`.

**Page cases** (32 routes)
- Case index, dashboard, blank page
- Two parallel CRUD layouts sharing one form and one store:
  dialog-based (`/list`) and page-based (`/list-page`)
- Form page, full control gallery (`/form-all`), form with business recipe
- Tables — basic (sortable, status tags, row actions) and card grid
- Search — all examples and a realistic order-query page
- Detail pages — editable (`/detail`) and read-only descriptions table (`/detail-view`)
- Plan flow (`/plan-flow`) — DAG visualization of real plan exports with playback,
  collapsible subtrees, auto-fit grid layouts and viewport follow
- Waterfall, layout blocks, auth, error (403/404/500), multi-level menu, profile

**Shell**
- Four-zone surface layout: dark sidebar, tinted canvas, white framed content
- Multi-tab workspace with context menu, breadcrumbs, one-click refresh
- Light / dark theme, fullscreen, resizable sidebar

**Internationalization**
- `i18next` + `react-i18next`, locale packs bundled (zero runtime network calls)
- `zh-CN` / `en-US`, 281 keys across 14 namespaces
- First visit follows `navigator.language`; unrecognized languages fall back to English
- Manual choice persisted in `localStorage["shardkit.locale"]`

**Quality**
- Design-token budget script (`check-ui-rules`)
- Surface contrast and layering assertions (`verify_surfaces`)
- 26-route frame/content scan with page-error assertions
- Plan-flow regression suite (zoom, folding, fit, fullscreen)

### Known limitations

- **Example page content is Chinese-first.** The framework layer (navigation, tabs,
  breadcrumbs, table headers, field labels, toolbars, pagination, buttons, empty states,
  form labels and validation) is fully bilingual; the demo copy inside example pages is not.
  `agent_doc/国际化-i18n改造指南.md` lists every remaining file and includes a ready-to-paste
  prompt for finishing the localization with an agent.
- Icons are bundled via `lucide-react`. Adding other icon sets requires the offline
  `@iconify-json/*` packages — the online Iconify API mode is deliberately unsupported.

---

## Pre-release development

Internal development history (2026-09 → 2026-11, 123 commits) is not part of the public
repository. This release is the first published snapshot.
