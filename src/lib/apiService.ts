import { supabase } from "@/integrations/supabase/client";

// Generic API fetch wrapper for future external API integration
export async function fetchFromAPI<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(endpoint, { body });
  if (error) throw new Error(error.message || "API呼び出しに失敗しました");
  if (data?.error) throw new Error(data.error);
  return data.result as T;
}

// Trade area analysis
export type TradeAreaData = {
  areaName: string;
  population: number;
  households: number;
  ageDistribution: { ageGroup: string; percentage: number; count: number }[];
  householdTypes: { type: string; percentage: number; count: number }[];
  primaryTarget: string;
  competitiveEnvironment: string;
  areaCharacteristics: string;
  suitableIndustries: { industry: string; reason: string; score: number }[];
  unsuitableIndustries: { industry: string; reason: string }[];
  visitMotivations: string[];
};

export async function fetchTradeAreaAnalysis(
  address: string,
  radius: string,
  industry?: string
): Promise<{ result: TradeAreaData; censusData?: any; dataSource: string }> {
  const { data, error } = await supabase.functions.invoke("area-analysis", {
    body: { address, radius, industry, analysisType: "area" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

// Ad proposal
export async function fetchAdProposal(params: {
  address: string;
  industry: string;
  budget?: string;
  target?: string;
  storeName?: string;
}) {
  return fetchFromAPI("ad-proposal", params);
}

// Flyer plan
export async function fetchFlyerPlan(params: {
  address: string;
  industry: string;
  budget?: string;
  target?: string;
  storeName?: string;
}) {
  return fetchFromAPI("flyer-plan", params);
}

// Location match
export async function fetchLocationMatch(params: {
  industry: string;
  serviceDescription: string;
  targetAudience?: string;
  budget?: string;
  currentLocation?: string;
  preferences?: string;
}) {
  return fetchFromAPI("location-match", params);
}
