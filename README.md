# Email Sender App

A Next.js application to send emails to recipients listed in a CSV file with automated scheduling.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```
EMAIL_ADDRESS=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
CRON_SCHEDULE=55 23 * * *
CRON_SECRET=your-secret-key-optional
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Cron Schedule Configuration:**

**Option 1: Interval Mode (Recommended)** - Runs tomorrow, then every N days
- `CRON_INTERVAL_MODE=true` - Enable interval-based scheduling
- `CRON_INTERVAL_DAYS=3` - Number of days between runs (default: 3)
- `CRON_HOUR=8` - Hour to run (0-23, default: 8)
- `CRON_MINUTE=0` - Minute to run (0-59, default: 0)
- Example: If you start server today, it runs tomorrow at 8 AM, then every 3 days after

**Option 2: Standard Cron Mode** - Runs on fixed days of month
- `CRON_INTERVAL_MODE=false` or remove it
- `CRON_SCHEDULE` - Cron expression (default: `0 8 */3 * *` = Days 1, 4, 7, 10, etc. at 8 AM)
- Format: `minute hour day month weekday`
- Examples:
  - `0 8 */3 * *` - Every 3 days at 8 AM (days 1, 4, 7, 10, etc.)
  - `0 8 * * *` - Every day at 8 AM
  - `55 23 * * *` - Every day at 11:55 PM

3. Place your CSV file in the `public` folder as `data.csv` with the following columns:
   - Company
   - Contact Email
   - Target Role
   - Status

## Usage

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Manual Email Sending:**
   - Click the "Send Emails" button to send emails to all recipients with "Pending" status

4. **Automated Scheduling (Cron Jobs):**
   - **Automatic (Production):** The cron job starts automatically when the server starts
   - **Default Schedule:** Runs every 3 days at 8 AM (configurable via `CRON_SCHEDULE` env variable)
   - **Manual Control (Optional):** Use the "Automated Email Scheduler" section in the UI to manually start/stop or change schedule
   - **Vercel:** Uses Vercel Cron Jobs (configured in `vercel.json`)
   - **Other Platforms:** Uses node-cron that auto-starts on server initialization

## Cron Schedule Examples

- `0 8 */3 * *` - Every 3 days at 8 AM (default)
- `0 8 * * *` - Every day at 8 AM
- `55 23 * * *` - Every day at 11:55 PM
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9 AM
- `*/30 * * * *` - Every 30 minutes

**Note:** The schedule can be configured via the `CRON_SCHEDULE` environment variable. If not set, it defaults to `0 8 */3 * *` (every 3 days at 8 AM).
- `0 0 * * 0` - Every Sunday at midnight

## Features

- Reads CSV from `public/data.csv`
- Sends emails to all rows with "Pending" status
- History tracking with timestamp columns for each send
- View and edit CSV data directly from the UI
- **PWA Support** - Install as a Progressive Web App
- **Dark Mode** - Toggle between light and dark themes
- **Mobile Responsive** - Optimized for all screen sizes
- **Automated Scheduling** - Set up cron jobs for automatic email sending

## Cron Job Setup

### Local Development
The app uses `node-cron` for local development. Start/stop cron jobs from the UI.

### Production (Vercel)
The app includes `vercel.json` with cron configuration. Vercel will automatically run the cron job at the specified schedule.

### Other Platforms
Use external cron services (like cron-job.org, EasyCron, etc.) to call:
```
GET https://your-domain.com/api/cron/send-emails
Authorization: Bearer YOUR_CRON_SECRET
```

## PWA Setup

The app is configured as a Progressive Web App (PWA). To complete the setup:

1. **Generate Icons** (if not already present):
   - Use the `icon.svg` file in `public/` folder
   - Convert to PNG formats:
     - `icon-192x192.png` (192x192 pixels)
     - `icon-512x512.png` (512x512 pixels)
   - You can use online tools like [RealFaviconGenerator](https://realfavicongenerator.net/) or [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

2. **Install the App**:
   - On mobile: Open in browser → Add to Home Screen
   - On desktop: Look for install prompt in browser address bar

3. **Offline Support**:
   - The app works offline (service worker enabled)
   - Data is cached for offline access

## Development Notes

- PWA is disabled in development mode (enabled in production)
- Service worker files are auto-generated in `public/` folder during build
- Icons are required for full PWA functionality
- Cron jobs work in development using node-cron
- For production, use Vercel Cron or external cron services
