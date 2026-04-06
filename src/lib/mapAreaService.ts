import { supabase } from "@/integrations/supabase/client";

// Types for map-based trade area analysis
export type PopulationZone = {
  id: string;
  center: [number, number]; // [lat, lng]
  radius: number; // meters
  population: number;
  density: "high" | "medium" | "low";
  label: string;
};

export type CompetitorStore = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  industry: string;
  distance: number; // meters from target
};

export type CensusData = {
  source: string;
  areaName: string;
  areaCode: string;
  totalPopulation: number;
  totalHouseholds: number;
  malePopulation?: number;
  femalePopulation?: number;
  ageDistribution: { ageGroup: string; population: number; percentage: number }[];
  dataAvailable: boolean;
};

export type TradeAreaSummary = {
  totalPopulation: number;
  ageDistribution: { ageGroup: string; percentage: number; count: number }[];
  householdTypes: { type: string; percentage: number; count: number }[];
  competitorCount: number;
  tradeAreaScore: number; // 0-100
  recommendations: string[];
  totalHouseholds: number;
  dataSource: string;
  primaryTarget?: string;
  areaCharacteristics?: string;
  competitiveEnvironment?: string;
};

export type MapAreaAnalysisResult = {
  center: [number, number];
  populationZones: PopulationZone[];
  competitors: CompetitorStore[];
  summary: TradeAreaSummary;
  censusData: CensusData | null;
  countryCode: string; // ISO 2-letter country code (e.g. "jp", "us")
  isOverseas: boolean;
};

type GeocodingResult = {
  center: [number, number];
  countryCode: string;
  displayName: string;
};

// Geocode address using Nominatim (returns country_code for overseas detection)
async function geocodeAddress(address: string): Promise<GeocodingResult> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "ja", "User-Agent": "ShopBoostPilot/1.0" },
  });
  if (!res.ok) throw new Error("ジオコーディングに失敗しました");
  const data = await res.json();
  if (!data || data.length === 0) throw new Error("住所が見つかりませんでした");
  const item = data[0];
  return {
    center: [parseFloat(item.lat), parseFloat(item.lon)],
    countryCode: (item.address?.country_code || "").toLowerCase(),
    displayName: item.display_name || address,
  };
}

// Fetch US Census data via us-census edge function
async function fetchUsCensusData(lat: number, lng: number): Promise<CensusData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("us-census", {
      body: { lat, lng },
    });
    if (error || !data?.result?.dataAvailable) return null;
    return data.result as CensusData;
  } catch {
    return null;
  }
}

// Fetch WorldPop data via worldpop-census edge function
async function fetchWorldPopData(
  lat: number,
  lng: number,
  countryCode: string,
  radiusMeters: number
): Promise<CensusData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("worldpop-census", {
      body: { lat, lng, countryCode, radiusMeters },
    });
    if (error || !data?.result?.dataAvailable) return null;
    return data.result as CensusData;
  } catch {
    return null;
  }
}

// Fetch Japan census data (e-Stat)
async function fetchJpCensusData(address: string): Promise<CensusData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("estat-census", {
      body: { address },
    });
    if (error || !data?.result?.dataAvailable) return null;
    return data.result as CensusData;
  } catch {
    return null;
  }
}

// Fetch census data based on country code
async function fetchCensusForCountry(
  countryCode: string,
  address: string,
  center: [number, number],
  radiusMeters: number,
  language: string = "ja"
): Promise<{ data: CensusData | null; dataSource: string }> {
  const isEn = language === "en";
  switch (countryCode) {
    case "jp": {
      const data = await fetchJpCensusData(address);
      return { data, dataSource: data?.dataAvailable ? (isEn ? "e-Stat Census" : "e-Stat 国勢調査") : (isEn ? "AI Estimated" : "AI推定分析") };
    }
    case "us": {
      const data = await fetchUsCensusData(center[0], center[1]);
      return { data, dataSource: data?.dataAvailable ? "US Census (2020)" : (isEn ? "Estimated (Overseas)" : "推定データ（海外）") };
    }
    default: {
      const data = await fetchWorldPopData(center[0], center[1], countryCode, radiusMeters);
      return { data, dataSource: data?.dataAvailable ? (isEn ? "WorldPop Est." : "WorldPop推計") : (isEn ? "Estimated (Overseas)" : "推定データ（海外）") };
    }
  }
}



