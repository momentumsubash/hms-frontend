# Session Progress

## Goal
- Production smoke test with CI/CD: rewrite Cypress test to cover full business flows (both roles, both viewports), add API reset endpoint with multi-level safeguards, add GitHub Actions CI workflow, deploy via git push.

## Constraints & Preferences
- Only momentum hotel data is reset; other hotels untouched — multi-level verification enforced at API and script level
- Reset via `POST /api/admin/reset-test-data` (API endpoint) or `HMS-API/scripts/reset-momentum-data.js` (local script)
- Smoke test must always pass regardless of pushes/hotfixes
- Uses `manager@momentum.com` / `Manager@123` (org admin) and `reception@momentum.com` / `Staff@123` (staff)
- Base URL: frontend `http://localhost:30006`, API `http://localhost:30005`; Production: `https://digitalhms-momentum.vercel.app` / `https://hms-api-eight.vercel.app`
- Separate repos: `github.com/momentumsubash/hms-frontend` and `github.com/momentumsubash/HMS-API`
- Preview deploy + test then merge CI strategy — only merge to main after smoke test passes

## Progress
### Done

#### Backend — Seeder, Scraper, API
- Created `scripts/seedWebsiteContent.js` with rich hotel-specific content (amenities, rooms, testimonials, experiences, hero text, footer) for all 5 hotels (Mirana, Diyana, Junction, Janaki, Momentum) plus a default fallback
- Added npm scripts `seed:website`, `seed:website:all`, and `scrape:hotel` to `package.json`
- Added `amenitiesDetailed` and `contactInfo` to the `ensureWebsite()` function in `routes/hotels.js` public domain endpoint
- Added `images` array, `heroImage`, `rooms[].image`, and `experiences[].image` to all hotel content entries using existing PNG files from `hms-frontend/public/`
- Created `scripts/scrapeHotelData.js`: scrapes hotel images and data from listing URLs (Agoda, OYO, etc.) with multiple fallback strategies (cheerio static HTML, OYO ID via `--oyo`, web search, Puppeteer headless browser)
- Installed `cheerio` and `puppeteer` dependencies for scraping
- **Fixed Puppeteer Agoda scraping**: removed `image` from blocked resource types (was preventing JS gallery from rendering hotel `<img>` tags); added frame re-attach logic for Agoda client-side redirect; switched from `page.content()` + cheerio to `page.evaluate()` for rendered DOM extraction; disabled only non-essential resources (`font`, `media`, `manifest`, `texttrack`, `other`)

#### Backend — Amenity Persistence Fix
- **Mongoose schema fix** (`models/Hotel.js`): Added `image` field to `amenitiesDetailed` sub-schema; added `galleryImages: [{ type: String }]` to website sub-document
- **PUT /:id/website processing** (`routes/hotels.js`): Added `amenitiesDetailed` processing block that maps frontend `name` → schema `title`, sets defaults for all fields (icon, description, image, isActive)
- **PUT /:id/website merge**: Added `amenitiesDetailed` and `galleryImages` to the explicit `hotel.website = { ... }` merge so they're reliably persisted (not just relying on spread)
- **`ensureWebsite()`**: Added `galleryImages` to the localhost return object

#### Backend — Domain Matching Improvement
- **Production domain lookup** (`routes/hotels.js`): Improved name-matching fallback:
  - Filters out generic domain parts (`digitalhms`, `vercel`, `app`, `www`, `com`, etc.) before matching
  - Tries `$and` first (all specific parts must match) for precise results
  - Falls back to `$or` if `$and` finds nothing
  - For Momentum: seeded `whitelistedDomains: ['digitalhms-momentum.vercel.app']` so exact match (step 1) works immediately

#### Seeder — Domain Registration
- Added `whitelistedDomains` to Momentum content entry in `seedWebsiteContent.js`
- Added conditional `whitelistedDomains` to `updateData` in save loop
- Re-seeded Momentum to register its Vercel domain

