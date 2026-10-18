# Music Link Hub

ISRC / UPC -> all streaming store links, ISRC finder, UPC finder, and smartlink pages (`/s/<ISRC or UPC>`).

## How it works
1. Deezer API (no key) finds the release by ISRC/UPC. Spotify API (optional keys) does the same.
2. Odesli (song.link) expands that one URL into Apple Music, YouTube Music, Amazon, Tidal, SoundCloud, Pandora, Anghami, Audiomack, Boomplay, etc.
3. JioSaavn / Gaana / Wynk have no public API, so they appear as search links.

Smartlinks are stateless: `https://yourdomain.com/s/INA012300001` builds the page on request (cached 1h). No database needed.

## Deploy (free)
1. Push this folder to GitHub, import it at vercel.com (no build settings needed).
2. Add env vars from `.env.example` (Spotify keys recommended).
3. Deploy. Open the site, or test: `/api/lookup?code=USRC17607839`

Local: `npx vercel dev`

## Notes
- Odesli without a key allows ~10 requests/min. Request a key (developers@song.link) for more.
- Newly released tracks can take a few days to appear on stores / Deezer.
