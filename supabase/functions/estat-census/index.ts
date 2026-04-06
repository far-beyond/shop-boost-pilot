import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ESTAT_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";

// 令和2年国勢調査 statsDataIds
const CENSUS_STATS = {
  // 人口等基本集計 - 男女別人口及び世帯の種類別世帯数 (市区町村)
  population: "0003445078",
  // 人口等基本集計 - 年齢(5歳階級)、男女別人口 (市区町村)
  agePopulation: "0003445094",
  // 人口等基本集計 - 世帯人員別一般世帯数 (市区町村)
  households: "0003445109",
};

// Prefecture name to code mapping
const PREFECTURE_CODES: Record<string, string> = {
  "北海道": "01", "青森": "02", "岩手": "03", "宮城": "04", "秋田": "05",
  "山形": "06", "福島": "07", "茨城": "08", "栃木": "09", "群馬": "10",
  "埼玉": "11", "千葉": "12", "東京": "13", "神奈川": "14", "新潟": "15",
  "富山": "16", "石川": "17", "福井": "18", "山梨": "19", "長野": "20",
  "岐阜": "21", "静岡": "22", "愛知": "23", "三重": "24", "滋賀": "25",
  "京都": "26", "大阪": "27", "兵庫": "28", "奈良": "29", "和歌山": "30",
  "鳥取": "31", "島根": "32", "岡山": "33", "広島": "34", "山口": "35",
  "徳島": "36", "香川": "37", "愛媛": "38", "高知": "39", "福岡": "40",
  "佐賀": "41", "長崎": "42", "熊本": "43", "大分": "44", "宮崎": "45",
  "鹿児島": "46", "沖縄": "47",
};

function extractPrefecture(address: string): string | null {
  // Match 都道府県
  const match = address.match(/(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/);
  if (!match) return null;
  const name = match[1].replace(/[都府県]$/, "");
  return name;
}

function extractCity(address: string): string | null {
  // After prefecture, extract city/ward/town
  const match = address.match(/(?:北海道|東京都|(?:京都|大阪)府|.{2,3}県)(.+?[市区町村郡])/);
  return match ? match[1] : null;
}

async function fetchEstatData(appId: string, statsDataId: string, cdArea: string): Promise<any> {
  const url = `${ESTAT_BASE}/getStatsData?appId=${appId}&statsDataId=${statsDataId}&cdArea=${cdArea}&metaGetFlg=Y&cntGetFlg=N&sectionHeaderFlg=1`;
  
  console.log(`Fetching e-Stat: statsDataId=${statsDataId}, cdArea=${cdArea}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`e-Stat API error: ${res.status}`);
    return null;
  }
  const data = await res.json();
  
  const status = data?.GET_STATS_DATA?.RESULT?.STATUS;
  if (status && status !== 0) {
    console.error(`e-Stat data error: ${status}`);
    return null;
  }
  
  return data?.GET_STATS_DATA?.STATISTICAL_DATA || null;
}

async function findAreaCode(appId: string, address: string): Promise<{ code: string; name: string } | null> {
  const prefName = extractPrefecture(address);
  if (!prefName) return null;

  const prefCode = PREFECTURE_CODES[prefName];
  if (!prefCode) return null;

  const cityName = extractCity(address);
  console.log(`Extracted: pref=${prefName}(${prefCode}), city=${cityName}`);

  // Fetch area classifications from the population table using prefecture code
  const url = `${ESTAT_BASE}/getStatsData?appId=${appId}&statsDataId=${CENSUS_STATS.population}&cdArea=${prefCode}&metaGetFlg=Y&cntGetFlg=N&explanationGetFlg=N&limit=1`;
  
  console.log(`Fetching area list: ${url.replace(appId, '***')}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`e-Stat area fetch error: ${res.status}`);
    // Fallback: use prefecture-level code
    return { code: prefCode + "000", name: prefName };
  }
  
  const data = await res.json();
  
  // Check for API errors
  const status = data?.GET_STATS_DATA?.RESULT?.STATUS;
  if (status && status !== 0) {
    console.error(`e-Stat API status: ${status}, msg: ${data?.GET_STATS_DATA?.RESULT?.ERROR_MSG}`);
    return { code: prefCode + "000", name: prefName };
  }

  const classInfo = data?.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ;
  if (!classInfo) {
    console.log("No CLASS_INF found, using prefecture code");
    return { code: prefCode + "000", name: prefName };
  }

  // Find area classification
  const classArr = Array.isArray(classInfo) ? classInfo : [classInfo];
  const areaClass = classArr.find((c: any) => c["@id"] === "area");

  if (!areaClass) {
    console.log("No area class found, using prefecture code");
    return { code: prefCode + "000", name: prefName };
  }

  const classes = Array.isArray(areaClass.CLASS) ? areaClass.CLASS : [areaClass.CLASS];
  console.log(`Found ${classes.length} area codes`);

  // Try to match city name
  if (cityName) {
    const searchName = cityName.replace(/[市区町村郡]$/, "");
    const match = classes.find((c: any) => {
      const name = c["@name"] || "";
      return name.includes(searchName);
    });
    if (match) {
      console.log(`Matched city: ${match["@name"]} (${match["@code"]})`);
      return { code: match["@code"], name: match["@name"] };
    }
    console.log(`No match for city: ${searchName}`);
  }

  // Fallback: use prefecture-level data
  return { code: prefCode + "000", name: prefName };
}