const INDUSTRY_OSM_TAGS: Record<string, string[]> = {
  "居酒屋": ['amenity=restaurant', 'amenity=bar', 'amenity=pub'],
  "飲食店": ['amenity=restaurant', 'amenity=cafe', 'amenity=fast_food'],
  "レストラン": ['amenity=restaurant'],
  "カフェ": ['amenity=cafe'],
  "学習塾": ['amenity=school', 'office=educational_institution', 'amenity=college'],
  "美容院": ['shop=hairdresser', 'shop=beauty'],
  "コンビニ": ['shop=convenience'],
  "病院": ['amenity=hospital', 'amenity=clinic', 'amenity=doctors'],
  "薬局": ['amenity=pharmacy', 'shop=chemist'],
  "フィットネス": ['leisure=fitness_centre', 'leisure=sports_centre'],
  "クリーニング": ['shop=laundry', 'shop=dry_cleaning'],
  "小売店": ['shop=supermarket', 'shop=general', 'shop=department_store'],
};

const DEFAULT_OSM_TAGS = [
  'amenity=restaurant', 'amenity=cafe', 'shop=convenience',
  'shop=supermarket', 'shop=hairdresser', 'amenity=pharmacy',
];

function getOsmTagsForIndustry(industry?: string): string[] {
  if (!industry) return DEFAULT_OSM_TAGS;
  for (const [key, tags] of Object.entries(INDUSTRY_OSM_TAGS)) {
    if (industry.includes(key)) return tags;
  }
  // Fallback: search as shop=*
  return ['shop=*', 'amenity=restaurant', 'amenity=cafe'];
}

