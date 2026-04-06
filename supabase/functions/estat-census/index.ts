import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ESTAT_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";

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

// Tokyo 23 wards municipality codes
const TOKYO_WARDS: Record<string, string> = {
  "千代田区": "13101", "中央区": "13102", "港区": "13103", "新宿区": "13104",
  "文京区": "13105", "台東区": "13106", "墨田区": "13107", "江東区": "13108",
  "品川区": "13109", "目黒区": "13110", "大田区": "13111", "世田谷区": "13112",
  "渋谷区": "13113", "中野区": "13114", "杉並区": "13115", "豊島区": "13116",
  "北区": "13117", "荒川区": "13118", "板橋区": "13119", "練馬区": "13120",
  "足立区": "13121", "葛飾区": "13122", "江戸川区": "13123",
};

// Major cities municipality codes
const MAJOR_CITIES: Record<string, string> = {
  "札幌市": "01100", "仙台市": "04100", "さいたま市": "11100",
  "千葉市": "12100", "横浜市": "14100", "川崎市": "14130", "相模原市": "14150",
  "新潟市": "15100", "静岡市": "22100", "浜松市": "22130",
  "名古屋市": "23100", "京都市": "26100", "大阪市": "27100", "堺市": "27140",
  "神戸市": "28100", "岡山市": "33100", "広島市": "34100", "北九州市": "40100",
  "福岡市": "40130", "熊本市": "43100",
};

function extractPrefecture(address: string): string | null {
  const match = address.match(/(北海道|東京都|(?:京都|大阪)府|.{2,3}県)/);
  if (!match) return null;
  return match[1].replace(/[都府県]$/, "");
}

function extractCity(address: string): string | null {
  const match = address.match(/(?:北海道|東京都|(?:京都|大阪)府|.{2,3}県)(.+?[市区町村])/);
  return match ? match[1] : null;
}

function resolveAreaCode(address: string): { code: string; name: string } | null {
  const prefName = extractPrefecture(address);
  if (!prefName) return null;
  const prefCode = PREFECTURE_CODES[prefName];
  if (!prefCode) return null;

  const cityName = extractCity(address);
  console.log(`Extracted: pref=${prefName}(${prefCode}), city=${cityName}`);

  if (cityName) {
    // Check Tokyo wards
    if (prefCode === "13" && TOKYO_WARDS[cityName]) {
      return { code: TOKYO_WARDS[cityName], name: cityName };
    }
    // Check major cities
    if (MAJOR_CITIES[cityName]) {
      return { code: MAJOR_CITIES[cityName], name: cityName };
    }
  }

  // Fallback to prefecture level
  return { code: prefCode + "000", name: prefName };
}

