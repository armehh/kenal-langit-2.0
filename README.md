# KenalLangit 2.0 ✈️

> *Kenal langit, hafal lapangan.* — Know the sky, memorise the airports.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)

KenalLangit is a Malaysia-focused flight tracker and aviation learning app. It combines a live map of Malaysian airspace with quizzes, short aviation lessons and curated videos, so people who fly often (but cannot say what "KCH" or "TGG" stands for) can finally remember airport codes, and learn a little about how flying works along the way.

**Live demo:** https://kenal-langit.onrender.com
*(Hosted on a free instance. The first visit after a quiet period may take a little while to wake up.)*

<!-- Add screenshots here, for example:
![Map](docs/screenshots/map.png)
![Quiz](docs/screenshots/quiz.png)
-->

## What's new in 2.0

- **Flight panel:** search, filter and sort live aircraft, with a detail card for each flight.
- **Route and status:** origin and destination for a flight, plus delay and status when an AirLabs key is configured.
- **Seven quiz modes** (up from two), including IATA → ICAO, state, fact → airport, and aviation knowledge.
- **Learn path:** six short aviation units with check questions, alongside the airport flashcards.
- **Characters and guided tour:** Arnab the rabbit and two cabin crew guide the quiz, and a 15-step tour walks new users through the app.
- **Video tab:** hand-picked aviation videos you can watch inside the page.
- **More reliable live data:** three public ADS-B feeds are tried in turn, with OpenSky as the last fallback.

## Features

### Map and live flights
- **Live flight map:** aircraft over Malaysian airspace with direction-aware icons, coloured by airline prefix (MAS, AXM, OXB, FFM, MXD). Refreshes every 30 seconds. Falls back to sample data when no live feed is available, and a chip on the map shows "Live" or "Sample data".
- **18 Malaysian airports:** pulsing markers with permanent IATA labels. Click a marker for the IATA/ICAO code, official name, state and a short fact, then press **Test me** to start a quiz from that airport.
- **Flight and airport panel:** a side panel (bottom sheet on phones) with two tabs.
  - *Flights:* search by callsign, airline, country or ICAO24 address, filter by airline (Malaysia Airlines, AirAsia, Firefly, Batik Air, other), and sort by callsign, altitude or speed.
  - *Airports:* search by code, city, name or state, and jump to any airport on the map.
  - Layer toggles to show or hide aircraft and airports.
- **Flight detail card:** airline, country of registration, ICAO24, altitude (m and ft), speed (km/h and knots), heading, climb or descent rate, position and nearest airport.
- **Route:** origin and destination of the selected flight, looked up by callsign.
- **Flight status:** departure and arrival times (scheduled, estimated, actual), terminal and gate, delay badge, and a progress bar with ETA. Needs an AirLabs key (optional).

### Quiz
- **Seven modes:**
  1. *Code → Name*
  2. *Name → Code*
  3. *IATA → ICAO*
  4. *State:* which state is this airport in?
  5. *Fact → Airport:* guess the airport from a fact with the city name hidden
  6. *Aviation knowledge:* general questions drawn from the Learn units
  7. *Mixed:* a bit of every type
- **Three levels** for the airport modes: *Easy* (major international airports), *Medium* (all airports), *Hard* (domestic airports).
- Ten questions per round, progress bar, score with streak bonus, and a summary of the questions you missed with a shortcut to review them in Learn.
- **Rank and sharing:** earn a rank (Loyal Passenger, Trainee Pilot, First Officer, Captain) and share your result.
- **Guides:** Arnab, Pramugari and Pramugara take turns giving a fact or tip after each answer.

### Learn
- **Path:** six units, each with three lesson points and three check questions (pass with 2 of 3). Topics: airport codes, the phonetic alphabet, airlines, how planes fly, parts and controls, and runways and ATC.
- **Cards:** airport flashcards grouped by Peninsular Malaysia, Sabah and Sarawak, with a cultural fact on the back. Mark cards as known or review again.
- Progress is saved in your browser.

### Trips (Jejak)
- **Airports visited:** mark any of the 18 airports as "Pernah sampai" from its map popup or from the Trips tab. The map marker turns green.
- **Flight log:** add a flight with airline, aircraft type (A320, B738, A350 and so on), route and an optional date. Malaysian airports on the route are marked as visited automatically. Overseas legs are logged as "Overseas"; their distance is not counted.
- **Derived stats and badges:** total flights, airlines, aircraft types and distance flown (great-circle, from airport coordinates), plus 12 badges such as *All Sabah*, *Sarawak Explorer* and *Plane Collector*. Nothing derived is stored.
- Stored in `kl-visited` and `kl-flights` and synced with the rest of your progress. The data is self-reported and unverified, so it is kept off the leaderboard.

