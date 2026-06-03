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

