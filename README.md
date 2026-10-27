# KenalLangit ✈️

> *Kenal langit, hafal lapangan.* — Know the sky, memorise the airports.

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet&logoColor=white)

KenalLangit is a Malaysia-focused flight tracker and airport-code quiz. It combines a live map of Malaysian airspace with a game-like way to learn airport names and IATA/ICAO codes, so people who fly often (but cannot say what "KCH" or "TGG" stands for) can finally remember them.

**Live demo:** https://kenal-langit.onrender.com
*(Hosted on a free instance. The first visit after a quiet period may take a little while to wake up.)*

<!-- Add screenshots here, for example:
![Map](docs/screenshots/map.png)
![Quiz](docs/screenshots/quiz.png)
-->

## Features

- **Live flight map:** aircraft over Malaysian airspace with direction-aware icons, coloured by airline prefix. Falls back to sample data when the live feed is unavailable.
- **18 Malaysian airports:** click a marker to see the IATA/ICAO code, official name, state and a short fact.
- **Airport quiz:** two modes and three difficulty levels.
  - *Code → Name* and *Name → Code*
  - *Easy* (major international airports), *Medium* (all airports), *Hard* (domestic airports)
  - Up to 10 questions per round, progress bar, score with streak bonus, and a summary of the airports you missed
- **Learn mode:** flashcards grouped by Peninsular Malaysia, Sabah and Sarawak. Mark cards as known or review again. Progress is saved in your browser.
- **Leaderboard:** submit your score and see the top 10.
- **Bilingual:** Bahasa Malaysia and English, switchable at any time.
- **Responsive "Radar Malam" theme:** dark map, pulsing airport markers, and a Jalur Gemilang-inspired header stripe.

## Tech stack

| Area | Tools |
|---|---|
| Front-end | HTML, CSS, vanilla JavaScript |
| Map | [Leaflet](https://leafletjs.com/) 1.9.4, CARTO dark basemap |
| Live data | [OpenSky Network](https://opensky-network.org/) API, proxied by the server |
| Back-end | Node.js, Express, dotenv |
| Storage | JSON file (leaderboard), `localStorage` (language, learn progress) |
| Hosting | [Render](https://render.com/) (Web Service) |

## Project structure

```
kenal-langit/
├── public/
│   └── index.html                       # Front-end (map, quiz, learn, leaderboard)
├── server.js                            # Express server and API
├── package.json
├── .env.example                         # Example environment variables
├── .gitignore
├── KenalLangit_Project_Proposal.docx    # Project proposal
└── data/
    └── leaderboard.json                 # Created at runtime (git-ignored)
```

## Getting started

**Requirements:** Node.js 18 or newer.

```bash
# 1. Clone the repository
git clone https://github.com/armehh/kenal-langit.git
cd kenal-langit

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

> Open the app through `http://localhost:3000`, not by double-clicking `index.html`. Opening it as a `file://` page breaks the map tiles and the API calls.

### Basemap API key

The dark basemap comes from CARTO, which requires a free API key.

1. Request a key at https://carto.com/basemaps/apikey.
2. In `public/index.html`, set it in the map section:

```javascript
const CARTO_KEY="YOUR_CARTO_KEY";
```

Keep the OpenStreetMap and CARTO attribution visible on the map.

## Configuration

Environment variables (all optional):

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `OPENSKY_CLIENT_ID` | OpenSky OAuth2 client ID, for higher rate limits | none (anonymous access) |
| `OPENSKY_CLIENT_SECRET` | OpenSky OAuth2 client secret | none (anonymous access) |

Never commit your `.env` file. It is already listed in `.gitignore`.

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/flights` | Aircraft currently airborne over Malaysia. The server caches OpenSky results for 15 seconds. Returns `{ source, flights: [{ cs, lat, lng, hdg }] }`. |
| `GET` | `/api/leaderboard` | Top 10 scores. |
| `POST` | `/api/leaderboard` | Submit a score. Body: `{ name, score, level, mode }`, where `level` is `easy`, `med` or `hard` and `mode` is `1` or `2`. |
| `GET` | `/api/route/:callsign` | Origin and destination for a callsign (via adsbdb), cached for a few minutes. |

The leaderboard validates input, limits each client to one submission every 10 seconds, and rejects impossible scores.

## Deployment (Render)

Create a **Web Service** (not a Static Site) connected to this repository:

| Setting | Value |
|---|---|
| Runtime | Node |
| Branch | `main` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Every push to `main` triggers a new deploy.

## Known limitations

- **Leaderboard resets on free hosting.** Render's free filesystem is not persistent, so scores are lost on restart or redeploy. A database or Firebase would fix this.
- **Live data depends on OpenSky.** Anonymous access is rate-limited, and the feed can be incomplete or unavailable. The app shows sample aircraft when that happens, and the map chip indicates "Live" or "Sample data".
- **Airport facts need verification.** Coordinates and facts should be checked against an open dataset such as [OurAirports](https://ourairports.com/) before relying on them.

## Roadmap

- [ ] Map-pin quiz mode (guess the highlighted airport on an unlabelled map)
- [ ] Live aircraft quiz (guess the nearest airport)
- [ ] More airports, including small and rural airstrips
- [ ] Guided onboarding for new users with illustrated crew and mascot characters
- [ ] Persistent leaderboard (database or Firebase)
- [ ] Seasonal modes, such as balik kampung routes during festive periods

## Credits and data sources

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Basemap © [CARTO](https://carto.com/attributions)
- Flight data from the [OpenSky Network](https://opensky-network.org/)
- Map library: [Leaflet](https://leafletjs.com/)
- Route data from [adsbdb](https://www.adsbdb.com/) (api.adsbdb.com)

## Author

**Armin Rafiqin** — Software Engineering (Multimedia System Development), Universiti Kebangsaan Malaysia (UKM)

- GitHub: [@armehh](https://github.com/armehh)
- LinkedIn: [armin-rafiqin](https://linkedin.com/in/armin-rafiqin)

---

*KenalLangit is a personal, non-commercial portfolio project and is not affiliated with any airline or airport.*