function buildOverpassQuery(lat: number, lng: number, radiusMeters: number, tags: string[]): string {
  const filters = tags.map((tag) => {
    const [k, v] = tag.split("=");
    const filter = v === "*" ? `["${k}"]` : `["${k}"="${v}"]`;
    return `node${filter}(around:${radiusMeters},${lat},${lng});`;
  }).join("\n");
  return `[out:json][timeout:10];\n(\n${filters}\n);\nout body;`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchCompetitorsFromOverpass(
  center: [number, number],
  radiusMeters: number,
  industry?: string
): Promise<CompetitorStore[]> {
  const tags = getOsmTagsForIndustry(industry);
  const query = buildOverpassQuery(center[0], center[1], radiusMeters, tags);

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error("Overpass API request failed");
  const data = await res.json();

  const elements: any[] = data.elements || [];
  return elements
    .filter((el: any) => el.lat && el.lon)
    .map((el: any, i: number) => {
      const tags = el.tags || {};
      const name = tags.name || tags["name:ja"] || `店舗 ${i + 1}`;
      const cat = tags.shop || tags.amenity || tags.leisure || tags.office || "店舗";
      const distance = Math.round(haversineDistance(center[0], center[1], el.lat, el.lon));
      return {
        id: `osm-${el.id || i}`,
        name,
        lat: el.lat,
        lng: el.lon,
        industry: cat,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 50); // cap at 50
}

// Fetch map-based area analysis from API
export async function fetchMapAreaAnalysis(
  address: string,
  radius: string,
  industry?: string,
  language: string = "ja"
): Promise<MapAreaAnalysisResult> {
  const radiusMeters = parseRadiusToMeters(radius);

  // Step 1: Geocode to get center + country code
  const geo = await geocodeAddress(address);
  const { center, countryCode } = geo;
  const isOverseas = countryCode !== "jp";

  // Step 2: Fetch AI analysis + country-specific census in parallel
  const [aiAnalysis, censusResult] = await Promise.all([
    supabase.functions.invoke("area-analysis", {
      body: { address, radius, industry, analysisType: "area", language },
    }).then(({ data, error }) => {
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    }),
    fetchCensusForCountry(countryCode, address, center, radiusMeters, language),
  ]);

  const result = aiAnalysis.result;
  const apiCensus = aiAnalysis.censusData;
  const censusData = censusResult.data;
  const dataSource = censusResult.dataSource;

  // Population & households
  const totalPop = censusData?.totalPopulation || result.population || 0;
  const totalHouseholds = censusData?.totalHouseholds || result.households || 0;

  const populationZones = generatePopulationZones(center, radiusMeters, totalPop, language);

  // Competitors (Overpass — already global)
  let competitors: CompetitorStore[];
  try {
    competitors = await fetchCompetitorsFromOverpass(center, radiusMeters, industry);
    if (competitors.length === 0) {
      competitors = generateCompetitorMarkers(center, radiusMeters, result, language);
    }
  } catch {
    competitors = generateCompetitorMarkers(center, radiusMeters, result, language);
  }

  // Age distribution: prefer census data, fallback to AI
  let ageDistribution: { ageGroup: string; percentage: number; count: number }[] = [];
  if (censusData?.ageDistribution?.length) {
    ageDistribution = censusData.ageDistribution.map((ag) => ({
      ageGroup: ag.ageGroup,
      percentage: ag.percentage,
      count: ag.population,
    }));
  } else if (result.ageDistribution?.length) {
    ageDistribution = result.ageDistribution;
  }

  const finalCensusData: CensusData | null = censusData
    || (apiCensus ? { ...apiCensus, dataAvailable: true } as CensusData : null);

  return {
    center,
    populationZones,
    competitors,
    censusData: finalCensusData,
    countryCode,
    isOverseas,
    summary: {
      totalPopulation: totalPop,
      totalHouseholds,
      ageDistribution,
      householdTypes: result.householdTypes || [],
      competitorCount: competitors.length,
      tradeAreaScore: calculateTradeAreaScore(result),
      recommendations: extractRecommendations(result, language),
      dataSource,
      primaryTarget: result.primaryTarget,
      areaCharacteristics: result.areaCharacteristics,
      competitiveEnvironment: result.competitiveEnvironment,
    },
  };
}

function parseRadiusToMeters(radius: string): number {
  const km = parseFloat(radius.replace("km", "")) || 3;
  return km * 1000;
}

function generatePopulationZones(
  center: [number, number],
  radiusMeters: number,
  totalPop: number,
  language: string = "ja"
): PopulationZone[] {
  if (totalPop <= 0) return [];
  const zones: PopulationZone[] = [];
  const isEn = language === "en";
  const directions = [
    { label: isEn ? "North" : "北部", offset: [0.005, 0] },
    { label: isEn ? "East" : "東部", offset: [0, 0.006] },
    { label: isEn ? "South" : "南部", offset: [-0.005, 0] },
    { label: isEn ? "West" : "西部", offset: [0, -0.006] },
    { label: isEn ? "Center" : "中心部", offset: [0, 0] },
    { label: isEn ? "Northeast" : "北東部", offset: [0.004, 0.004] },
    { label: isEn ? "Southwest" : "南西部", offset: [-0.004, -0.004] },
  ];

  directions.forEach((dir, i) => {
    const pop = Math.round(totalPop * (0.08 + Math.random() * 0.12));
    const density = pop > totalPop * 0.13 ? "high" : pop > totalPop * 0.09 ? "medium" : "low";
    zones.push({
      id: `zone-${i}`,
      center: [center[0] + dir.offset[0], center[1] + dir.offset[1]],
      radius: radiusMeters * 0.25,
      population: pop,
      density,
      label: dir.label,
    });
  });

  return zones;
}

function generateCompetitorMarkers(
  center: [number, number],
  radiusMeters: number,
  result: any,
  language: string = "ja"
): CompetitorStore[] {
  const count = Math.max(3, Math.min(12, Math.floor(Math.random() * 5) + 5));
  const competitors: CompetitorStore[] = [];
  const isEn = language === "en";
  const industries = isEn
    ? ["Restaurant", "Retail", "Salon", "Convenience", "Pharmacy", "Cafe", "Fitness", "Laundry"]
    : ["飲食店", "小売店", "美容院", "コンビニ", "薬局", "カフェ", "フィットネス", "クリーニング"];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = (0.2 + Math.random() * 0.7) * radiusMeters;
    const latOffset = (dist / 111000) * Math.cos(angle);
    const lngOffset = (dist / (111000 * Math.cos((center[0] * Math.PI) / 180))) * Math.sin(angle);

    competitors.push({
      id: `comp-${i}`,
      name: `${industries[i % industries.length]}${isEn ? " " : ""}${i + 1}`,
      lat: center[0] + latOffset,
      lng: center[1] + lngOffset,
      industry: industries[i % industries.length],
      distance: Math.round(dist),
    });
  }

  return competitors;
}

function calculateTradeAreaScore(result: any): number {
  let score = 50;
  if (result.population > 80000) score += 15;
  else if (result.population > 40000) score += 8;
  if (result.suitableIndustries?.length > 3) score += 10;
  if (result.visitMotivations?.length > 3) score += 8;
  if (result.unsuitableIndustries?.length < 2) score += 5;
  return Math.min(100, Math.max(0, score + Math.floor(Math.random() * 12)));
}

function extractRecommendations(result: any, language: string = "ja"): string[] {
  const isEn = language === "en";
  const recs: string[] = [];
  if (result.primaryTarget) recs.push(`${isEn ? "Primary Target: " : "主要ターゲット: "}${result.primaryTarget}`);
  if (result.suitableIndustries?.[0]) {
    const ind = result.suitableIndustries[0];
    recs.push(isEn ? `Best Industry: ${ind.industry} (${ind.reason})` : `最適業種: ${ind.industry}（${ind.reason}）`);
  }
  if (result.visitMotivations?.length > 0) {
    const sep = isEn ? ", " : "、";
    recs.push(`${isEn ? "Visit Motivations: " : "来店動機: "}${result.visitMotivations.slice(0, 3).join(sep)}`);
  }
  if (result.areaCharacteristics) recs.push(result.areaCharacteristics);
  if (recs.length === 0) recs.push(isEn ? "Run an analysis to get data" : "データを取得して分析を実行してください");
  return recs;
}
