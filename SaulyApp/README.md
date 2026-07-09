# SaulyApp — Meeting Buddy

An offline AI meeting assistant that captures key highlights and action items
after every call (Zoom, Teams, Google Meet). Built as a self-contained
static web app.

## Run it
- **Quickest:** open `app/dist/index.html` in any browser — that single file
  is the entire app, no server needed.
- **From source:** serve the `app/` folder (`cd app && python3 -m http.server`)
  and open the shown address.

## Structure
- `app/` — multi-file source (HTML, CSS, JS, brand assets)
- `app/dist/index.html` — everything bundled into one portable file
