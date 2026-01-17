# Situation Monitor – Roadmap

## Data Layers

- [ ] Add weather warnings to the map (US NWS alerts)
- [ ] Add flight radar for likely military/transport aircraft (OpenSky heuristics)
- [ ] Add naval hubs / “ship” layer (OSM infrastructure via Overpass; not live AIS)
- [ ] Ensure Pentagon pizza tracker works (BestTime + curated venues fallback; requires running local proxy)
- [ ] Add regional powers military bases (OSM military=base/naval_base/airfield via Overpass)
- [ ] Add nuclear power plants (OSM nuclear plants/generators via Overpass)

## UI / UX

- [ ] When zooming in, make icons smaller so the countries remain visible

## Constraints / Notes

- Live ship tracking (AIS) generally requires an API key/provider; this repo currently uses free/open sources only.
