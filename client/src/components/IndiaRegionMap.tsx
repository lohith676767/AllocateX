import L, { type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet';
import { formatINR, formatPct } from '../lib/format';
import type { Region } from '../types';

// Real approximate coordinates for the seeded regions (city-level anchor
// points, close enough for a demo-scale map) — presentational placement
// only, not sourced from the backend.
const REGION_COORDS: Record<string, [number, number]> = {
  Bundelkhand: [25.4484, 78.5685], // Jhansi, UP
  Vidarbha: [21.1458, 79.0882], // Nagpur, MH
  'Coastal Odisha': [19.8135, 85.8312], // Puri, OD
  'North Bengaluru Urban': [13.1007, 77.5963], // Yelahanka, Bengaluru
};

function severityFill(underserviceScore: number) {
  // Darker red = higher underservice — same warm ramp used elsewhere on this page.
  const t = underserviceScore;
  return `rgb(${Math.round(220 - t * 30)}, ${Math.round(70 - t * 40)}, ${Math.round(60 - t * 30)})`;
}

function pinIcon(color: string) {
  // iconAnchor: [15, 40] already tells Leaflet to position this 30x40 box so
  // its bottom-center sits on the marker's lat/lng — no extra CSS transform
  // needed (and adding one would double-offset the icon away from where
  // Leaflet actually hit-tests clicks/hovers).
  return L.divIcon({
    className: '',
    html: `
      <div class="relative h-[40px] w-[30px]">
        <span class="absolute left-1/2 top-[35px] -translate-x-1/2 h-2.5 w-2.5 animate-ping rounded-full" style="background:${color}55"></span>
        <svg width="30" height="40" viewBox="0 0 30 40" fill="none" class="relative drop-shadow-md">
          <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
          <circle cx="15" cy="15" r="5.5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    tooltipAnchor: [0, -40],
  });
}

export default function IndiaRegionMap({
  regions,
  onSelectRegion,
}: {
  regions: Region[];
  onSelectRegion: (regionId: string) => void;
}) {
  const pins = regions.filter((r) => REGION_COORDS[r.name]);
  const bounds: LatLngBoundsExpression = pins.length > 0 ? pins.map((r) => REGION_COORDS[r.name]) : [[8, 68], [37, 97]];

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold text-stone-900">Regional map</h2>
        <span className="label-caps">OpenStreetMap</span>
      </div>
      <p className="mt-1 text-[12px] text-stone-500">Hover a pin for key metrics, click to open its full detail.</p>

      {/* isolate: Leaflet assigns its internal panes/controls z-index values up
          to 1000, which would otherwise escape above page elements like the
          region drawer (z-50) — isolation contains them to this box. */}
      <div className="isolate relative mt-5 h-[420px] w-full overflow-hidden rounded-lg border border-stone-200">
        <MapContainer
          bounds={bounds}
          // Extra top padding so a pin near the fitted view's top edge still
          // has room for its "top"-direction tooltip — Leaflet's own
          // container clips anything that overflows above it.
          boundsOptions={{ paddingTopLeft: [48, 90], paddingBottomRight: [48, 48], maxZoom: 7 }}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pins.map((r) => (
            <Marker
              key={r.id}
              position={REGION_COORDS[r.name]}
              icon={pinIcon(severityFill(r.underserviceScore))}
              eventHandlers={{ click: () => onSelectRegion(r.id) }}
            >
              <Tooltip
                direction="top"
                opacity={1}
                className="!whitespace-normal !rounded-lg !border !border-stone-200 !bg-white !p-0 !shadow-popover"
              >
                <div className="w-44 p-3">
                  <p className="text-[12px] font-semibold text-stone-900">{r.name}</p>
                  <p className="text-[10.5px] text-stone-400">{r.state}</p>
                  <dl className="mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Underservice</dt>
                      <dd className="tabular-nums font-medium text-rose-600">{formatPct(r.underserviceScore * 100)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Equity</dt>
                      <dd className="tabular-nums font-medium text-accent-600">{formatPct(r.geographicalEquityScore * 100)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-stone-500">Allocated</dt>
                      <dd className="tabular-nums font-medium text-stone-800">{formatINR(r.allocatedAmount, { compact: true })}</dd>
                    </div>
                  </dl>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