function parsePopulationData(statData: any): { totalPopulation: number; malePopulation: number; femalePopulation: number; totalHouseholds: number } {
  const result = { totalPopulation: 0, malePopulation: 0, femalePopulation: 0, totalHouseholds: 0 };
  if (!statData?.DATA_INF?.VALUE) return result;

  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val < 0) continue;

    // Parse based on category codes
    const cat01 = v["@cat01"] || "";
    // cat01 codes: typically "000" = total population, "001" = male, "002" = female
    // This varies by table, so we look at tab code too
    const tab = v["@tab"] || "";

    if (tab === "020" || cat01.includes("T")) {
      // Total population
      if (val > result.totalPopulation) result.totalPopulation = val;
    }
  }

  // Simpler approach: just get all values and identify by position
  const nums = values
    .map((v: any) => parseInt(v["$"] || "0", 10))
    .filter((n: number) => !isNaN(n) && n > 0);

  if (nums.length >= 1) result.totalPopulation = nums[0];
  if (nums.length >= 2) result.malePopulation = nums[1];
  if (nums.length >= 3) result.femalePopulation = nums[2];
  if (nums.length >= 4) result.totalHouseholds = nums[3];

  return result;
}

function parseAgeData(statData: any): { ageGroup: string; population: number; percentage: number }[] {
  if (!statData?.DATA_INF?.VALUE) return [];

  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  // Get class info for age categories
  const classInfo = statData?.CLASS_INF?.CLASS_OBJ;
  const catClass = Array.isArray(classInfo)
    ? classInfo.find((c: any) => c["@id"] === "cat01")
    : null;

  const catLabels: Record<string, string> = {};
  if (catClass) {
    const cats = Array.isArray(catClass.CLASS) ? catClass.CLASS : [catClass.CLASS];
    for (const c of cats) {
      catLabels[c["@code"]] = c["@name"] || "";
    }
  }

  // Group by age categories
  const ageGroups: Record<string, number> = {};
  let totalPop = 0;

  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val < 0) continue;

    const cat01 = v["@cat01"] || "";
    const label = catLabels[cat01] || cat01;

    // Skip totals
    if (label.includes("総数") || label.includes("合計")) {
      if (val > totalPop) totalPop = val;
      continue;
    }

    // Map 5-year age groups to broader groups
    if (label.match(/[0-9]/)) {
      ageGroups[label] = (ageGroups[label] || 0) + val;
    }
  }

  // Consolidate into standard groups
  const consolidated: Record<string, number> = {
    "0〜14歳": 0, "15〜24歳": 0, "25〜34歳": 0, "35〜44歳": 0,
    "45〜54歳": 0, "55〜64歳": 0, "65歳以上": 0,
  };

  for (const [label, count] of Object.entries(ageGroups)) {
    const ageMatch = label.match(/(\d+)/);
    if (!ageMatch) continue;
    const age = parseInt(ageMatch[1], 10);
    if (age < 15) consolidated["0〜14歳"] += count;
    else if (age < 25) consolidated["15〜24歳"] += count;
    else if (age < 35) consolidated["25〜34歳"] += count;
    else if (age < 45) consolidated["35〜44歳"] += count;
    else if (age < 55) consolidated["45〜54歳"] += count;
    else if (age < 65) consolidated["55〜64歳"] += count;
    else consolidated["65歳以上"] += count;
  }

  const total = Object.values(consolidated).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(consolidated)
    .filter(([, count]) => count > 0)
    .map(([ageGroup, population]) => ({
      ageGroup,
      population,
      percentage: Math.round((population / total) * 1000) / 10,
    }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ESTAT_API_KEY = Deno.env.get("ESTAT_API_KEY");
    if (!ESTAT_API_KEY) {
      return new Response(JSON.stringify({ error: "e-Stat APIキーが設定されていません" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { address } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: "住所が必要です" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Census lookup for: ${address}`);

    // Find area code
    const area = await findAreaCode(ESTAT_API_KEY, address);
    if (!area) {
      return new Response(JSON.stringify({
        error: "住所から地域コードを特定できませんでした",
        suggestion: "都道府県名と市区町村名を含む住所を入力してください",
      }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found area: ${area.name} (${area.code})`);

    // Fetch census data in parallel
    const [popData, ageData, householdData] = await Promise.all([
      fetchEstatData(ESTAT_API_KEY, CENSUS_STATS.population, area.code),
      fetchEstatData(ESTAT_API_KEY, CENSUS_STATS.agePopulation, area.code),
      fetchEstatData(ESTAT_API_KEY, CENSUS_STATS.households, area.code),
    ]);

    const population = popData ? parsePopulationData(popData) : null;
    const ageDistribution = ageData ? parseAgeData(ageData) : [];

    // Parse household data
    let householdCount = 0;
    if (householdData?.DATA_INF?.VALUE) {
      const vals = Array.isArray(householdData.DATA_INF.VALUE)
        ? householdData.DATA_INF.VALUE
        : [householdData.DATA_INF.VALUE];
      const firstVal = parseInt(vals[0]?.["$"] || "0", 10);
      if (!isNaN(firstVal) && firstVal > 0) householdCount = firstVal;
    }

    const result = {
      areaCode: area.code,
      areaName: area.name,
      source: "e-Stat 令和2年国勢調査",
      totalPopulation: population?.totalPopulation || 0,
      malePopulation: population?.malePopulation || 0,
      femalePopulation: population?.femalePopulation || 0,
      totalHouseholds: householdCount || population?.totalHouseholds || 0,
      ageDistribution,
      dataAvailable: !!(population && population.totalPopulation > 0),
    };

    console.log(`Census result: pop=${result.totalPopulation}, households=${result.totalHouseholds}, age groups=${ageDistribution.length}`);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estat-census error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