async function fetchEstatData(appId: string, statsDataId: string, cdArea: string): Promise<any> {
  const url = `${ESTAT_BASE}/getStatsData?appId=${appId}&statsDataId=${statsDataId}&cdArea=${cdArea}&metaGetFlg=Y&cntGetFlg=N&sectionHeaderFlg=1`;
  console.log(`Fetching e-Stat: table=${statsDataId}, area=${cdArea}`);
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`e-Stat HTTP error: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const status = data?.GET_STATS_DATA?.RESULT?.STATUS;
  if (status && status !== 0) {
    const msg = data?.GET_STATS_DATA?.RESULT?.ERROR_MSG || "";
    console.error(`e-Stat status ${status}: ${msg}`);
    return null;
  }
  return data?.GET_STATS_DATA?.STATISTICAL_DATA || null;
}

function parsePopulationData(statData: any): { totalPopulation: number; malePopulation: number; femalePopulation: number; totalHouseholds: number } {
  const result = { totalPopulation: 0, malePopulation: 0, femalePopulation: 0, totalHouseholds: 0 };
  if (!statData?.DATA_INF?.VALUE) return result;

  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  // Table 0003445078 structure: cat01 "0"=総数, "1"=男, "2"=女
  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val <= 0) continue;
    const cat01 = v["@cat01"] || "";
    if (cat01 === "0") result.totalPopulation = val;
    else if (cat01 === "1") result.malePopulation = val;
    else if (cat01 === "2") result.femalePopulation = val;
  }

  return result;
}

function parseAgeData(statData: any): { ageGroup: string; population: number; percentage: number }[] {
  if (!statData?.DATA_INF?.VALUE) return [];

  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  const classInfo = statData?.CLASS_INF?.CLASS_OBJ;
  const classArr = Array.isArray(classInfo) ? classInfo : classInfo ? [classInfo] : [];
  
  const catLabels: Record<string, string> = {};
  for (const cls of classArr) {
    if (cls["@id"] === "cat01") {
      const items = Array.isArray(cls.CLASS) ? cls.CLASS : cls.CLASS ? [cls.CLASS] : [];
      for (const item of items) {
        catLabels[item["@code"]] = item["@name"] || "";
      }
    }
  }

  // Collect total-sex age data only (skip male/female breakdowns)
  const ageValues: { label: string; val: number }[] = [];
  
  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val <= 0) continue;
    const cat01 = v["@cat01"] || "";
    const cat02 = v["@cat02"] || "";
    const label = catLabels[cat01] || cat01;
    
    // Only use "総数" (both sexes) rows - cat02 typically "000" or first code
    // Skip if explicitly male or female
    if (label.includes("男") || label.includes("女")) continue;
    if (cat02 && cat02 !== "000" && cat02 !== "001") continue;
    
    if (label.includes("総数") || label.includes("合計") || label.includes("年齢「不詳」")) continue;
    if (label.match(/\d/)) {
      ageValues.push({ label, val });
    }
  }

  // Consolidate into standard groups
  const consolidated: Record<string, number> = {
    "0〜14歳": 0, "15〜24歳": 0, "25〜34歳": 0, "35〜44歳": 0,
    "45〜54歳": 0, "55〜64歳": 0, "65歳以上": 0,
  };

  for (const { label, val } of ageValues) {
    const ageMatch = label.match(/(\d+)/);
    if (!ageMatch) continue;
    const age = parseInt(ageMatch[1], 10);
    if (age < 15) consolidated["0〜14歳"] += val;
    else if (age < 25) consolidated["15〜24歳"] += val;
    else if (age < 35) consolidated["25〜34歳"] += val;
    else if (age < 45) consolidated["35〜44歳"] += val;
    else if (age < 55) consolidated["45〜54歳"] += val;
    else if (age < 65) consolidated["55〜64歳"] += val;
    else consolidated["65歳以上"] += val;
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

    const area = resolveAreaCode(address);
    if (!area) {
      return new Response(JSON.stringify({
        error: "住所から地域コードを特定できませんでした",
        suggestion: "都道府県名と市区町村名を含む住所を入力してください",
      }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Resolved area: ${area.name} (${area.code})`);

    // 令和2年国勢調査 - use getStatsList to find tables, or use known working IDs
    // Table: 人口等基本集計 全国 ... 市区町村
    // Try multiple statsDataIds for robustness
    const populationIds = ["0003445078", "0003448237"];
    const ageIds = ["0003445094", "0003448303"];
    const householdIds = ["0003445109", "0003448357"];

    // Fetch all in parallel, try primary IDs first
    const [popData, ageData, householdData] = await Promise.all([
      fetchWithFallback(ESTAT_API_KEY, populationIds, area.code),
      fetchWithFallback(ESTAT_API_KEY, ageIds, area.code),
      fetchWithFallback(ESTAT_API_KEY, householdIds, area.code),
    ]);

    const population = popData ? parsePopulationData(popData) : null;
    const ageDistribution = ageData ? parseAgeData(ageData) : [];

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

async function fetchWithFallback(appId: string, statsDataIds: string[], cdArea: string): Promise<any> {
  for (const id of statsDataIds) {
    const data = await fetchEstatData(appId, id, cdArea);
    if (data?.DATA_INF?.VALUE) return data;
  }
  return null;
}
