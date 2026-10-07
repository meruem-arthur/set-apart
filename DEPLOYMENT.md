# SET APART V2 deployment

## 1. Create the services

- Neon PostgreSQL database
- Cloudinary account with an **unsigned image upload preset** restricted to images and the folders you want to use
- Paystack business account
- Vercel project connected to this repository
- Optional Brevo account for transactional email

## 2. Environment variables

Copy `.env.example` to `.env` locally. In Vercel, add the same production variables:

- `DATABASE_URL`
- `APP_URL`
- `SESSION_SECRET`
- `PAYSTACK_SECRET_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY` (reserved for future client-side Paystack widgets)
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `BREVO_API_KEY` and `EMAIL_FROM` if email is enabled
- `STAFF_ADMIN_EMAIL`, `STAFF_ADMIN_PASSWORD`, `STAFF_ADMIN_NAME`
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_NAME`

Never expose `PAYSTACK_SECRET_KEY`, database credentials, or other server secrets as `VITE_*` variables.

## 3. Database

From the project root:

```bash
npm install
npm run db:push
npm run db:seed
```

`db:seed` creates the starter SET APART products, collections, Anime Vol. 01 drop, delivery areas, and the admin accounts supplied through the environment variables.

For a production database, review the generated SQL with `npm run db:generate` and commit the migration before relying on automatic schema push in CI.

## 4. Cloudinary

The custom tee flow uploads both:

1. the customer's original artwork
2. a generated JPEG mockup containing the selected shirt and transform

The browser uses unsigned Cloudinary uploads, so the upload preset must be deliberately locked down. Do not put your Cloudinary API secret in the browser.

## 5. Paystack

The checkout flow is:

`cart → server-side product/variant/stock validation → order → Paystack initialize → Paystack redirect → webhook/verification → payment status`

Configure the Paystack webhook to:

`https://YOUR-DOMAIN/api/paystack/webhook`

The webhook validates `x-paystack-signature` with `PAYSTACK_SECRET_KEY` and is the payment source of truth.

## 6. Vercel

Build command:

```bash
npm run build
```

The project is a TanStack Start/Vite application. Set the environment variables in Vercel before the first production build.

## 7. First production checklist

- Run `npm run db:push` against the intended Neon database.
- Run `npm run db:seed` once.
- Sign in at `/admin/login`.
- Verify a product has real variants and stock.
- Make a small Paystack test payment.
- Confirm the order appears in `/admin/orders`.
- Confirm the Paystack webhook reaches `/api/paystack/webhook`.
- Test a failed payment and verify reserved stock is restored.
- Submit a custom design and verify both artwork and mockup links appear in `/admin/designs`.
- Replace the placeholder WhatsApp/Instagram contact links in the homepage before launch.
