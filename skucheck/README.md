# Sneaker Stock Finder V3.2

Private beta sneaker stock intelligence app.

## What changed in V3.2

- Added a real product catalog layer in `lib/product-catalog.ts`.
- Improved smart search so keywords like `Black Cat 4`, `Military Blue 4`, and `Travis Scott Olive` resolve to known SKU/vendor codes before store lookup.
- Added `/api/admin/product-catalog` for product catalog inspection and future admin tooling.
- Added store reliability scoring in `lib/reliability.ts`.
- Enhanced Admin > Run Store Check with reliability %, size visibility, and inventory confidence.
- Kept the key safety rule: failed lookups show as **Lookup Unavailable**, never **Sold Out**.

## Run locally

```bash
npm install
npm run dev
```

## Production check

```bash
npm run build
```

## Store status rules

- **Verified Available** = public variant data confirms availability.
- **Limited Availability** = limited public available sizes are visible.
- **Confirmed Sold Out** = product exists and public variant data confirms no available sizes.
- **Product Found / Inventory Hidden** = product exists but public size data is hidden.
- **Lookup Unavailable** = store could not be checked reliably; this is not sold out.
- **No Product Match** = store search completed but no matching public product was found.

## Next recommended step

Move the large `app/page.tsx` into smaller view components before adding complex account or subscription features.

## V3.3 Private Beta Candidate

This build adds a Beta Launch Center with:

- Beta feedback form
- Known limitations section
- Real-world test search sheet
- Deployment checklist
- `/api/admin/beta-feedback` endpoint

Important inventory rule: **Lookup Unavailable is never treated as Sold Out.** Sold Out should only appear when the store source explicitly confirms it.

### Private Beta Checklist

1. Run the QA Center.
2. Run Store Check from Admin.
3. Run the Beta test searches.
4. Confirm product images or fallback image appear.
5. Confirm size availability labels appear only when public data supports them.
6. Export search logs after testing.
7. Capture tester notes in Beta Launch Center.



## Version 1.0 Final Foundation

This build adds the final foundation layer before scaling stores:

- Release Calendar tab
- Product Watchlists tab
- Coverage Confidence scoring
- Radar-style PWA app icons
- Notification-ready release tracking
- Beta/admin metrics for tracked products and alerts
- Public CSV search-log export route

Important reliability rule remains unchanged: failed store lookups show as **Lookup Unavailable**, never **Sold Out**.

## V1.0.1 Search + Release Calendar Fix

- Release Calendar now shows future-dated releases only.
- Already released products are hidden from the release section and remain searchable from the main search screen.
- Multi-word keyword searches preserve spaces. Queries like `black cat 4`, `military blue 4`, and `travis scott olive` are treated as phrase/token searches instead of being collapsed into one word.
- SKU-style inputs such as `hf 4198 001` still normalize correctly to `HF4198-001`.


## Keyword Search Rule

Multi-word product searches preserve spaces. For example, `black cat 4` remains `black cat 4` for store lookup. Exact SKU-style inputs like `hf 4198 001` still normalize to `HF4198-001`.

## V1.3 Seamless Reliability + Catalog Expansion

This update is intentionally low-risk and keeps the existing search, tracking, release-calendar, Railway, and PWA behavior intact.

Added:
- Expanded smart-search catalog with 30+ Nike, Jordan, Nike SB, adidas, New Balance, ASICS, and Saucony products.
- More aliases for common sneaker keywords so searches like "reverse grinch", "panda dunk", "samba", "gel kayano 14", and "black cat 4" resolve more consistently.
- Data audit API at `/api/admin/data-audit` for quick verification of catalog, release, store, and adapter readiness.
- Improved QA checks for catalog coverage and the data audit route.
- Shared coverage-confidence scoring so UI confidence and backend reliability logic stay consistent.

Preserved:
- Multi-word keywords keep their spaces and word boundaries.
- SKU-shaped spaced input such as `hf 4198 001` still normalizes to `HF4198-001`.
- Future-release-only calendar behavior remains intact.
- Lookup Unavailable is never treated as Sold Out.
- No dependency, build artifact, or Railway deployment changes were added.

## V1.6 Private Beta Final QA

This version adds a private beta readiness layer without changing core search behavior.

### Added

- Beta readiness API: `/api/admin/beta-readiness`
- Private Beta Instructions card in the Beta tab
- Store expansion readiness score
- Extra beta checklist item for readiness verification
- App version updated to `1.6.0`

### Safety rules preserved

- Multi-word keyword searches preserve spaces.
- SKU-style spaced input can still normalize correctly.
- Release Calendar only shows future release dates.
- Lookup Unavailable never means Sold Out.
- Failed store adapters cannot crash the full search.

### Suggested beta flow

1. Deploy to Railway.
2. Open the Railway URL on phone and desktop.
3. Run the Beta readiness check.
4. Run the guided Beta test sheet.
5. Run Store Check from Admin.
6. Submit feedback after each test session.
7. Export logs before making store expansion decisions.
