// Types and dummy GeoJSON data for town-level polygon analysis

export type HeatmapMode = "population" | "households" | "age";
export type LayerMode = "density" | "competitors" | "recommended";

export interface TownPolygonProperties {
  id: string;
  name: string;
  population: number;
  households: number;
  avgAge: number;
  densityRank: "high" | "medium" | "low";
}

export interface CandidatePin {
  id: string;
  label: string;
  lat: number;
  lng: number;
  score: number;
  population: number;
  competitors: number;
}

export interface FlyerSelection {
  townIds: string[];
  totalHouseholds: number;
  recommendedCopies: number;
}

export type TownFeature = GeoJSON.Feature<GeoJSON.Polygon, TownPolygonProperties>;
export type TownFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Polygon, TownPolygonProperties>;

// Reverse geocode a single coordinate to get the local place name via Nominatim
async function reverseGeocodeName(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "ja", "User-Agent": "ShopBoostPilot/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address;
    // Try to extract the most local name: neighbourhood > quarter > suburb > city_district
    return addr?.neighbourhood || addr?.quarter || addr?.suburb || addr?.city_district || null;
  } catch {
    return null;
  }
}

// Batch reverse geocode with rate-limiting (Nominatim allows 1 req/sec)
export async function resolvePolygonNames(
  polygons: TownFeatureCollection
): Promise<TownFeatureCollection> {
  const features = [...polygons.features];
  // Pick a sample of unique coordinates to reduce API calls (max ~10)
  const coordMap = new Map<string, { lat: number; lng: number; indices: number[] }>();
  features.forEach((f, i) => {
    const coords = f.geometry.coordinates[0];
    const lat = (coords[0][1] + coords[2][1]) / 2;
    const lng = (coords[0][0] + coords[2][0]) / 2;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (!coordMap.has(key)) {
      coordMap.set(key, { lat, lng, indices: [] });
    }
    coordMap.get(key)!.indices.push(i);
  });

  const entries = Array.from(coordMap.values());
  // Limit to 12 reverse geocode calls to respect rate limits
  const toResolve = entries.slice(0, 12);
  const usedNames = new Set<string>();

  for (let i = 0; i < toResolve.length; i++) {
    const entry = toResolve[i];
    // Small delay between requests to respect Nominatim 1req/sec policy
    if (i > 0) await new Promise((r) => setTimeout(r, 350));
    const name = await reverseGeocodeName(entry.lat, entry.lng);
    const resolvedName = name && !usedNames.has(name) ? name : null;
    if (resolvedName) usedNames.add(resolvedName);
    for (const idx of entry.indices) {
      features[idx] = {
        ...features[idx],
        properties: {
          ...features[idx].properties,
          name: resolvedName || `エリア ${idx + 1}`,
        },
      };
    }
  }

  // Fill remaining unresolved features
  for (let i = 0; i < features.length; i++) {
    const entries12Indices = toResolve.flatMap((e) => e.indices);
    if (!entries12Indices.includes(i)) {
      features[i] = {
        ...features[i],
        properties: { ...features[i].properties, name: `エリア ${i + 1}` },
      };
    }
  }

  return { type: "FeatureCollection", features };
}

// Generate town polygons around a given center point.
// When censusData is provided, polygon properties reflect real values.
// Names are placeholder — call resolvePolygonNames() after to get real names.
export function generateTownPolygons(
  center: [number, number],
  radiusKm: number,
  censusData?: { totalPopulation?: number; totalHouseholds?: number; avgAge?: number }
): TownFeatureCollection {
  const towns: TownFeature[] = [];
  const gridSize = radiusKm <= 1 ? 3 : radiusKm <= 3 ? 5 : 7;
  const step = (radiusKm * 0.6) / gridSize;
  const latStep = step / 111;
  const lngStep = step / (111 * Math.cos((center[0] * Math.PI) / 180));

  let idx = 0;
  const halfGrid = Math.floor(gridSize / 2);

  for (let row = -halfGrid; row <= halfGrid; row++) {
    for (let col = -halfGrid; col <= halfGrid; col++) {
      const cx = center[1] + col * lngStep;
      const cy = center[0] + row * latStep;
      const dist = Math.sqrt(row * row + col * col);
      if (dist > halfGrid + 0.5) continue;

      const halfLat = latStep * 0.48;
      const halfLng = lngStep * 0.48;

      const basePop = censusData?.totalPopulation || 0;
      const baseHouseholds = censusData?.totalHouseholds || 0;
      const baseAge = censusData?.avgAge || 42;
      const population = basePop > 0
        ? Math.round((basePop / (gridSize * gridSize)) * (0.6 + Math.random() * 0.8))
        : Math.round(800 + Math.random() * 4200 - dist * 300);
      const households = baseHouseholds > 0
        ? Math.round((baseHouseholds / (gridSize * gridSize)) * (0.6 + Math.random() * 0.8))
        : Math.round(population / (2 + Math.random() * 0.8));
      const avgAge = basePop > 0
        ? Math.round(baseAge + (Math.random() - 0.5) * 6)
        : Math.round(35 + Math.random() * 20);
      const densityRank: TownPolygonProperties["densityRank"] =
        population > 3500 ? "high" : population > 1800 ? "medium" : "low";

      towns.push({
        type: "Feature",
        properties: {
          id: `town-${idx}`,
          name: `エリア ${idx + 1}`, // placeholder until resolvePolygonNames()
          population: Math.max(200, population),
          households: Math.max(80, households),
          avgAge,
          densityRank,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [cx - halfLng, cy - halfLat],
              [cx + halfLng, cy - halfLat],
              [cx + halfLng, cy + halfLat],
              [cx - halfLng, cy + halfLat],
              [cx - halfLng, cy - halfLat],
            ],
          ],
        },
      });
      idx++;
    }
  }

  return { type: "FeatureCollection", features: towns };
}

// Color scale for heatmap
export function getHeatmapColor(value: number, mode: HeatmapMode): string {
  let normalized: number;
  if (mode === "population") {
    normalized = Math.min(1, value / 5000);
  } else if (mode === "households") {
    normalized = Math.min(1, value / 2500);
  } else {
    // age: lower avg age = more blue, higher = more red
    normalized = Math.min(1, Math.max(0, (value - 30) / 25));
  }

  // Blue → Yellow → Red gradient
  const r = Math.round(normalized < 0.5 ? normalized * 2 * 255 : 255);
  const g = Math.round(normalized < 0.5 ? 100 + normalized * 310 : 255 - (normalized - 0.5) * 2 * 200);
  const b = Math.round(normalized < 0.5 ? 255 - normalized * 2 * 200 : 55 - normalized * 55);

  return `rgb(${r}, ${g}, ${b})`;
}

export function getHeatmapValue(
  props: TownPolygonProperties,
  mode: HeatmapMode
): number {
  switch (mode) {
    case "population":
      return props.population;
    case "households":
      return props.households;
    case "age":
      return props.avgAge;
  }
}

export function calculateFlyerSelection(
  selectedIds: string[],
  towns: TownFeatureCollection
): FlyerSelection {
  let totalHouseholds = 0;
  for (const feature of towns.features) {
    if (selectedIds.includes(feature.properties.id)) {
      totalHouseholds += feature.properties.households;
    }
  }
  return {
    townIds: selectedIds,
    totalHouseholds,
    recommendedCopies: Math.round(totalHouseholds * 1.15), // 15% buffer
  };
}