#### Frontend — Home Page Components & Fixes
- **Hero section**: Conditional rendering (`heroImage || hotel.images?.[0] ? background-image : gradient`) instead of relying on `getImageUrl()` default
- **Amenities grid**: flexbox wrap instead of CSS grid to avoid empty slots for any item count
- **Room placeholders**: fallback UI when no rooms or images
- **Dynamic CTA and footer**: reads from website content, falls back to defaults
- **Icon fallback** (`home/page.jsx:567`): `lucideIcons[icon] || Star` — renders Star when icon name doesn't match any Lucide icon
- **GalleryCarousel** (`home/page.jsx`): completely rewritten with:
  - Dual view modes: **Carousel** with smooth crossfade transitions + **Grid** with masonry-style layout
  - Thumbnail strip below main image with active highlight + scroll
  - Fullscreen lightbox with dark overlay, prev/next, dots, counter, close button
  - Image counter pill (e.g., `3 / 12`)
  - Touch swipe support (50px threshold)
  - Keyboard navigation (ArrowLeft, ArrowRight, Escape)
  - Auto-advance (5s) pauses when fullscreen is open
  - Image load tracking with skeleton placeholders
  - Glassmorphism nav buttons (hidden until hover, blur backdrop)
  - Decorative blur orbs matching hero section design language
  - Section badge ("Gallery") with gradient border consistent with page styling
  - Grid view: responsive 2-4 columns, first image spans 2x2, hover zoom + expand icon, per-image staggered fade-in animation
  - Mobile: compact dot indicators, counter in top-right corner, grid view toggle at bottom

#### Frontend — Auth & Checkout Fixes
- **Login fix**: Added `refreshUser()` to `AuthProvider` context; login page calls `await refreshUser()` after saving token so `user` state is populated before `router.push("/dashboard")`
- **Checkout bill printing fix**: Added `@page { size: A4 | A5 | 57mm 297mm }` CSS to each print style; persisted `paperType` to localStorage via lazy init + `useEffect`

#### Frontend — Edit Hotel Modal Restructure
- Converted from single-column to 3-tab layout (Basic Info, Images, Website Content) using `<Tabs>` component
- **Added Website Content tab** with inline editing for: Hero section (title, subtitle), Section Descriptions (about, amenities, experiences, testimonials), Rooms (add/remove/edit with image/price/features/active), Detailed Amenities (add/remove/edit with icon/description/image/active), Testimonials (add/remove/edit with rating/image/active toggle), Experiences (add/remove/edit with image/active), Contact Info (phone, email, address, reception, website), SEO (title, description, keywords)
- **Added Gallery picker**: toggle selection from uploaded hotel images with visual checkmarks
- Single "Update Hotel" button saves both `updateHotel` (basic fields) AND `updateHotelWebsite` (website content + SEO + gallery)

#### Frontend — Visual Image Picker Component
- Created `ImagePicker` component inline in `hotels/page.tsx`:
  - Shows a **preview** of the currently selected image with hover-to-remove X button
  - Opens a **grid of rendered thumbnails** from uploaded hotel images (4-6 columns)
  - Highlights the selected thumbnail with primary border + ring + checkmark overlay
  - Clicking the same image **deselects** it (toggle behavior)
  - Falls back to a **URL text input** for pasting external URLs
  - Empty state message: "No uploaded images. Upload in the Images tab first."
- Replaced all image URL text inputs with `ImagePicker`:
  - Hero Image
  - Room images
  - Amenity images
  - Testimonial images (Guest Photo)
  - Experience images

#### Frontend — Amenity Icon Select Dropdown
- Replaced the free-text `<Input>` for `amenity.icon` with a `<Select>` dropdown
- Contains 32 curated amenity-relevant Lucide icons with visual previews:
  - Star (default), Wifi, Coffee, Dumbbell, Car, Shield, Clock, UtensilsCrossed
  - BedDouble, Bath, Tv, Snowflake (AC), Waves (Pool), Wind (Fan), Mountain, TreePine
  - Monitor (Business), Users (Meeting), Bell, ShoppingBag, Heart (Romance), Sparkles
  - MapPin, Phone, Mail, Globe, Compass (Tours), Palette (Art), Zap (Power), Droplets, Sun, Music, Camera
- Each option renders the actual Lucide icon inline + human-readable label
- Defaults to `Star` when no icon is set

#### Frontend — Type System
- Added `amenitiesDetailed`, `experiences`, `galleryImages` to `WebsiteContent` interface
- Updated `ensureWebsiteDefaults()` and fallback state in `WebsiteContentManager.tsx` and `hotels/page.tsx`
- Frontend helper `amenityName(a) => a.name || a.title` bridges schema mismatch

### In Progress
- (none)

