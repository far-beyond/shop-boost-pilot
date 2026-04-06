import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CENSUS_BASE = "https://api.census.gov/data/2020/dec/pl";
const GEOCODER_BASE = "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";

// Resolve lat/lng to FIPS codes via Census Geocoder
async function resolveGeoFips(
  lat: number,
  lng: number
): Promise<{ state: string; county: string; tract: string; displayName: string } | null> {
  const url = `${GEOCODER_BASE}?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Census2020_Current&format=json`;
  console.log(`Census Geocoder request: lat=${lat}, lng=${lng}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Geocoder HTTP error: ${res.status}`);
      await res.text();
      return null;
    }
    const data = await res.json();
    const geographies = data?.result?.geographies;
    if (!geographies) return null;

    // Try Census Tracts first, then Counties
    const tracts = geographies["Census Tracts"] || geographies["2020 Census Blocks"];
    if (tracts && tracts.length > 0) {
      const t = tracts[0];
      return {
        state: t.STATE || "",
        county: t.COUNTY || "",
        tract: t.TRACT || t.BLKGRP || "",
        displayName: t.BASENAME || t.NAME || `Tract ${t.TRACT}`,
      };
    }

    const counties = geographies["Counties"];
    if (counties && counties.length > 0) {
      const c = counties[0];
      return {
        state: c.STATE || "",
        county: c.COUNTY || "",
        tract: "*",
        displayName: c.BASENAME || c.NAME || `County ${c.COUNTY}`,
      };
    }

    return null;
  } catch (e) {
    console.error("Geocoder error:", e);
    return null;
  }
}

// Fetch population data from Census API
async function fetchCensusPopulation(
  apiKey: string,
  state: string,
  county: string,
  tract: string
): Promise<{
  totalPopulation: number;
  hispanicPopulation: number;
  whitePopulation: number;
  blackPopulation: number;
  asianPopulation: number;
  totalHouseholds: number;
} | null> {
  // P1_001N = Total population
  // P2_002N = Hispanic or Latino
  // P2_005N = White alone (not Hispanic)
  // P2_006N = Black alone (not Hispanic)
  // P2_008N = Asian alone (not Hispanic)
  // H1_001N = Total housing units
  // H1_002N = Occupied housing units (households)
  const vars = "P1_001N,P2_002N,P2_005N,P2_006N,P2_008N,H1_001N,H1_002N";

  let geoParam: string;
  if (tract && tract !== "*") {
    geoParam = `for=tract:${tract}&in=state:${state}+county:${county}`;
  } else {
    geoParam = `for=county:${county}&in=state:${state}`;
  }

  const url = `${CENSUS_BASE}?get=${vars}&${geoParam}&key=${apiKey}`;
  console.log(`Census API request: state=${state}, county=${county}, tract=${tract}`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error(`Census API HTTP ${res.status}: ${text}`);
      return null;
    }
    const data = await res.json();
    if (!data || data.length < 2) return null;

    // First row is headers, second row is values
    const headers: string[] = data[0];
    const values: string[] = data[1];

    const getVal = (name: string): number => {
      const idx = headers.indexOf(name);
      return idx >= 0 ? parseInt(values[idx], 10) || 0 : 0;
    };

    return {
      totalPopulation: getVal("P1_001N"),
      hispanicPopulation: getVal("P2_002N"),
      whitePopulation: getVal("P2_005N"),
      blackPopulation: getVal("P2_006N"),
      asianPopulation: getVal("P2_008N"),
      totalHouseholds: getVal("H1_002N") || getVal("H1_001N"),
    };
  } catch (e) {
    console.error("Census API error:", e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("US_CENSUS_API_KEY");
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: "US Census API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lng } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "lat and lng are required as numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`US Census lookup: lat=${lat}, lng=${lng}`);

    // Step 1: Resolve coordinates to FIPS
    const fips = await resolveGeoFips(lat, lng);
    if (!fips) {
      return new Response(
        JSON.stringify({
          result: {
            source: "US Census Bureau (2020)",
            areaName: "Unknown area",
            areaCode: "",
            totalPopulation: 0,
            totalHouseholds: 0,
            ageDistribution: [],
            dataAvailable: false,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Fetch census data
    const census = await fetchCensusPopulation(API_KEY, fips.state, fips.county, fips.tract);

    // Build age distribution estimate (Census PL doesn't have detailed age, approximate)
    const ageDistribution = census && census.totalPopulation > 0
      ? [
          { ageGroup: "Under 18", population: Math.round(census.totalPopulation * 0.22), percentage: 22.0 },
          { ageGroup: "18-34", population: Math.round(census.totalPopulation * 0.22), percentage: 22.0 },
          { ageGroup: "35-54", population: Math.round(census.totalPopulation * 0.26), percentage: 26.0 },
          { ageGroup: "55-64", population: Math.round(census.totalPopulation * 0.13), percentage: 13.0 },
          { ageGroup: "65+", population: Math.round(census.totalPopulation * 0.17), percentage: 17.0 },
        ]
      : [];

    const result = {
      source: "US Census Bureau (2020 Decennial)",
      areaName: fips.displayName,
      areaCode: `${fips.state}${fips.county}${fips.tract}`,
      totalPopulation: census?.totalPopulation || 0,
      totalHouseholds: census?.totalHouseholds || 0,
      malePopulation: 0,
      femalePopulation: 0,
      ageDistribution,
      dataAvailable: !!(census && census.totalPopulation > 0),
      demographics: census
        ? {
            hispanic: census.hispanicPopulation,
            white: census.whitePopulation,
            black: census.blackPopulation,
            asian: census.asianPopulation,
          }
        : null,
    };

    console.log(`US Census result: pop=${result.totalPopulation}, households=${result.totalHouseholds}, area=${fips.displayName}`);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("us-census error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
