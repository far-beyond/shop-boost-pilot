import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ISO 2-letter to ISO 3-letter country code mapping (common countries)
const ISO2_TO_ISO3: Record<string, string> = {
  af: "AFG", al: "ALB", dz: "DZA", ar: "ARG", au: "AUS", at: "AUT",
  bd: "BGD", be: "BEL", br: "BRA", bg: "BGR", kh: "KHM", ca: "CAN",
  cl: "CHL", cn: "CHN", co: "COL", hr: "HRV", cz: "CZE", dk: "DNK",
  eg: "EGY", et: "ETH", fi: "FIN", fr: "FRA", de: "DEU", gh: "GHA",
  gr: "GRC", hk: "HKG", hu: "HUN", in: "IND", id: "IDN", ir: "IRN",
  iq: "IRQ", ie: "IRL", il: "ISR", it: "ITA", ke: "KEN", kr: "KOR",
  kw: "KWT", my: "MYS", mx: "MEX", ma: "MAR", mm: "MMR", np: "NPL",
  nl: "NLD", nz: "NZL", ng: "NGA", no: "NOR", pk: "PAK", pe: "PER",
  ph: "PHL", pl: "POL", pt: "PRT", qa: "QAT", ro: "ROU", ru: "RUS",
  sa: "SAU", sg: "SGP", za: "ZAF", es: "ESP", lk: "LKA", se: "SWE",
  ch: "CHE", tw: "TWN", th: "THA", tr: "TUR", ua: "UKR", ae: "ARE",
  gb: "GBR", us: "USA", vn: "VNM", zm: "ZMB", zw: "ZWE",
};

// WorldPop WOPR API for point-based population estimation
async function fetchWorldPopData(
  lat: number,
  lng: number,
  iso3: string
): Promise<{ population: number; confidence: string } | null> {
  try {
    // Use WOPR point total API
    const url = `https://wopr.worldpop.org/api/v1.0/wopr/pointtotal/${iso3}/v2.0/1?lat=${lat}&lon=${lng}`;
    console.log(`WorldPop request: ${url}`);

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const text = await res.text();
      console.error(`WorldPop HTTP ${res.status}: ${text}`);
      return null;
    }

    const data = await res.json();
    console.log(`WorldPop response:`, JSON.stringify(data).substring(0, 500));

    // WOPR returns population estimate in the data
    if (data?.data) {
      const pop = data.data.pop_mean || data.data.mean || data.data.population || 0;
      const ci = data.data.pop_ci || "";
      return {
        population: Math.round(pop),
        confidence: ci ? `95% CI: ${ci}` : "medium",
      };
    }

    return null;
  } catch (e) {
    console.error("WorldPop API error:", e);
    return null;
  }
}

// Fallback: estimate from Overpass facility density
async function estimateFromOverpass(
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<{ population: number; facilityCount: number }> {
  try {
    const query = `[out:json][timeout:10];
(
  node["building"](around:${radiusMeters},${lat},${lng});
  node["amenity"](around:${radiusMeters},${lat},${lng});
  node["shop"](around:${radiusMeters},${lat},${lng});
);
out count;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) {
      await res.text();
      return { population: 0, facilityCount: 0 };
    }
    const data = await res.json();
    const count = data.elements?.[0]?.tags?.total
      ? parseInt(data.elements[0].tags.total, 10)
      : data.elements?.length || 0;

    return {
      population: Math.max(500, count * 65),
      facilityCount: count,
    };
  } catch {
    return { population: 0, facilityCount: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lat, lng, countryCode, radiusMeters } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return new Response(
        JSON.stringify({ error: "lat and lng are required as numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cc = (countryCode || "").toLowerCase();
    const iso3 = ISO2_TO_ISO3[cc] || cc.toUpperCase();
    const radius = radiusMeters || 3000;

    console.log(`WorldPop census lookup: lat=${lat}, lng=${lng}, country=${cc}/${iso3}`);

    // Try WorldPop first
    let wpData = await fetchWorldPopData(lat, lng, iso3);

    let totalPopulation = 0;
    let totalHouseholds = 0;
    let source = "WorldPop推計";
    let dataAvailable = false;
    let accuracy: "high" | "medium" | "low" = "low";

    if (wpData && wpData.population > 0) {
      totalPopulation = wpData.population;
      totalHouseholds = Math.round(totalPopulation / 2.8);
      source = `WorldPop (${iso3})`;
      dataAvailable = true;
      accuracy = "medium";
    } else {
      // Fallback to Overpass estimation
      console.log("WorldPop unavailable, falling back to Overpass estimation");
      const overpass = await estimateFromOverpass(lat, lng, radius);
      totalPopulation = overpass.population;
      totalHouseholds = Math.round(totalPopulation / 2.5);
      source = "Overpass API施設密度推定";
      dataAvailable = overpass.facilityCount > 0;
      accuracy = "low";
    }

    // Generic age distribution estimate for international areas
    const ageDistribution =
      totalPopulation > 0
        ? [
            { ageGroup: "0-14", population: Math.round(totalPopulation * 0.26), percentage: 26.0 },
            { ageGroup: "15-24", population: Math.round(totalPopulation * 0.16), percentage: 16.0 },
            { ageGroup: "25-54", population: Math.round(totalPopulation * 0.41), percentage: 41.0 },
            { ageGroup: "55-64", population: Math.round(totalPopulation * 0.08), percentage: 8.0 },
            { ageGroup: "65+", population: Math.round(totalPopulation * 0.09), percentage: 9.0 },
          ]
        : [];

    const result = {
      source,
      areaName: `${cc.toUpperCase()} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      areaCode: iso3,
      totalPopulation,
      totalHouseholds,
      malePopulation: 0,
      femalePopulation: 0,
      ageDistribution,
      dataAvailable,
      accuracy,
    };

    console.log(`WorldPop result: pop=${totalPopulation}, source=${source}, accuracy=${accuracy}`);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("worldpop-census error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