### Completed This Session (2026-06-28)
- **Comprehensive smoke test** (`HMS-CYPRESS/cypress/e2e/smoke.cy.js`): rewritten with 4 suites covering full business flows:
  - Org Admin Desktop (14 tests): login, referrer, guest A (single room + advance), guest B (multi-room + discount), 3 items → order → delete 1 via UI → 2 remain, KOT flow (pending→preparing→ready→served), complete order, billing breakdown, partial checkout (pay less → due), full checkout via UI, 2-installment due payment, stats, expenditure, record book
  - Staff Desktop (3 tests): login, create guest via UI, view kitchen
  - Org Admin Mobile (9 tests): same full flow at 375×667 viewport
  - Staff Mobile (3 tests): staff login, guest creation, kitchen view
- **Added missing `data-cy` attributes**: `dues-search` on mobile dues page (`dues/page.tsx:196`), `checkouts-search` on mobile checkouts page (`checkouts/page.tsx:710`)
- **API reset endpoint** (`HMS-API/routes/admin.js`): `POST /api/admin/reset-test-data` with 5-level verification:
  1. Auth middleware (authenticated user)
  2. Role check (manager/super_admin)
  3. Email domain check (must be `@momentum.com`)
  4. Hotel name check (must contain "momentum")
  5. Explicit body confirmation (`confirm: "RESET_MOMENTUM_DATA"`)
- **Reset script updated** (`HMS-API/scripts/reset-momentum-data.js`): reads `API_URL` and `MONGODB_URI` from env vars; added same 3-level safeguards (email domain, hotel name, `MOMENTUM_RESET_CONFIRM=yes`/`--force`)
- **Cypress config** (`HMS-CYPRESS/cypress.config.js`): `testIsolation: false`, production scripts added
- **NPM scripts** (`HMS-CYPRESS/package.json`): `test:local`, `test:production` (runs against `digitalhms-momentum.vercel.app` with `apiUrl=https://hms-api-eight.vercel.app`), `test:production:open`
- **GitHub Actions CI workflow** (`.github/workflows/smoke-test.yml`): runs on PR→main and push→main; builds frontend, starts dev server, runs full smoke test against production API; uploads screenshots/videos/report on failure
- **Server.js** (`HMS-API/server.js`): mounted `/api/admin` routes

### Blocked
- (none)

## Key Decisions
- **Gallery placement**: Right after Hero, before About — luxury hotel standard (Aman, Six Senses pattern)
- **Dynamic amenities layout**: `flex-wrap` with fixed-width cards to avoid empty slots for any item count
- **Hero fallback**: Conditional rendering instead of `getImageUrl()` default to avoid broken images
- **Login fix via refreshUser**: Explicit refresh populates `user` state in already-mounted AuthProvider
- **Scraper fallback chain**: Primary URL → OYO ID lookup → Web search → Puppeteer headless browser
- **Puppeteer resource blocking**: Only block `font`, `media`, `manifest`, `texttrack`, `other` — keep `stylesheet`, `script`, `image` to allow Agoda JS gallery to render
- **Frame re-attach for Agoda**: Agoda's client-side redirect detaches Puppeteer frame; re-acquire from `browser.pages()` after `networkidle0`
- **Single-save Edit modal**: One button saves basic fields AND website content — no separate save actions
- **Crossfade transitions**: `opacity + scale` with `transition-all duration-700 ease-out` on absolute-positioned slides
- **Gallery dual view**: Carousel (default) for browsing + Grid for overview scanning
- **Grid first-item span**: First image spans 2 cols / 2 rows on md+
- **Thumbnails**: Active thumbnail gets `scale-105` + `ring-2 ring-primary/30`
- **Fullscreen lightbox**: `object-contain` to show full image without cropping
- **Amenity name persistence**: Backend maps `name → title` before saving (frontend sends `name`, schema uses `title`)
- **Amenity icon selector**: `<Select>` dropdown with inline Lucide icon previews — prevents typos in icon names
- **ImagePicker**: Shows uploaded image thumbnails, click to select/deselect, visual checkmark + ring on selected, URL input as fallback
- **Domain matching priority**: Exact match (`domain`, `customDomains`, `whitelistedDomains`) → `$and` on specific name parts → `$or` on specific name parts
- **Domain name parts**: Generic words (digitalhms, vercel, app, www, com, etc.) are filtered out before matching

