# Urbanly

Urbanly is a civic issue reporting and tracking platform built with Next.js.

## Local setup

Install dependencies and create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<database-name>?retryWrites=true&w=majority
AUTH_SECRET=<generate-a-random-secret>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
```

Replace the placeholders with your Atlas connection details. URL-encode any reserved characters in the username or password. Generate an Auth.js secret with `openssl rand -base64 32` and use the output as `AUTH_SECRET`. Keep `.env.local` private; do not prefix secrets with `NEXT_PUBLIC_` or commit the file.

Local development trusts the local host automatically. For self-hosted production deployments outside Vercel, set `AUTH_TRUST_HOST=true` only when the deployment proxy controls the incoming host header; Vercel is detected automatically.

Start the development server:

```sh
npm run dev
```

With the server running, check the development-only database connectivity endpoint at [http://localhost:3000/api/dev/db-check](http://localhost:3000/api/dev/db-check). A successful check returns `{"status":"connected"}`. If configuration or connectivity is unavailable, it returns HTTP 503 with a generic troubleshooting message and does not disclose the connection string. The endpoint returns 404 outside development.

The app reads `MONGODB_URI`, `AUTH_SECRET`, and all `CLOUDINARY_*` values only on the server. Ensure your Atlas network access settings permit connections from your development machine. `AUTH_SECRET` must be configured before Auth.js can issue or verify sessions. Cloudinary values are required only for report photo uploads; without them, text-only reports remain available and upload requests return a safe configuration message.

## Authentication

Registration is available at `/register`, sign-in at `/login`, and a successful sign-in opens the protected `/dashboard`. Accounts are always created with the `citizen` role. Passwords are stored as bcrypt hashes, and the hash is excluded from ordinary User model queries. Auth.js uses JWT-backed session cookies with a seven-day lifetime. Server authorization helpers reload the current account and role from MongoDB before granting access.

To test locally, register with a name, email, and password of at least 10 characters (maximum 72 UTF-8 bytes), sign in with those credentials, verify the dashboard, and use **Sign out** to end the session.

### Temporary local password reset

For an existing account only, run the development-only utility from the repository root in an interactive terminal:

```sh
NODE_ENV=development node scripts/reset-user-password.mjs
```

It reads `MONGODB_URI` from `.env.local`, asks for the account email, and prompts for the new password twice without echoing it. It applies the same bcrypt cost factor used at registration and updates only that account's `passwordHash`; it cannot run unless `NODE_ENV` is exactly `development`. After a success message, start the app with `npm run dev` and sign in at `/login` with the email and new password. Remove the temporary script after you have recovered access.

## Implemented

- Cached MongoDB connection utility and development-only connectivity check.
- Report Mongoose model, strict report-creation and list-query Zod schemas, and paginated reports API.
- User model with normalized unique email index, Zod registration/login validation, bcrypt password hashing, and Auth.js Credentials sessions.
- Server-side authenticated-user and role-checking helpers, registration/login/logout pages and actions.
- Protected, responsive citizen dashboard with real per-user report statistics and the five most recent reports.
- Report submission at `/reports/new`, authenticated personal report history at `/reports/mine`, and the public, filterable Community Reports page at `/reports`.
- Authenticated, server-validated Cloudinary report image uploads with user-scoped folders.
- Interactive public report map at `/map`, rendered client-side with MapLibre GL JS.

### Reports API

`GET /api/reports` is a public feed. It returns report content and location but never reporter identity or account data. The `/reports` and `/map` pages consume this endpoint. The map requests `withCoordinates=true` to retrieve only reports with stored GeoJSON points. `GET /api/reports/mine` requires a signed-in user and returns only that user's reports. These endpoints accept optional `page` (default `1`), `limit` (default `20`, maximum `100`), `category`, and `status` query parameters. The public feed additionally accepts `withCoordinates=true`. The current API does not accept a search parameter; server-side search would require adding a validated query field and corresponding database filter. A successful response has this shape:

```json
{
  "reports": [],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

Each report object contains `id`, `title`, `description`, `category`, `status`, `location`, `imageUrl`, `createdAt`, and `updatedAt`.

Submit a report with `POST /api/reports` while signed in. The JSON body accepts only `title`, `description`, `category`, and `location` (`address` required; GeoJSON `type` and `[longitude, latitude]` coordinates optional as a pair). The server sets the initial `pending` status and ownership from the verified session. The response is HTTP 201 with `{ "report": <report> }`. Requests containing ownership, status, image, or other unsupported fields are rejected. API errors use `{ "error": { "code", "message", "details?" } }`.

To test report submission locally, sign in and open `/reports/new`, then submit a report using a non-production database. The form sends only validated report fields to `POST /api/reports`; `/reports/mine` displays the signed-in user's saved reports. After signing out, direct visits to both pages redirect to `/login`, and the private reports API returns 401. Build and lint commands do not create report records.

### Report photo uploads

Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env.local` from your Cloudinary account. Restart the development server after updating environment configuration. The credentials are never sent to the browser. The authenticated upload endpoint validates the image signature and a 5 MB limit, then stores JPEG, PNG, or WebP files under `urbanly/reports/<authenticated-user-id>`. Report creation accepts only HTTPS Cloudinary image URLs from the configured cloud and the signed-in user's Urbanly report folder. Do not upload private or sensitive photographs; Cloudinary delivery is public in this implementation.

For a local test, use a development Cloudinary account and non-production MongoDB database, sign in, and submit a report with a non-sensitive sample image smaller than 5 MB at `/reports/new`. Confirm the image appears on `/reports/mine`, `/reports`, and the dashboard. Try a file with an unsupported type or over the size limit to verify it is rejected. Without Cloudinary configuration, the form shows a safe upload configuration error and does not submit an image URL.

### Interactive report map and location selection

Open `/map` to browse reports that were submitted with valid latitude and longitude coordinates. The map uses MapLibre GL JS and CARTO Voyager raster tiles, centered initially on Hyderabad. Tile requests go to CARTO and require network access; no map API key is needed. MapLibre displays OpenStreetMap and CARTO attribution on the map. The map filters and paginates through `GET /api/reports` with `withCoordinates=true`, plus optional category/status filters. Reports that contain only an address are intentionally omitted rather than geocoded or assigned invented points.

On `/reports/new`, the optional location picker allows a map click or the **Use my current location** button to select coordinates. Browser location permission is requested only after the user clicks that button. The map's Hyderabad starting view is only a viewing center; it never selects or submits coordinates by itself. The address remains a separate user-provided field and is not reverse-geocoded or asserted to match the selected point. Coordinates are submitted to `POST /api/reports` as GeoJSON `location: { address, type: "Point", coordinates: [longitude, latitude] }`; omitting a selected point preserves address-only submission. Zod validates the pair and geographic ranges on the server, and the public report API returns only well-formed points for map filtering.

To test locally, use `/reports/new` to select a point by clicking the map or granting location access, submit using a non-production database, then open `/map`. Confirm the report's marker appears at the selected position and its popup details are correct. Panning/zooming and marker popups work in the browser; production tile availability is subject to CARTO's service terms and limits.

## Not implemented yet

Reverse geocoding, moderation/status transitions, and analytics remain unimplemented. Report statuses currently use `pending`, `in-progress`, and `resolved`; this milestone does not implement status-changing operations. Failed report creation after a successful photo upload can leave an unreferenced Cloudinary asset; cleanup is not yet implemented.
