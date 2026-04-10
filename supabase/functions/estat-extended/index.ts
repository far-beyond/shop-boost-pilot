import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ESTAT_BASE = "https://api.e-stat.go.jp/rest/3.0/app/json";

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

const TOKYO_WARDS: Record<string, string> = {
  "千代田区": "13101", "中央区": "13102", "港区": "13103", "新宿区": "13104",
  "文京区": "13105", "台東区": "13106", "墨田区": "13107", "江東区": "13108",
  "品川区": "13109", "目黒区": "13110", "大田区": "13111", "世田谷区": "13112",
  "渋谷区": "13113", "中野区": "13114", "杉並区": "13115", "豊島区": "13116",
  "北区": "13117", "荒川区": "13118", "板橋区": "13119", "練馬区": "13120",
  "足立区": "13121", "葛飾区": "13122", "江戸川区": "13123",
};

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
  if (cityName) {
    if (prefCode === "13" && TOKYO_WARDS[cityName]) return { code: TOKYO_WARDS[cityName], name: cityName };
    if (MAJOR_CITIES[cityName]) return { code: MAJOR_CITIES[cityName], name: cityName };
  }
  return { code: prefCode + "000", name: prefName };
}

async function fetchEstatData(appId: string, statsDataId: string, cdArea: string): Promise<any> {
  const url = `${ESTAT_BASE}/getStatsData?appId=${appId}&statsDataId=${statsDataId}&cdArea=${cdArea}&metaGetFlg=Y&cntGetFlg=N&sectionHeaderFlg=1`;
  console.log(`Fetching e-Stat extended: table=${statsDataId}, area=${cdArea}`);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const status = data?.GET_STATS_DATA?.RESULT?.STATUS;
    if (status && status !== 0) return null;
    return data?.GET_STATS_DATA?.STATISTICAL_DATA || null;
  } catch {
    return null;
  }
}

// Parse future population projection
function parseFuturePopulation(statData: any): { year: number; population: number }[] {
  if (!statData?.DATA_INF?.VALUE) return [];
  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];
  const results: { year: number; population: number }[] = [];

  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val <= 0) continue;
    // Try to extract year from time code
    const time = v["@time"] || v["@cat01"] || "";
    const yearMatch = time.match(/(20\d{2})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year >= 2020 && year <= 2050) {
        results.push({ year, population: val });
      }
    }
  }
  return results.sort((a, b) => a.year - b.year);
}

// Parse daytime population
function parseDaytimePopulation(statData: any): { daytime: number; nighttime: number; ratio: number } | null {
  if (!statData?.DATA_INF?.VALUE) return null;
  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  let daytime = 0;
  let nighttime = 0;

  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val <= 0) continue;
    const cat = v["@cat01"] || v["@tab"] || "";
    // Common patterns: 昼間人口, 夜間人口(常住人口)
    if (cat.includes("昼") || cat === "010" || cat === "01") {
      if (val > daytime) daytime = val;
    } else if (cat.includes("夜") || cat.includes("常住") || cat === "020" || cat === "02" || cat === "001") {
      if (val > nighttime) nighttime = val;
    }
  }

  // If we only got one value, try first two
  if (daytime === 0 && nighttime === 0 && values.length >= 2) {
    const v1 = parseInt(values[0]["$"] || "0", 10);
    const v2 = parseInt(values[1]["$"] || "0", 10);
    if (v1 > 0 && v2 > 0) {
      daytime = Math.max(v1, v2);
      nighttime = Math.min(v1, v2);
    }
  }

  if (daytime === 0 || nighttime === 0) return null;
  return { daytime, nighttime, ratio: Math.round((daytime / nighttime) * 100) / 100 };
}

// Parse income-based households
function parseIncomeHouseholds(statData: any): { bracket: string; count: number; percentage: number }[] {
  if (!statData?.DATA_INF?.VALUE) return [];
  const values = Array.isArray(statData.DATA_INF.VALUE) ? statData.DATA_INF.VALUE : [statData.DATA_INF.VALUE];

  const brackets: { bracket: string; count: number }[] = [];
  let total = 0;

  const bracketLabels: Record<string, string> = {
    "001": "200万円未満", "002": "200〜300万円", "003": "300〜400万円",
    "004": "400〜500万円", "005": "500〜700万円", "006": "700〜1000万円",
    "007": "1000万円以上",
  };

  for (const v of values) {
    const val = parseInt(v["$"] || "0", 10);
    if (isNaN(val) || val <= 0) continue;
    const cat = v["@cat01"] || v["@cat02"] || "";

    if (cat === "000" || cat === "00" || cat === "100") {
      total = val;
    } else if (bracketLabels[cat]) {
      brackets.push({ bracket: bracketLabels[cat], count: val });
    }
  }

  // If no labeled categories found, try to use raw values
  if (brackets.length === 0) {
    const defaultLabels = ["200万円未満", "200〜400万円", "400〜600万円", "600〜800万円", "800〜1000万円", "1000万円以上"];
    let idx = 0;
    for (const v of values) {
      const val = parseInt(v["$"] || "0", 10);
      if (isNaN(val) || val <= 0) continue;
      if (idx === 0) { total = val; idx++; continue; }
      if (idx - 1 < defaultLabels.length) {
        brackets.push({ bracket: defaultLabels[idx - 1], count: val });
      }
      idx++;
    }
  }

  const calcTotal = total || brackets.reduce((s, b) => s + b.count, 0) || 1;
  return brackets.map((b) => ({
    ...b,
    percentage: Math.round((b.count / calcTotal) * 1000) / 10,
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

    const area = resolveAreaCode(address);
    if (!area) {
      return new Response(JSON.stringify({ result: { dataAvailable: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Extended census for: ${area.name} (${area.code})`);

    // Fetch all in parallel
    // Table IDs: try multiple candidates for each data type
    const [futureData, daytimeData, incomeData] = await Promise.all([
      // Future population: 地域別将来推計人口
      fetchEstatData(ESTAT_API_KEY, "0003411595", area.code)
        .then((d) => d || fetchEstatData(ESTAT_API_KEY, "0003312028", area.code)),
      // Daytime population: 国勢調査 従業地・通学地
      fetchEstatData(ESTAT_API_KEY, "0003447862", area.code)
        .then((d) => d || fetchEstatData(ESTAT_API_KEY, "0003448504", area.code)),
      // Income households: 住宅・土地統計調査
      fetchEstatData(ESTAT_API_KEY, "0003265163", area.code)
        .then((d) => d || fetchEstatData(ESTAT_API_KEY, "0003224877", area.code)),
    ]);

    const futurePopulation = parseFuturePopulation(futureData);
    const daytimePopulation = parseDaytimePopulation(daytimeData);
    const incomeHouseholds = parseIncomeHouseholds(incomeData);

    const result = {
      areaName: area.name,
      areaCode: area.code,
      futurePopulation,
      daytimePopulation,
      incomeHouseholds,
      dataAvailable: futurePopulation.length > 0 || daytimePopulation !== null || incomeHouseholds.length > 0,
    };

    console.log(`Extended result: future=${futurePopulation.length} pts, daytime=${!!daytimePopulation}, income=${incomeHouseholds.length} brackets`);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("estat-extended error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