## Next Steps
1. Init git in both repos, commit changes, and push to main
2. Verify Vercel auto-deploys from main branch
3. Run `npm run test:production` against production URL
4. If tests pass, CI/CD is ready — create a PR to validate the GitHub Actions workflow
5. Set up GitHub repo secrets for CI if needed

## Critical Context
- The `before` block in `smoke.cy.js` calls `POST /api/admin/reset-test-data` with `{ confirm: "RESET_MOMENTUM_DATA" }` — this is the preferred reset method over the local script
- Reset only affects the authenticated user's hotel if AND ONLY IF all 5 verification levels pass
- The local reset script (`reset-momentum-data.js`) now requires `MOMENTUM_RESET_CONFIRM=yes` or `--force` flag
- Test data is ephemeral: guests, orders, checkouts, dues, expenditures, referrers, printers, room stats, item stats, daily stats — items and rooms are preserved
- API server is up on port 30005; production API at `https://hms-api-eight.vercel.app`
- Frontend production URL: `https://digitalhms-momentum.vercel.app`
- GitHub repos: `github.com/momentumsubash/hms-frontend` and `github.com/momentumsubash/HMS-API`
- CI strategy: PR → GitHub Actions builds frontend + runs smoke test against production API → if passes, merge to main → Vercel auto-deploys

## Relevant Files
- `HMS-API/routes/admin.js` — POST /api/admin/reset-test-data with 5-level verification
- `HMS-API/scripts/reset-momentum-data.js` — local reset script with env vars + safeguards
- `HMS-API/server.js` — mounts `/api/admin` routes
- `hms-frontend/HMS-CYPRESS/cypress/e2e/smoke.cy.js` — comprehensive smoke test (689 lines, 4 suites)
- `hms-frontend/HMS-CYPRESS/cypress.config.js` — config with `testIsolation: false`, env vars
- `hms-frontend/HMS-CYPRESS/package.json` — scripts: `test:local`, `test:production`, `test:production:open`
- `hms-frontend/.github/workflows/smoke-test.yml` — GitHub Actions CI: build → smoke test → report
- `hms-frontend/src/app/dues/page.tsx:196` — added `data-cy="dues-search"` for mobile
- `hms-frontend/src/app/checkouts/page.tsx:710` — added `data-cy="checkouts-search"` for mobile
- `hms-frontend/progress.md` — session progress tracking

---

## Complete Feature History (All Sessions)

### Core Backend Infrastructure
- **Express API server** with CORS, Helmet, Morgan, rate limiting (3 tiers: public/auth/upload), Swagger docs at `/api-docs`
- **MongoDB connection** with retry logic (3 attempts), exponential backoff, connection caching for serverless, configurable pool sizing (5-10)
- **Health endpoints**: `GET /health`, `GET /health/detailed`, `GET /ready` with DB ping, memory stats, uptime
- **Memory monitoring**: automatic 30s interval monitoring, GC health checks (warning 70%/critical 85%/emergency 95%), trend analysis, manual optimization endpoint `POST /memory/optimize`
- **Rate limiting**: configurable windows per tier (public 2000/15min, auth 50000/15min, upload 100/hr), IP-based via X-Forwarded-For
- **Serverless deployment**: Netlify (`serverless-http` + `netlify.toml`) and Vercel (custom handler via `vercel.json`)

### Auth & User Management
- **JWT authentication** with bcrypt password hashing, 24h token expiry
- **Role-based access control**: `staff`, `manager`, `super_admin` roles with fine-grained permissions via `authorize()` middleware
- **Hotel-scoped access**: `checkOwnership` middleware ensures users only access their hotel's data
- **User CRUD**: create, update, deactivate/reactivate users, lastLogin tracking
- **Password management**: change password, forgot password with reset token, email delivery
- **Superadmin bootstrap script** — `scripts/bootstrapSuperadmin.js`

### Guest Management
- **Full CRUD**: create, read, update guest profiles with room assignment
- **Advanced search**: by phone, email, name via `GET /guests/search`
- **Phone-based check-in**: `GET /guests/phone/:phone` finds existing guest by phone for quick check-in
- **Status filters**: checked-in, checked-out, with dues, existing customer
- **Auto checkout generation**: room assignment auto-creates checkout record for billing
- **Stay extension**: extend check-out dates via `PUT /guests/:id/extend`
- **Payment recording**: advance payments and due payment transactions
- **Additional guests**: track extra guests per room with name, gender, relationship

