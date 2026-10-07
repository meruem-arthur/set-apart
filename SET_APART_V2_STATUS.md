# SET APART V2 — build status

## Built

- SET APART storefront and responsive editorial design
- Database-backed products, product images, variants, sizes, colors and stock
- Collections and collection/product relationships
- Drops with lifecycle status
- Searchable shop and product detail pages
- Persistent browser cart using product/variant IDs
- Server-side product, price and stock validation at checkout
- Customer checkout with delivery/pickup and promo-code validation
- Paystack initialize/verify/webhook integration
- Signed Paystack webhook verification
- Payment failure stock restoration
- Customer accounts (register/login/logout)
- Wishlist persistence for signed-in customers
- Custom Tee studio with shirt color, size, quantity and artwork upload
- Client-side artwork transform controls
- Generated mockup JPEG upload to Cloudinary
- Custom design request persistence
- Admin custom-design queue with status workflow and artwork/mockup links
- Admin product creation, image upload, price editing, inventory adjustment and active/hidden state
- Admin collection management
- Admin drop management
- Admin promo-code management
- Admin order list/detail/status workflow
- Admin dashboard sales/order/design counts
- Super Admin platform overview
- Brevo transactional-email abstraction and payment confirmation hook
- `.env.example` and `DEPLOYMENT.md`

## Intentionally external

The repository does not contain your real credentials. You must supply them in `.env`/Vercel:

- Neon `DATABASE_URL`
- `SESSION_SECRET`
- Paystack secret key
- Cloudinary cloud name + unsigned upload preset
- Brevo API key/from address if email is wanted
- Admin/Super Admin bootstrap credentials
- `APP_URL`

## Verification limitation

The code was statically checked for TypeScript/TSX syntax. A full Vite production build could not be executed in this environment because the available `node_modules` is incomplete and the package registry was not reachable/cached enough to complete `npm ci`.

Before production deployment, run:

```bash
npm install
npm run build
npm run db:push
npm run db:seed
```

Then test Paystack in test mode, custom-design uploads, admin authentication, stock changes, payment webhooks and mobile checkout.
