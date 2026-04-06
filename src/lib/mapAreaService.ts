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

export type TradeAreaSummary = {
  totalPopulation: number;
  ageDistribution: { ageGroup: string; percentage: number; count: number }[];
  householdTypes: { type: string; percentage: number; count: number }[];
  competitorCount: number;
  tradeAreaScore: number; // 0-100
  recommendations: string[];
};

export type MapAreaAnalysisResult = {
  center: [number, number];
  populationZones: PopulationZone[];
  competitors: CompetitorStore[];
  summary: TradeAreaSummary;
};

// Fetch map-based area analysis from API
export async function fetchMapAreaAnalysis(
  address: string,
  radius: string,
  industry?: string
): Promise<MapAreaAnalysisResult> {
  const { data, error } = await supabase.functions.invoke("area-analysis", {
    body: { address, radius, industry, analysisType: "area" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  // Transform API result to map-compatible format
  const result = data.result;
  const radiusMeters = parseRadiusToMeters(radius);

  // Default center (Tokyo Station) – will be overridden when geocoding is available
  const center: [number, number] = [35.6812, 139.7671];

  const populationZones = generatePopulationZones(center, radiusMeters, result);
  const competitors = generateCompetitorMarkers(center, radiusMeters, result);

  return {
    center,
    populationZones,
    competitors,
    summary: {
      totalPopulation: result.population || 0,
      ageDistribution: result.ageDistribution || [],
      householdTypes: result.householdTypes || [],
      competitorCount: competitors.length,
      tradeAreaScore: calculateTradeAreaScore(result),
      recommendations: extractRecommendations(result),
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
  result: any
): PopulationZone[] {
  const totalPop = result.population || 50000;
  const zones: PopulationZone[] = [];
  const directions = [
    { label: "北部", offset: [0.005, 0] },
    { label: "東部", offset: [0, 0.006] },
    { label: "南部", offset: [-0.005, 0] },
    { label: "西部", offset: [0, -0.006] },
    { label: "中心部", offset: [0, 0] },
    { label: "北東部", offset: [0.004, 0.004] },
    { label: "南西部", offset: [-0.004, -0.004] },
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
  result: any
): CompetitorStore[] {
  const envText = result.competitiveEnvironment || "";
  const count = Math.max(3, Math.min(12, Math.floor(Math.random() * 5) + 5));
  const competitors: CompetitorStore[] = [];

  const industries = ["飲食店", "小売店", "美容院", "コンビニ", "薬局", "カフェ", "フィットネス", "クリーニング"];

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count + (Math.random() - 0.5) * 0.5;
    const dist = (0.2 + Math.random() * 0.7) * radiusMeters;
    const latOffset = (dist / 111000) * Math.cos(angle);
    const lngOffset = (dist / (111000 * Math.cos((center[0] * Math.PI) / 180))) * Math.sin(angle);

    competitors.push({
      id: `comp-${i}`,
      name: `${industries[i % industries.length]}${i + 1}`,
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

function extractRecommendations(result: any): string[] {
  const recs: string[] = [];
  if (result.primaryTarget) recs.push(`主要ターゲット: ${result.primaryTarget}`);
  if (result.suitableIndustries?.[0]) {
    recs.push(`最適業種: ${result.suitableIndustries[0].industry}（${result.suitableIndustries[0].reason}）`);
  }
  if (result.visitMotivations?.length > 0) {
    recs.push(`来店動機: ${result.visitMotivations.slice(0, 3).join("、")}`);
  }
  if (result.areaCharacteristics) recs.push(result.areaCharacteristics);
  if (recs.length === 0) recs.push("データを取得して分析を実行してください");
  return recs;
}
