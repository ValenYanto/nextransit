# NexTransit Realtime Data Notes

NexTransit currently uses a simulation provider backed by local `Vehicle`,
`VehiclePosition`, and `RoutePathPoint` records. This keeps the demo reliable
while preserving a clean integration point for official realtime feeds.

## Current Public Data Situation

- TransJakarta realtime tracking is available to riders through Google Maps.
- A public raw official TransJakarta GTFS-Realtime VehiclePositions endpoint is
  not documented in this project.
- TransJakarta static GTFS is available at:
  `https://gtfs.transjakarta.co.id/files/file_gtfs.zip`
- GTFS-Realtime supports `VehiclePosition`, `TripUpdate`, and `ServiceAlert`
  feeds for live public transit data.
- NexTransit must not scrape Google Maps or private/unofficial endpoints.

## Provider Architecture

Realtime provider files:

- `lib/realtime/types.ts`
- `lib/realtime/provider.ts`

Default provider:

```env
REALTIME_PROVIDER=SIMULATION
GTFS_RT_VEHICLE_POSITIONS_URL=
```

If an official GTFS-Realtime VehiclePositions endpoint becomes available, set
`GTFS_RT_VEHICLE_POSITIONS_URL` and map feed `route_id` or `trip_id` to local
NexTransit routes.

## Future Data Sources

- Official TransJakarta or DISHUB API
- Official GTFS-Realtime VehiclePositions feed
- Jakarta Smart City integration
- Operator GPS feed
- Self-hosted simulation and replay data

Routing geometry is documented in `docs/routing.md`. Bus and feeder routes use
road routing, while MRT/LRT routes use rail geometry or curated rail alignment
fallback.

References:

- https://gtfs.org/documentation/realtime/reference/
- https://support.google.com/transitpartners/answer/9047739
- https://blog.google/intl/id-id/products/explore-get-answers/informasi-real-time-transjakarta-kini-tersedia-di-google-maps/
- https://gtfs.transjakarta.co.id/files/file_gtfs.zip