### Videos
- A curated list in three categories: *Cabin crew life* (Borak Dalam Galley), *Malaysia* and *Learn aviation*.
- Watch inside the page (privacy-friendly `youtube-nocookie.com` player) or open on YouTube. Previous and next buttons move through the current category.
- To add a video, add one line to the `VIDEOS` list at the top of `public/videos.js`.

### Everything else
- **Guided tour:** 15 steps with the cabin crew and Arnab, shown on first visit. Press **?** to replay it.
- **Leaderboard:** submit your score and see the top 10.
- **Bilingual:** Bahasa Malaysia and English, switchable at any time.
- **Responsive "Radar Malam" theme:** dark map, pulsing airport markers, a hero card on first load, and a Jalur Gemilang-inspired header stripe. Respects `prefers-reduced-motion`.

## Tech stack

| Area | Tools |
|---|---|
| Front-end | HTML, CSS, vanilla JavaScript (no build step) |
| Map | [Leaflet](https://leafletjs.com/) 1.9.4, CARTO dark basemap |
| Live flights | [adsb.lol](https://adsb.lol/), [airplanes.live](https://airplanes.live/) and [adsb.fi](https://adsb.fi/) (primary), [OpenSky Network](https://opensky-network.org/) (fallback), all proxied by the server |
| Routes | [adsbdb](https://www.adsbdb.com/) |
| Flight status | [AirLabs](https://airlabs.co/) (optional) |
| Videos | YouTube embeds via `youtube-nocookie.com` |
| Back-end | Node.js 18+, Express, dotenv |
| Storage | JSON file (leaderboard), `localStorage` (language, Learn progress, tour), `sessionStorage` (hero card) |
| Hosting | [Render](https://render.com/) (Web Service) |

## Project structure

```
kenal-langit-2.0/
├── public/
│   ├── index.html          # Core app: airports data, map, quiz, flashcards, leaderboard
│   ├── aviation.js         # Six Learn units (lessons and check questions)
│   ├── kuiz.js             # Seven quiz modes and the Learn path / cards
│   ├── extras.js           # Hero card, airport labels, "Test me", rank and share
│   ├── extras.css          # Animations, hero card and label styles
│   ├── characters.js       # Arnab, Pramugara and Pramugari guides
│   ├── panel.js            # Flight and airport side panel
│   ├── route.js            # Origin and destination on the flight card
│   ├── status.js           # Delay and status on the flight card
│   ├── tour.js             # 15-step guided tour
│   ├── trip.js             # Trips tab: airports visited, flight log, stats and badges
│   ├── videos.js           # Video tab and the editable VIDEOS list
│   └── img/
│       └── characters/     # Character poses (.webp)
├── server.js               # Express server and API
├── package.json
├── .env.example            # Example environment variables
├── .gitignore
├── KenalLangit_Project_Proposal.docx    # Project proposal
└── data/
    └── leaderboard.json    # Created at runtime (git-ignored)
```

The front-end scripts load in the order listed in `index.html`. Each one builds on the previous ones (for example, `extras.js` wraps functions from the main script and `kuiz.js`), so keep that order if you add or move files.

## Getting started

**Requirements:** Node.js 18 or newer.

```bash
# 1. Clone the repository
git clone https://github.com/armehh/kenal-langit-2.0.git
cd kenal-langit-2.0

# 2. Install dependencies
npm install

# 3. Create your environment file
#    Windows:        copy .env.example .env
#    macOS / Linux:  cp .env.example .env

# 4. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

For development with automatic restart on file changes:

```bash
npm run dev
```

> Open the app through `http://localhost:3000`, not by double-clicking `index.html`. Opening it as a `file://` page breaks the map tiles and the API calls, and the app shows a warning banner.

### Basemap API key

The dark basemap comes from CARTO, which requires a free API key.

1. Request a key at https://carto.com/basemaps/apikey.
2. In `public/index.html`, set it in the map section:

```javascript
const CARTO_KEY="YOUR_CARTO_KEY";
```

Use your own key if you fork or deploy this project, and keep the OpenStreetMap and CARTO attribution visible on the map.

## Configuration

Environment variables (all optional):

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `OPENSKY_CLIENT_ID` | OpenSky OAuth2 client ID, for higher rate limits on the fallback feed | none (anonymous access) |
| `OPENSKY_CLIENT_SECRET` | OpenSky OAuth2 client secret | none (anonymous access) |
| `AIRLABS_API_KEY` | AirLabs API key. Enables flight status and delay information | none (status disabled) |
| `AIRLABS_DAILY_CAP` | Maximum AirLabs queries per day, to protect the free plan (1,000 per month) | `30` |

Without an AirLabs key the app works as normal; the flight card just shows that status is not enabled. Never commit your `.env` file. It is already listed in `.gitignore`.

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/flights` | Aircraft currently airborne over Malaysia, cached for 15 seconds. Returns `{ source, flights: [{ icao, cs, country, lat, lng, alt, vel, hdg, vr }] }`. Altitude is in metres, speeds in m/s. `source` is the feed that answered (`adsb.lol`, `airplanes.live`, `adsb.fi`, `opensky`), `cache`, or `stale` (with an `error` message) when every feed failed. |
| `GET` | `/api/route/:callsign` | Origin and destination for a callsign (via adsbdb). Returns `{ route }`, or `route: null` if unknown. Cached for 10 minutes (5 minutes for unknown callsigns), limited to 30 requests per minute per client. |
| `GET` | `/api/status/:callsign` | Flight status and delay (via AirLabs): status, times, terminal and gate, delay, progress and ETA. Cached for 5 minutes (10 for unknown), limited to 20 requests per minute per client and by `AIRLABS_DAILY_CAP`. Returns `503 not_configured` without a key. |
| `GET` | `/api/leaderboard` | Top 10 scores. |
| `POST` | `/api/leaderboard` | Submit a score. Body: `{ name, score, level, mode }`, where `level` is `easy`, `med` or `hard` and `mode` is an integer from `1` to `7`. |

The leaderboard validates input, limits each client to one submission every 10 seconds, and rejects impossible scores. Flight lookups validate the callsign format, and API keys stay on the server.

## Deployment (Render)

Create a **Web Service** (not a Static Site) connected to this repository:

| Setting | Value |
|---|---|
| Runtime | Node |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Add any environment variables you need (for example `AIRLABS_API_KEY`) under **Environment** in the Render dashboard. Every push to `main` triggers a new deploy. The server logs at startup whether the OpenSky and AirLabs credentials were picked up.

## Known limitations

- **Leaderboard resets on free hosting.** Render's free filesystem is not persistent, so scores are lost on restart or redeploy. A database or Firebase would fix this.
- **Live data depends on public feeds.** The ADS-B services allow about one request per second, so the server queries three coverage circles one after another and a refresh takes a few seconds. Coverage can be incomplete, and the app shows sample aircraft when every feed fails.
- **Routes are scheduled, not live.** ADS-B does not carry origin and destination, so routes come from a callsign lookup and may not match the actual flight. Some callsigns have no route.
- **Flight status is limited by the AirLabs free plan** (1,000 queries per month, capped per day by the server), and not every flight is covered.
- **Airport facts need verification.** Coordinates and facts should be checked against an open dataset such as [OurAirports](https://ourairports.com/) before relying on them.
- **Tour images are optional.** The tour looks for `img/guide/step-01.png` to `step-15.png` and falls back to Arnab, then to an emoji, when they are missing.

## Roadmap

- [x] Guided onboarding for new users with illustrated crew and mascot characters
- [x] More quiz modes and structured aviation lessons
- [x] Origin, destination and flight status on the flight card
- [ ] Map-pin quiz mode (guess the highlighted airport on an unlabelled map)
- [ ] Live aircraft quiz (guess the nearest airport)
- [ ] More airports, including small and rural airstrips
- [ ] Persistent leaderboard (database or Firebase)
- [ ] Seasonal modes, such as balik kampung routes during festive periods

## Credits and data sources

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Basemap © [CARTO](https://carto.com/attributions)
- Map library: [Leaflet](https://leafletjs.com/)
- Live flight data from [adsb.lol](https://adsb.lol/), [airplanes.live](https://airplanes.live/), [adsb.fi](https://adsb.fi/) and the [OpenSky Network](https://opensky-network.org/)
- Route data from [adsbdb](https://www.adsbdb.com/) (api.adsbdb.com)
- Flight status from [AirLabs](https://airlabs.co/)
- Videos belong to their creators and are played by YouTube. KenalLangit only shows links.

## Author

**Armin Rafiqin** — Software Engineering (Multimedia System Development), Universiti Kebangsaan Malaysia (UKM)

- GitHub: [@armehh](https://github.com/armehh)
- LinkedIn: [armin-rafiqin](https://linkedin.com/in/armin-rafiqin)

---

*KenalLangit is a personal, non-commercial portfolio project and is not affiliated with any airline or airport.*
