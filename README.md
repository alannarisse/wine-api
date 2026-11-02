# Wine Finder API

NestJS API backed by PostgreSQL. It stores wine records and mappings from suggested varietals (such as `Pinot Noir`) to specific wines.

## Start the API locally

1. Start PostgreSQL and create an empty `wine_finder` database if it does not already exist:

   ```bash
   createdb wine_finder
   ```

2. Install dependencies:

   ```bash
   cd /Users/alanna/Sites/wine-and-food-pairing-ang/wine-api
   npm install
   ```

3. Create or update `.env` in this directory with your own local database credentials. Keep this file private:

   ```dotenv
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/wine_finder
   NODE_ENV=development
   PORT=3000
   CORS_ORIGIN=http://localhost:4200
   ```

   If your local PostgreSQL user has no password, use a connection URL appropriate to that setup. The API reads `DATABASE_URL`; it does not use separate host/user/password settings.

4. Configure `ADMIN_PASSWORD_HASH` using [Admin authentication setup](#admin-authentication-setup), then run the server:

   ```bash
   npm run start:dev
   ```

5. In another terminal, check the saved wines:

   ```bash
   curl --fail-with-body http://localhost:3000/api/wines
   ```

In development, TypeORM synchronizes the tables when the API starts. In production (`NODE_ENV=production`), automatic schema synchronization is disabled; the tables must already be provisioned. Do not switch a production database to development mode to create tables.

## Add a wine to the database

Use the API so the input is validated before it is saved. First create the private session header described in [Authenticated terminal requests](#authenticated-terminal-requests). These examples target your local database through the local API.

1. Save a JSON file named `new-wine.json`. Replace these illustrative values and URLs with the wine's real information:

   ```json
   {
     "wineryName": "Example Winery",
     "wineName": "Estate Pinot Noir",
     "varietal": "Pinot Noir",
     "year": 2023,
     "estimatedPrice": 32,
     "wineryCity": "Dundee",
     "wineryState": "OR",
     "ava": "Dundee Hills",
     "wineryAddress": "123 Example Road",
     "wineryUrl": "https://example.com",
     "imageUrl": "https://wine-finder-app.vercel.app/wines/wine.jpg",
     "thumbnailUrl": "https://example.com/wine-thumbnail.jpg",
     "description": "Tasting notes and a short description."
   }
   ```

   Required fields: `wineryName`, `wineName`, `varietal`, `estimatedPrice`, `wineryCity`, `wineryState`, `wineryAddress`, `wineryUrl`, `imageUrl`, and `thumbnailUrl`.

   Optional fields: `year`, `ava`, and `description`. Omit `year` for a non-vintage wine. Send the year and price as JSON numbers, and use a price of zero or greater. All three URL fields must contain valid URLs; an empty string or a relative image path will fail API validation. The API generates the `id` and timestamps.

   Images should be added to the wine-finder-app into `public/images/wines`

2. Submit the file from the directory where you saved it:

   ```bash
   curl --fail-with-body http://localhost:3000/api/wines \
     -H @"$HOME/.config/wine-finder/admin-header" \
  -H 'Content-Type: application/json' \
     --data-binary @new-wine.json
   ```

3. Note the `id` in the response. Check the record by replacing `123` with that returned ID:

   ```bash
   curl --fail-with-body http://localhost:3000/api/wines/123
   ```

Submitting the same wine again creates another record. Check the wine list before retrying a request whose result is uncertain.

## Connect the wine to a pairing suggestion

Creating a wine does **not** automatically add a recommendation mapping. Map the wine's returned ID to each applicable suggestion:

```bash
curl --fail-with-body http://localhost:3000/api/varietal-mappings \
  -H @"$HOME/.config/wine-finder/admin-header" \
  -H 'Content-Type: application/json' \
  --data '{"varietal":"Pinot Noir","wineId":123}'
```

Replace `123` with your saved wine's ID. The wine must exist first. Repeating the same mapping returns the existing mapping.

Use the exact suggestion text, including capitalization and accents, from `../wine-finder-app/src/app/services/pairing.service.ts` (the `pairingSuggestions` arrays). The API matches mapping labels exactly. A wine can have multiple mappings.

Verify the mapping and API recommendations:

```bash
curl --fail-with-body http://localhost:3000/api/varietal-mappings
curl --fail-with-body --get http://localhost:3000/api/varietal-mappings/recommendations \
  --data-urlencode 'varietals=Pinot Noir' \
  --data-urlencode 'limit=10'
```

## Edit an existing wine

Send only the fields you want to change, using the saved wine ID:

```bash
curl --fail-with-body -X PATCH http://localhost:3000/api/wines/123 \
  -H @"$HOME/.config/wine-finder/admin-header" \
  -H 'Content-Type: application/json' \
  --data '{"estimatedPrice":35,"year":2024}'
```

Then fetch `/api/wines/123` again to verify the change. Changing a wine's `varietal` does not update its separate recommendation mappings; review those too.

## Initial sample data

For a new database only, you can populate the sample wines and mappings:

```bash
npm run seed
```

The seed command opens its own database connection using `.env`; the HTTP server does not need to be running. It inserts the sample records defined in `src/seed.ts`. It does **not** check for existing wines, so rerunning it adds duplicate wines. Use the API workflow above for ongoing additions.

## Add content with the admin tool

Start this API and PostgreSQL as described above, then start the frontend in another terminal:

```bash
cd /Users/alanna/Sites/wine-and-food-pairing-ang/wine-finder-app
npm start
```

1. Open `http://localhost:4200/admin`. Use the admin password configured on the API with `ADMIN_PASSWORD_HASH`; ask Alanna for access.
2. In **Wines**, choose **Add Wine**, complete the form, and save. You can type a new varietal name. All three URL fields require valid URLs. Leave the year blank for non-vintage wines.
3. Wait for the success message. The API assigns the wine ID and saves the record to PostgreSQL. If saving fails, the dialog retains your entries and displays the error so you can correct it or retry.
4. Open **Varietal Mapping**, expand a pairing suggestion, and select your wine. This saves the recommendation mapping separately. Creating a wine alone does not map it automatically.
5. Refresh the page to confirm the wine and mapping are still present. Public recommendations use the same API-backed catalog and mappings.

Edit and delete actions also save through the API. Deleting a wine removes its mappings through the database's cascading foreign key. **Export Data** downloads a JSON snapshot of the loaded catalog and mappings; it does not export food-pairing rules or provide a database restore/import action.

The app shows loading and connection errors, with a retry action. An empty database displays an empty inventory; it does not silently substitute the old hardcoded catalog. The mapping screen includes pairing suggestion labels even if no wines have been mapped yet.

### Content sources and API configuration

- Wine records and saved mappings now come from PostgreSQL via the API. The old `src/app/data/wines.data.ts` catalog is no longer the active data source (its recommendation message is still used).
- Food categories, preparation styles, and pairing suggestions remain in `../wine-finder-app/src/app/services/pairing.service.ts`. They are not editable through the admin forms or stored in this database.
- The frontend API URL is configured in `../wine-finder-app/src/environments/environment.ts`. It currently points to `http://localhost:3000/api`. Configure the active build's environment import for a deployed API; the existing production environment file contains a placeholder and is not automatically selected by the current Angular build configuration.
- Existing hardcoded frontend wines are not automatically imported. Use the API, admin forms, or the initial seed command to populate the intended database.

### Admin authentication setup

The API now verifies the admin password and requires an expiring Bearer session token for **all POST, PATCH, PUT, and DELETE requests**, except the login endpoint. Wine listings and recommendation GETs remain public. `GET /api/auth/session` is protected too. Editing browser storage cannot grant API write access.

Before starting the API locally, generate a password hash from a new, unique password (16–1024 characters). In Bash, from the API directory:

```bash
read -r -s -p 'New admin password: ' wine_admin_password
printf '\n'
printf '%s' "$wine_admin_password" | npm run --silent auth:hash
unset wine_admin_password
```

Copy the resulting `salt:hash` value into **the API's private `.env`** as `ADMIN_PASSWORD_HASH=...`. Keep the plaintext password in your password manager. The helper reads stdin so the plaintext does not appear in command arguments. The API refuses to start if the hash is missing or malformed; there is no default or frontend password. The seed command also loads the app configuration and needs this variable.

For Railway, set the same variable name in the **API service's Variables** (use a separate production password/hash if desired), then deploy/restart the API and deploy the updated frontend. Do not set it on the frontend or expose it through client build variables. No new database tables or schema migration are required by this authentication change. These instructions do not set your live Railway variables or deploy anything automatically.

The admin form sends the password to `POST /api/auth/login`. On success it keeps the returned token in this tab's `sessionStorage`, checks it with the server when opening `/admin`, and includes it in requests to the configured API only. Sessions expire after eight hours. Logout calls `POST /api/auth/logout` to revoke the session, then clears browser storage. If that request cannot reach the server, the browser login is cleared but the server token remains valid until expiry/restart; the UI reports this.

Sessions and login-attempt limits live in API memory. Restarting/deploying the API invalidates all sessions. **Run one API replica with this implementation**; multiple replicas need a shared session/rate-limit store before scaling. Login is limited to five attempts per network peer per 15 minutes (successful login resets the counter). Forwarded IP headers are not trusted; behind Railway's proxy, callers may share a rate-limit bucket. This favors protecting the login endpoint over trusting spoofable client headers.

Use HTTPS for a deployed frontend and API. Tokens in browser storage are accessible to scripts on the frontend origin; do not share them or paste them in issue reports. Changing the hash and restarting invalidates the old password and sessions. CORS remains limited by `CORS_ORIGIN`; CORS is not the authorization mechanism. The global API guard checks sessions on writes using Nest's [global guard pattern](https://docs.nestjs.com/guards#binding-guards).

#### Authenticated terminal requests

The write examples in this README use a private header file. To create it, run this Python snippet locally, enter the API base URL (including `/api`), and enter your admin password at the hidden prompt. It saves a short-lived session token rather than the password:

```bash
python3 - <<'PY'
import getpass, json, os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
# Python source comes from stdin, so read the URL from the terminal.
with open('/dev/tty', 'r+') as tty:
    tty.write('API base URL [http://localhost:3000/api]: ')
    tty.flush()
    api = tty.readline().strip() or 'http://localhost:3000/api'
parsed = urlparse(api)
if parsed.scheme != 'https' and not (parsed.scheme == 'http' and parsed.hostname in ('localhost', '127.0.0.1')):
    raise SystemExit('Use HTTPS for a remote API')
body = json.dumps({'password': getpass.getpass('Admin password: ')}).encode()
req = Request(api.rstrip('/') + '/auth/login', data=body, headers={'Content-Type': 'application/json'})
with urlopen(req, timeout=15) as response:
    token = json.load(response)['token']
folder = Path.home() / '.config/wine-finder'
folder.mkdir(parents=True, exist_ok=True)
folder.chmod(0o700)
header = folder / 'admin-header'
fd = os.open(header, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as out:
    out.write('Authorization: Bearer ' + token + '\n')
header.chmod(0o600)
print('Saved private session header. It expires within eight hours.')
PY
```

Log in to the **same API environment** used by your subsequent curl requests. A local session does not authorize Railway writes. Run the snippet again after expiry or an API restart. A `401` on a write means you must authenticate again; a `429` on login means wait for the attempt window to expire. Successful requests never require sending your plaintext password as a header.

When finished with terminal administration, revoke that token and remove its local file:

```bash
curl --fail-with-body -X POST https://YOUR-API-DOMAIN/api/auth/logout \
  -H @"$HOME/.config/wine-finder/admin-header"
rm "$HOME/.config/wine-finder/admin-header"
```

Use `http://localhost:3000/api/auth/logout` for a local session. Logging out of the browser revokes that browser's token, not a separately issued terminal token.

## New varietals, food options, and database fields

Choose the workflow that matches the change:

| Change | Where to change it | What to deploy or transfer |
| --- | --- | --- |
| New wine varietal name, such as `Fiano` | Type it in the admin wine form's **Varietal** field; suggestions are not a fixed list | Save against the intended API/database; no schema migration |
| Change a value in an existing wine field | Edit in admin, or `PATCH /api/wines/:id` | A database write; no code deployment |
| Map a wine to an existing pairing suggestion | Admin **Varietal Mapping** tab | A database write |
| New food category, preparation, or suggestion label | Frontend `src/app/services/pairing.service.ts` | Deploy frontend code, then save wine mappings to the target database |
| Entirely new field, such as alcohol percentage | Backend entity/DTO, frontend model/form, and SQL schema migration | Apply database migration and deploy the corresponding code |

There is no separate `varietals` table or enum. `wines.varietal` and `varietal_mappings.varietal` are strings. A new name does not require changing a dropdown definition, altering a PostgreSQL column, or rerunning the seed script.

### New suggestion or food option

In `../wine-finder-app/src/app/services/pairing.service.ts`, add a record to `pairingsData` with a unique `id`, a `category`, `subCategory`, `foodArray`, `pairingStyle`, and `pairingSuggestions`. Follow the shape of a neighboring record. Categories are derived from those records automatically. To extend an existing preparation's suggestions, edit its `pairingSuggestions` array instead.

Example of a new record (choose an unused ID):

```typescript
{
  id: 1001,
  category: 'vegetarian',
  subCategory: 'lemon and herb vegetables',
  foodArray: ['Roasted vegetables with lemon'],
  pairingStyle: 'Fresh whites with good acidity',
  pairingSuggestions: ['Fiano', 'Vermentino']
}
```

Build and deploy the frontend, then add the wines and map them to these exact labels in admin. The mapping screen derives labels from the pairing service, so the new labels appear after the frontend update. Creating a mapping alone does not add a food option or change the suggestions a preparation returns.

### Entirely new database field

For example, to introduce an optional `alcoholPercentage` field:

1. Add it to `src/wines/entities/wine.entity.ts`, with an explicit database type and nullable status. Example:

   ```typescript
   @Column('double precision', { nullable: true })
   alcoholPercentage: number | null;
   ```

2. Add validation to `src/wines/dto/create-wine.dto.ts`, importing `Max` alongside the existing validators:

   ```typescript
   @IsOptional()
   @IsNumber()
   @Min(0)
   @Max(100)
   alcoholPercentage?: number | null;
   ```

   `UpdateWineDto` extends `PartialType(CreateWineDto)`, so it inherits this field. Without the DTO change, the API's validation whitelist strips the new property.

3. Update the frontend `src/app/models/wine.model.ts` with `alcoholPercentage?: number | null`. Add a form control and input in `components/wine-form-dialog/`, validation, numeric conversion on submit, and any display in the detail dialog. Adding only a database column will not add an admin input.
4. Create a reviewed, versioned SQL file, for example `db/migrations/2026-11-02-add-alcohol-percentage.sql` in the API repo:

   ```sql
   ALTER TABLE public.wines
     ADD COLUMN "alcoholPercentage" double precision;
   ```

   This is an example for a future change; the column and file have **not** been added by this documentation update. Keep identifiers in double quotes when they contain capitals. Start with a nullable column so existing rows and the previous app version remain compatible. Backfill values separately before considering a required constraint.
5. Test the SQL against a disposable database with the previous schema, then test the updated API/form. Development `synchronize` can add columns before your SQL runs, so do not use an already auto-synchronized database to prove a migration works. Do not use `IF NOT EXISTS` to hide an unexpected schema mismatch; inspect the existing column first.
6. Back up Railway, apply the tested SQL once to the correct environment, then deploy the new API and frontend. For this additive example, applying the column first keeps the currently running API compatible. Renames, deletions, and required columns need a separate compatibility/backfill plan.

This repo currently has **no TypeORM CLI DataSource, migration runner/scripts, or migration history configured**. The `TypeOrmModule` configuration in `app.module.ts` is not a CLI DataSource. There is no working `npm run migration:run` command to invoke today. The manual SQL workflow below works without pretending that migration tooling already exists. Keep a record of the filename, date, and target environment when applying each migration. For repeated schema work, add a real migration runner and history table before automating deployment.

## Move new content to Railway

**Deploying code does not copy your local PostgreSQL data.** Local `.env` selects the local database; Railway's API service variables select Railway's database. Admin saves go to whichever API the frontend is configured to call.

### 1. Check the destination

In the Railway dashboard, select the intended project and environment, then inspect the API and PostgreSQL services:

- The API service's `DATABASE_URL` must reference the intended PostgreSQL service (for example, `${{Postgres.DATABASE_URL}}`, using the actual service name).
- Use `NODE_ENV=production`; schema synchronization is disabled in production.
- Set `CORS_ORIGIN` to the exact frontend origin, without a path or trailing slash.
- Configure the frontend's active `environment.ts` import/build replacement to call the Railway API's public HTTPS domain plus `/api`. The current Angular configuration does not automatically select `environment.prod.ts`.
- Check the API service's source/root directory and build/start settings. `railway.json` currently specifies `npm run start:prod`, with no pre-deploy migration step.

For direct PostgreSQL access **from your Mac**, use the database service's external TCP proxy details from its Connect panel / `DATABASE_PUBLIC_URL`. Railway's internal hostname is for services inside its private network. Never commit connection URLs, passwords, dumps, or populated export files. The instructions here do not verify your live Railway account configuration. [Railway PostgreSQL connections](https://docs.railway.com/databases/postgresql#connecting-externally).

### 2. Choose how to transfer the content

**For ongoing additions to an existing Railway database:** use the admin frontend configured for the Railway API. Add the wine there and save its mappings there. This creates the content directly in Railway; no local-to-remote database transfer is necessary. Refresh and verify the saved content. Log in with the password configured on that Railway API; local sessions do not authorize remote writes.

**If you already entered a few wines locally:** use **Export Data** as a reference, then recreate only the new records through the Railway admin or API. The JSON export is not an import file, and no bulk merge/import command currently exists. For an API transfer, save one wine's fields into `new-wine.json`, removing `id`, `createdAt`, and `updatedAt`, and replace any `localhost` image URLs with deployed URLs. Then:

```bash
# Replace the example domain with your Railway API's public domain.
curl --fail-with-body https://YOUR-API-DOMAIN/api/wines \
  -H @"$HOME/.config/wine-finder/admin-header" \
  -H 'Content-Type: application/json' \
  --data-binary @new-wine.json
```

Record the returned **Railway wine ID**. Create mappings using that returned ID and the exact suggestion label:

```bash
curl --fail-with-body https://YOUR-API-DOMAIN/api/varietal-mappings \
  -H @"$HOME/.config/wine-finder/admin-header" \
  -H 'Content-Type: application/json' \
  --data '{"varietal":"Fiano","wineId":123}'
```

Here `123` must be replaced by the returned Railway ID. Local IDs and Railway IDs can refer to different wines. Before posting, check Railway's existing catalog for the winery, wine name, vintage, and varietal to avoid duplicate records. To modify an existing Railway wine, use its Railway ID with `PATCH`, rather than posting it again. Do not run the seed command as an incremental migration; it duplicates wines.

**For a first-time transfer of the entire local database:** use the backup/restore procedure below only when the destination contains no application tables. It preserves wine IDs, mappings, and sequences together. It is not an incremental merge into an existing Railway catalog.

### 3. Back up Railway and connect without putting passwords in commands

Install PostgreSQL client tools (`psql`, `pg_dump`, `pg_restore`) compatible with your source and destination versions. Use a `pg_dump` client at least as new as the source server; prefer matching server major versions for a first transfer, and use a matching `pg_restore` client for the archive. Restoring into an older server version is not guaranteed to work.

Create a private backup folder outside the repositories. Replace the example path and Railway connection placeholders below. Commands use `--password` to prompt interactively; do not paste the password into shell history. The host, port, user, and database come from Railway's **external** connection details.

```bash
mkdir -p ~/wine-finder-backups
chmod 700 ~/wine-finder-backups

psql "host=YOUR_PROXY_HOST port=YOUR_PROXY_PORT user=YOUR_DB_USER dbname=YOUR_DB_NAME sslmode=require" \
  --password -c 'SELECT current_database(), current_user, version();'

pg_dump "host=YOUR_PROXY_HOST port=YOUR_PROXY_PORT user=YOUR_DB_USER dbname=YOUR_DB_NAME sslmode=require" \
  --password --format=custom \
  --file="$HOME/wine-finder-backups/railway-before-change-YYYYMMDD-HHMM.dump"
```

Use a fresh timestamp in the filename each time. Stop if the backup fails. List the archive to check that it is readable; test a restore into a disposable database before relying on it for recovery:

```bash
pg_restore --list "$HOME/wine-finder-backups/railway-before-change-YYYYMMDD-HHMM.dump"
```

### 4A. Apply a reviewed schema change to an existing Railway database

Only use this after creating and testing the SQL migration described above, and confirming the backup and target environment. Pause competing schema changes. From the API repo:

```bash
psql "host=YOUR_PROXY_HOST port=YOUR_PROXY_PORT user=YOUR_DB_USER dbname=YOUR_DB_NAME sslmode=require" \
  --password --set=ON_ERROR_STOP=1 --single-transaction \
  --file=db/migrations/2026-11-02-add-alcohol-percentage.sql
```

The example SQL file does not exist yet; create it as part of the actual field change. Do not apply it a second time. `--single-transaction` is appropriate for this example's `ALTER TABLE`; some other PostgreSQL operations cannot run inside a transaction and need a different plan. Verify the column with `\d public.wines` in `psql`, record the migration, and deploy the corresponding code through your configured Railway source/deploy workflow.

Railway supports pre-deploy commands, and a failing command blocks the deployment. Once a migration runner is implemented, that is a suitable place for its compiled migration command. Do not configure the non-idempotent seed command or an untracked one-time `ALTER TABLE` as a recurring pre-deploy command. [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).

### 4B. First-time full transfer into an empty Railway database

Pause API writes during the cutover. Stop the local API before exporting if you want to prevent further local edits. Confirm that the target has no application tables:

```bash
psql "host=YOUR_PROXY_HOST port=YOUR_PROXY_PORT user=YOUR_DB_USER dbname=YOUR_DB_NAME sslmode=require" \
  --password -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

If `wines`, `varietal_mappings`, or other application tables exist, stop and use the incremental admin/API workflow. Empty tables still count as existing tables; this full restore would conflict with them.

Export the local database (adjust the local user/connection if your `.env` uses a different one):

```bash
pg_dump --dbname=wine_finder --format=custom \
  --file="$HOME/wine-finder-backups/local-to-railway-YYYYMMDD-HHMM.dump"

pg_restore --list "$HOME/wine-finder-backups/local-to-railway-YYYYMMDD-HHMM.dump"
```

Restore both schema and data into the confirmed empty destination:

```bash
pg_restore \
  --dbname="host=YOUR_PROXY_HOST port=YOUR_PROXY_PORT user=YOUR_DB_USER dbname=YOUR_DB_NAME sslmode=require" \
  --password --no-owner --no-privileges --single-transaction \
  "$HOME/wine-finder-backups/local-to-railway-YYYYMMDD-HHMM.dump"
```

This command does not drop existing tables. Its single transaction rolls back the restore if an error occurs. Do not add `--clean`, `--create`, or `--data-only` to force it into a populated database. A data-only restore is not a merge and can collide with IDs or attach mappings to the wrong records. [PostgreSQL restore options](https://www.postgresql.org/docs/current/app-pgrestore.html).

### 5. Verify the release

- Check Railway API deployment logs and fetch `/api/wines` and `/api/varietal-mappings` from its public API domain.
- For a full transfer, compare wine/mapping counts with the local source. Inspect a few actual records and their mappings, not only the counts.
- Open the deployed admin, refresh, and confirm the new wine and mappings. Test a relevant food/preparation choice on the public page and open a recommended wine's details.
- Confirm image URLs load from the deployed frontend. `public/images/wines/bottle.jpg` is served at `https://YOUR-FRONTEND-DOMAIN/images/wines/bottle.jpg`; the API stores the URL, not the image file. Deploy images with the frontend.
- Resume writes after verification. Keep the pre-change backup. If verification fails, stop further writes and assess the migration/data change before restoring anything; restoring an older backup over live data can discard subsequent edits.

## Build and tests

```bash
npm run build
npm test
npm run test:e2e
```

The data-entry instructions above were checked against the controllers, DTOs, services, seed script, and frontend implementation. Writing documentation does not require running the seed script or changing database records.