### Room Management
- **Full CRUD**: create, update, delete rooms with all metadata
- **Availability tracking**: `GET /rooms/available` for check-in, `GET /rooms/occupied` for current occupants
- **Maintenance management**: `GET /rooms/maintenance`, toggle via update
- **Bulk operations**: `PUT /rooms/bulk-update` for batch rate/type changes
- **Room stats**: revenue tracking per room with `RoomStats` model

### Menu & Items Management
- **Item CRUD**: name, description, price, cost price, category, stock, availability toggle
- **Category CRUD**: categorized menu (food, beverage, service, amenity)
- **Bulk operations**: `POST /items/bulk` for batch create/update
- **Stock tracking**: per-item stock count, availability management
- **Item popularity**: tracking with `isPopular`, `hasSpecialOffer`, `preparationTime`
- **Item stats**: sales data per item with `ItemStats` model (quantity sold, revenue, order count)

### Orders & KOT (Kitchen Order Ticket)
- **Order CRUD**: create with items/quantities, status management (pending→preparing→ready→served→cancelled)
- **Per-room ordering**: `GET /orders/room/:roomNumber` for room-specific orders
- **KOT printing**: `POST /kot/print` with thermal/standard formatting, auto-detection
- **Multi-method printing**: PowerShell Out-Printer, Start-Process, cmd.exe, raw TCP, node-printer
- **Print fallback**: saves to `printed_kots/` directory if all print methods fail
- **KOT reprint**: `POST /kot/reprint` for re-issuing tickets
- **Kitchen display**: KOT status tracking with timestamps, print status indicators
- **Order-to-checkout integration**: orders linked to checkout for billing

### Checkout & Billing
- **Complete checkout workflow**: room charges + order charges + extra charges + VAT (13%)
- **Discount system**: room discount, order discount with discount notes
- **Payment methods**: cash, online, cheque with payment tracking
- **Due management**: partial payment creates dues, due payment recording with transaction history
- **VAT billing**: client VAT info (number, company, address), hotel VAT info on bills
- **Printable bills**: `@page` CSS with configurable paper sizes (A4, A5, 57mm thermal)
- **Checkout history**: paginated, filterable by status, date range, phone
- **Today's checkouts**: quick view of current day's checkouts

### Hotels & Configuration
- **Hotel CRUD**: multi-hotel management from single instance
- **Image uploads**: logo, gallery, images arrays via multer → Vercel Blob or local storage
- **Printer management**: register/test/remove printers per hotel (network, USB, system, serial)
- **Default printer**: set per-category default printer for KOT printing
- **License management**: expiry tracking, license document upload
- **Notification settings**: daily report configuration (time, recipients), license expiry alerts
- **Hotel notes**: internal notes with author tracking
- **Domain management**: whitelisted domains, custom domains for multi-tenant routing

### Website Content Management
- **Hero section**: title, subtitle, hero image with gradient fallback
- **About section**: rich description text
- **Room showcase**: website rooms with title, description, price, features, image, active toggle
- **Detailed amenities**: icon (32 Lucide icons), title, description, image, active toggle
- **Experiences**: title, description, image, active toggle
- **Testimonials**: name, comment, rating, date, image, location, review, active toggle
- **Gallery**: carousel with crossfade/thumbnails/lightbox/swipe/keyboard/grid-toggle views
- **Contact info**: phone, email, address, reception, website
- **SEO**: meta title, meta description, keywords, OG image
- **Public domain endpoint**: `GET /hotels/public/domain?domain=...` with exact→`$and`→`$or` matching

### Expenditure & Finance
- **Expenditure CRUD**: amount, description, category (maintenance/utilities/supplies/salary/marketing/other)
- **Approval workflow**: pending→approved/rejected with approver tracking and rejection reason
- **Inventory integration**: expenditure can add inventory items
- **Expenditure stats**: aggregated by category, date range

### Statistics & Reporting
- **Dashboard summary**: revenues, orders, checkouts, occupancy rates
- **Financial overview**: breakdowns by category, payment methods
- **Room sales data**: revenue per room, discount-aware calculations
- **Item sales data**: quantity sold, revenue, discount-aware distribution
- **Daily detailed report**: comprehensive daily aggregation with checkouts, orders, expenditures, room allocations
- **Occupancy stats**: room turnover and utilization rates
- **Revenue trends**: configurable periods (today, week, month, year, custom)
- **Payment method distribution**: cash vs online breakdown

