# NexTransit Routing Geometry

NexTransit separates visual maps from route geometry providers.

## Bus and Feeder Routes

Bus and feeder routes use road routing because they operate on streets. The MVP
uses OSRM to generate segment-by-segment road geometry between ordered scheduled
stops:

1. Stop A to Stop B
2. Stop B to Stop C
3. Concatenate and dedupe all route points

The resulting `RoutePathPoint` rows use `pathSource` values such as `OSRM`,
`MIXED`, or `FALLBACK`.

## MRT and LRT Routes

MRT and LRT must not use OSRM driving routes because trains do not follow roads.
Rail geometry should come from rail-specific sources:

- Official GTFS `shapes.txt`
- Official operator GIS or track alignment data
- OpenStreetMap / Overpass railway geometry
- Curated rail alignment fallback for demo environments

Current MVP behavior:

- Try Overpass/OpenStreetMap rail geometry.
- If unavailable or too sparse, use curated dense rail alignment.
- Store `pathSource` as `RAIL_OSM` or `RAIL_MANUAL`.

This keeps MRT/LRT lines on rail-like corridors while avoiding road routing.

## Production Recommendation

For a production deployment, prefer official GTFS `shapes.txt` or operator GIS
data over public Overpass queries. Overpass availability and tagging quality can
vary by region and time.
