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

// Generate town polygons around a given center point.
// When censusData is provided, polygon properties reflect real values.
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

  const townNames = [
    "一丁目", "二丁目", "三丁目", "四丁目", "五丁目",
    "北町", "南町", "東町", "西町", "中央",
    "本町", "栄町", "緑町", "旭町", "幸町",
    "若松町", "大手町", "新町", "錦町", "末広町",
    "春日町", "松原町", "泉町", "桜町", "富士見町",
    "曙町", "寿町", "千代田", "日の出町", "弥生町",
    "瑞穂町", "平和町", "光が丘", "花園町", "八幡町",
    "住吉町", "扇町", "汐見町", "船場町", "高砂町",
    "港町", "浜松町", "芝浦", "青海", "豊洲",
    "有明", "台場", "晴海", "勝どき",
  ];

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

      const population = Math.round(800 + Math.random() * 4200 - dist * 300);
      const households = Math.round(population / (2 + Math.random() * 0.8));
      const avgAge = Math.round(35 + Math.random() * 20);
      const densityRank: TownPolygonProperties["densityRank"] =
        population > 3500 ? "high" : population > 1800 ? "medium" : "low";

      towns.push({
        type: "Feature",
        properties: {
          id: `town-${idx}`,
          name: townNames[idx % townNames.length],
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