### Email & Notifications
- **Dual email provider**: Postmark (primary) with Gmail SMTP fallback
- **Daily report emails**: scheduled via cron, HTML templates with real data
- **License expiry alerts**: configurable days-before notification, daily cron check at midnight
- **Nepal timezone**: UTC+5:45 conversion for scheduling
- **Cron job management**: per-hotel scheduling, reschedule on settings change

### Referrer System
- **Referrer CRUD**: name, phone, email, commission tracking
- **Guest referral**: track which guests were referred by whom
- **Referrer stats**: commission tracking per referrer

### Frontend — Dashboard
- **Stats overview**: total guests, currently staying, checked out, available rooms
- **Revenue charts**: daily/monthly revenue visualization
- **Quick actions**: add guest, create order, view checkouts
- **Responsive**: grid layout adapts to mobile/tablet/desktop

### Frontend — Guest Management
- **Guest list**: paginated table with search, phone/name/status filters, mobile expandable rows
- **Create/Edit modal**: full form with basic info, room assignment, additional guests, dates, discounts
- **Phone search**: auto-fetch existing guest by phone on blur
- **Existing guest detection**: shows previous stays, total spent
- **Room assignment**: custom scrollable room selector with click-to-toggle, compact mobile view
- **Referrer selection**: dropdown for referral source

### Frontend — Room Management
- **Room table**: paginated with maintenance toggle, occupancy/type filters
- **Create/Edit modal**: room number, type, rate, capacity, amenities, description
- **Maintenance toggle**: inline activation/deactivation

### Frontend — Order Management
- **Room order placement**: select room → add items → quantities → submit
- **Custom scrollable room dropdown**: max-height with overflow scroll, compact mobile view
- **Item search/filter**: by category, name
- **Order status timeline**: pending→preparing→ready→served
- **KOT status**: print indicator, reprint capability
- **Kitchen notes**: special instructions per order

### Frontend — Checkout & Billing
- **Checkout list**: paginated with status/date/phone filters
- **Payment dialog**: total calculation, room/order discounts, payment method, VAT
- **Due management**: record payments, transaction history
- **Printable bill modal**: configurable paper size, hotel/client VAT info
- **Print CSS**: `@page` A4/A5/57mm with proper styling

### Frontend — Hotel Management
- **Multi-tab layout**: Basic Info, Images, License, Notifications, Website/Branding
- **Image upload**: logo, gallery, images with preview
- **Website content editor**: inline editing for all sections
- **Visual image picker**: thumbnail grid from uploaded images, click-to-select with checkmark
- **Amenity icon selector**: 32 Lucide icons in dropdown with visual previews
- **Gallery management**: select which images appear in website gallery
- **Printer configuration**: register/manage printers per hotel
- **License management**: expiry date, document upload

### Frontend — Public Website (`/home`)
- **Hero section**: background image with gradient fallback, title/subtitle, CTA button
- **Gallery carousel**: crossfade transitions, thumbnails, lightbox, touch swipe, keyboard nav, auto-advance, grid toggle
- **About section**: hotel description
- **Room showcase**: display website rooms with images, features, pricing
- **Amenities grid**: flexbox wrap layout, 32 Lucide icons, descriptions
- **Experiences section**: curated experiences with images
- **Testimonials**: guest reviews with ratings, photos
- **Contact section**: phone, email, address, reception, WhatsApp button
- **Footer**: contact info, social links, description
- **Pre-booking form**: inquiry form on website
- **Image fallbacks**: gradient backgrounds when images are missing

### Frontend — Other Pages
- **Users**: CRUD with role/status filters, create/edit modal
- **Stats**: financial dashboard with date presets, item/room sales charts
- **Kitchen**: KOT display with status timers, pending/preparing/ready/served views
- **Record book**: daily check-ins/check-outs/dues in accordion sections
- **Dues**: due customer list, payment recording with transaction history
- **Referrers**: CRUD with commission tracking
- **Items**: CRUD with category filter, availability toggle, inventory view
- **Login**: form with eye-toggle password, error handling, auto-redirect

### Frontend — UI Components
- **shadcn-style components**: 30+ Radix UI wrappers (Button, Card, Dialog, Input, Select, Tabs, Switch, Checkbox, ScrollArea, etc.)
- **AuthProvider**: JWT context with refreshUser(), login/logout/register methods
- **ThemeProvider**: light/dark mode via next-themes
- **Dashboard layout**: sidebar navigation, header with user menu, responsive overlay on mobile
- **Navigation**: role-based nav links, active state highlighting
- **Notifications**: toast notifications via react-toastify + sonner
- **Responsive design**: Tailwind breakpoints for mobile/tablet/desktop

### API Gateway (`hms-api-gateway`)
- **Load balancing**: round-robin, weight-based, performance-based, reliability-based strategies
- **Health checking**: configurable intervals, multi-endpoint attempts
- **Domain routing**: extract domain from headers, whitelist middleware
- **Multipart handling**: busboy for form-data forwarding
- **Retry logic**: configurable retry attempts (default 3)
- **Metrics**: request history, per-instance/per-endpoint/per-origin stats
- **Monitoring API**: `GET /gateway/status`, `GET /gateway/monitoring`

### Data Backup (`hms-data-backup`)
- **MongoDB backup**: full database dump to AWS S3 with gzip
- **Collection-specific**: backup/restore individual collections
- **Restore from S3**: latest or specific backup
- **Backup listing**: list available backups in S3
- **Production sync**: local-to-cloud database sync with progress tracking
- **Data sanitization**: transforms for dev/test databases
- **Verification**: count matching, sample document comparison

### Utility Scripts (`HMS-API/scripts/`)
- **Seeder** (`scripts/seeder.js`): full DB seed with hotels, users, rooms, items, guests, orders, checkouts
- **Production seeder** (`scripts/seedProduction.js`): 5 hotels with full configuration
- **Mirana seeder** (`scripts/seedMirana.js`): single hotel light seed
- **Superadmin bootstrapper**: creates initial superadmin from .env
- **Database clone**: copy entire database between instances
- **Daily stats fixer**: recalculate stats for date range
- **KOT fixer**: migrate orders without checkout references
- **Memory optimizer**: test GC and memory management
- **Hotel data updater**: CSV/JSON import/export for rooms and items
- **Menu updater**: replace hotel menu from CSV

### Scraping & Data Collection
- **OYO scraper** (`scripts/scrapeHotelData.js`): scrape hotel images and data from OYO/Agoda listing URLs
- **Multi-strategy fallback**: cheerio static HTML, OYO ID lookup (`--oyo <id>`), web search, Puppeteer headless browser
- **Image upload**: `--upload <hotelId>` flag to upload scraped images directly to hotel via StorageService
- **Website content seeder** (`scripts/seedWebsiteContent.js`): rich hotel-specific content for all 5 hotels (Mirana, Diyana, Junction, Janaki, Momentum) plus default fallback
- **Content includes**: hero, about, amenities, rooms, experiences, testimonials, contact info, whitelisted domains
- **NPM scripts**: `seed:website <name>` (single hotel), `seed:website:all` (all hotels), `scrape:hotel <name> [--oyo <id>] [--upload <hotelId>]`
- **Dependencies**: cheerio (HTML parsing), puppeteer (headless browser fallback), axios (HTTP requests)

### Recent Fixes & Merges
- **2026-06-16**: Fixed room scrolling bug in guest check-in modal — replaced native `<select multiple>` with custom scrollable room list (`max-h-60 sm:max-h-72 overflow-y-auto`), click-to-toggle selection, compact mobile view, desktop/tablet shows full room details
- **2026-06-16**: Fixed orders page room dropdown — increased `max-h-48` to `max-h-60 sm:max-h-72`, added shadow, compact mobile text
- **2026-06-16**: Merged `origin/stable` → `main` (backend) and `origin/stable` → `master` (frontend) with proper conflict resolution
- **2026-06-16**: Created `scripts/scrapeHotelData.js` and `scripts/seedWebsiteContent.js` — the OYO scraper and website content seeder referenced in documentation
- **2026-06-16**: Fixed `routes/notifications.js` — removed duplicate `PUT /:id/notification-settings` route that existed in both `notifications.js` and `hotels.js`, causing `authenticatedApiLimiter is not defined` error
- **2026-06-16**: Added npm scripts: `seed:website`, `seed:website:all`, `scrape:hotel`
- **2026-06-16**: Installed `cheerio` and `puppeteer` dependencies for scraping
- **2026-06-16**: Updated progress.md with complete feature history (comprehensive reference of all features from all sessions)
