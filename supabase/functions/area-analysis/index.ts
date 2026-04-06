import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchCensusData(address: string): Promise<any | null> {
  try {
    const ESTAT_API_KEY = Deno.env.get("ESTAT_API_KEY");
    if (!ESTAT_API_KEY) return null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) return null;

    const res = await fetch(`${supabaseUrl}/functions/v1/estat-census`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ address }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.result?.dataAvailable ? data.result : null;
  } catch (e) {
    console.error("Census fetch failed:", e);
    return null;
  }
}

function buildAreaPrompt(address: string, radius: string, industry: string, census: any | null, isEn = false): { system: string; user: string } {
  let censusContext = "";
  if (census) {
    if (isEn) {
      censusContext = `\n\n【Actual Census Data】
Area: ${census.areaName}
Total Population: ${census.totalPopulation.toLocaleString()}
Male: ${census.malePopulation.toLocaleString()} / Female: ${census.femalePopulation.toLocaleString()}
Households: ${census.totalHouseholds.toLocaleString()}`;
    } else {
      censusContext = `\n\n【実際の国勢調査データ（令和2年・e-Stat）】
エリア: ${census.areaName}
総人口: ${census.totalPopulation.toLocaleString()}人
男性: ${census.malePopulation.toLocaleString()}人 / 女性: ${census.femalePopulation.toLocaleString()}人
世帯数: ${census.totalHouseholds.toLocaleString()}世帯`;
    }

    if (census.ageDistribution?.length > 0) {
      censusContext += isEn ? `\nAge Distribution:` : `\n年齢構成:`;
      for (const ag of census.ageDistribution) {
        censusContext += `\n  ${ag.ageGroup}: ${ag.population.toLocaleString()}${isEn ? "" : "人"} (${ag.percentage}%)`;
      }
    }

    censusContext += isEn
      ? `\n\nThe above is data for the entire municipality. Please estimate proportionally based on the trade area radius of ${radius}.`
      : `\n\n上記は市区町村全体のデータです。商圏半径${radius}に応じて適切に按分・推定してください。
実データに基づいているため、人口と年齢構成の数値はこのデータを基準にしてください。`;
  }

  const system = isEn
    ? `You are an expert AI in regional marketing analysis. You are well-versed in census data, commercial statistics, and demographic data.
${census ? "Actual census data is provided. Use this data as a baseline for analysis." : "Based on the specified address and trade area radius, use realistic estimates."}
Always respond in English.`
    : `あなたは日本の地域マーケティング分析の専門家AIです。日本の国勢調査データ、商業統計、住民基本台帳データに精通しています。
${census ? "今回は実際のe-Stat国勢調査データが提供されています。このデータを基準として分析してください。商圏半径に応じた按分推定を行い、より正確な分析を提供してください。" : "指定された住所と商圏半径に基づいて、できるだけ実際の統計データに近い推定値を用いて分析してください。"}
人口や世帯数は、日本の市区町村の公開データに基づいた現実的な数値を使用してください。必ず日本語で回答してください。`;

  const user = isEn
    ? `Please perform a trade area analysis with the following conditions.

Address: ${address}
Trade Area Radius: ${radius || "3km"}
Industry: ${industry || "Not specified"}
${censusContext}

Analyze the demographics, age composition, household composition, and visit motivation trends of this area. Determine suitable and unsuitable industries.`
    : `以下の条件で商圏分析を行ってください。

住所: ${address}
商圏半径: ${radius || "3km"}
業種: ${industry || "指定なし"}
${censusContext}

この地域の人口統計、年齢構成、世帯構成、来店動機の傾向を分析し、向いている業種と不利な業種を判定してください。
${census ? "国勢調査の実データを基に、商圏半径に合わせた推定値を算出してください。" : "人口数値は日本の実際の統計に基づいた現実的な推定値を使ってください。"}`;

  return { system, user };
}

function buildOpeningPrompt(address: string, industry: string, census: any | null, isEn = false): { system: string; user: string } {
  let censusContext = "";
  if (census) {
    censusContext = isEn
      ? `\n\n【Actual Census Data】\nArea: ${census.areaName}\nTotal Population: ${census.totalPopulation.toLocaleString()}\nHouseholds: ${census.totalHouseholds.toLocaleString()}`
      : `\n\n【実際の国勢調査データ（令和2年・e-Stat）】\nエリア: ${census.areaName}\n総人口: ${census.totalPopulation.toLocaleString()}人\n世帯数: ${census.totalHouseholds.toLocaleString()}世帯`;
    if (census.ageDistribution?.length > 0) {
      censusContext += isEn ? `\nAge Distribution:` : `\n年齢構成:`;
      for (const ag of census.ageDistribution) {
        censusContext += ` ${ag.ageGroup}: ${ag.percentage}%`;
      }
    }
  }

  const system = isEn
    ? `You are a store opening strategy consultant AI. Score the success probability of opening a store on a 100-point scale based on demographics, competition, and trade area characteristics.
${census ? "Actual census data is provided. Use it for higher accuracy." : ""}
Always respond in English with realistic, evidence-based analysis.`
    : `あなたは日本の出店戦略コンサルタントAIです。地域の人口動態、競合環境、商圏特性を踏まえて、出店の成功可能性を100点満点でスコアリングします。
${census ? "実際の国勢調査データが提供されています。このデータに基づいて、より精度の高い分析を行ってください。" : ""}
必ず日本語で回答してください。根拠のある現実的な分析をしてください。`;

  const user = isEn
    ? `Please perform a store opening analysis with the following conditions.\n\nIndustry: ${industry}\nCandidate Area: ${address}\n${censusContext}\n\nEvaluate the success rate on a 100-point scale and provide target customer profile, estimated unit price, visit frequency, risk factors, and improvement advice.`
    : `以下の条件で出店分析を行ってください。\n\n業種: ${industry}\n出店候補エリア: ${address}\n${censusContext}\n\nこのエリアでの出店成功率を100点満点で評価し、想定ターゲット、客単価、来店頻度、リスク要因、改善アドバイスを提示してください。`;

  return { system, user };
}

const areaToolDef = {
  type: "function",
  function: {
    name: "provide_area_analysis",
    description: "商圏分析結果を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        areaName: { type: "string", description: "分析対象エリア名" },
        population: { type: "number", description: "商圏内推定人口" },
        households: { type: "number", description: "商圏内推定世帯数" },
        ageDistribution: {
          type: "array",
          items: {
            type: "object",
            properties: { ageGroup: { type: "string" }, percentage: { type: "number" }, count: { type: "number" } },
            required: ["ageGroup", "percentage", "count"],
          },
        },
        householdTypes: {
          type: "array",
          items: {
            type: "object",
            properties: { type: { type: "string" }, percentage: { type: "number" }, count: { type: "number" } },
            required: ["type", "percentage", "count"],
          },
        },
        primaryTarget: { type: "string" },
        suitableIndustries: {
          type: "array",
          items: {
            type: "object",
            properties: { industry: { type: "string" }, reason: { type: "string" }, score: { type: "number" } },
            required: ["industry", "reason", "score"],
          },
        },
        unsuitableIndustries: {
          type: "array",
          items: {
            type: "object",
            properties: { industry: { type: "string" }, reason: { type: "string" } },
            required: ["industry", "reason"],
          },
        },
        visitMotivations: { type: "array", items: { type: "string" } },
        areaCharacteristics: { type: "string" },
        competitiveEnvironment: { type: "string" },
      },
      required: ["areaName", "population", "households", "ageDistribution", "householdTypes", "primaryTarget", "suitableIndustries", "unsuitableIndustries", "visitMotivations", "areaCharacteristics", "competitiveEnvironment"],
    },
  },
};

const openingToolDef = {
  type: "function",
  function: {
    name: "provide_opening_analysis",
    description: "出店分析結果を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        overallScore: { type: "number" },
        scoreBreakdown: {
          type: "array",
          items: {
            type: "object",
            properties: { category: { type: "string" }, score: { type: "number" }, maxScore: { type: "number" }, comment: { type: "string" } },
            required: ["category", "score", "maxScore", "comment"],
          },
        },
        successProbability: { type: "string" },
        targetCustomer: { type: "string" },
        estimatedUnitPrice: { type: "string" },
        estimatedVisitFrequency: { type: "string" },
        riskFactors: {
          type: "array",
          items: {
            type: "object",
            properties: { risk: { type: "string" }, severity: { type: "string" }, mitigation: { type: "string" } },
            required: ["risk", "severity", "mitigation"],
          },
        },
        improvements: { type: "array", items: { type: "string" } },
        overallComment: { type: "string" },
      },
      required: ["overallScore", "scoreBreakdown", "successProbability", "targetCustomer", "estimatedUnitPrice", "estimatedVisitFrequency", "riskFactors", "improvements", "overallComment"],
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { address, radius, industry, analysisType, language } = await req.json();
    const isEn = language === "en";

    if (!address) {
      return new Response(JSON.stringify({ error: "address is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch real census data first
    console.log("Fetching census data for:", address);
    const census = await fetchCensusData(address);
    console.log("Census data available:", !!census, census ? `pop=${census.totalPopulation}` : "");

    let systemPrompt = "";
    let userPrompt = "";
    let toolDef: any = null;

    if (analysisType === "area") {
      const prompts = buildAreaPrompt(address, radius, industry, census, isEn);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
      toolDef = areaToolDef;
    } else if (analysisType === "opening") {
      if (!industry) {
        return new Response(JSON.stringify({ error: "業種を入力してください" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const prompts = buildOpeningPrompt(address, industry, census, isEn);
      systemPrompt = prompts.system;
      userPrompt = prompts.user;
      toolDef = openingToolDef;
    } else {
      return new Response(JSON.stringify({ error: "Invalid analysisType. Use: area or opening" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: toolDef.function.name } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AIリクエストの制限に達しました。しばらくしてから再度お試しください。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AIクレジットが不足しています。" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "AI分析中にエラーが発生しました" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AIからの応答を解析できませんでした" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      result,
      censusData: census ? {
        source: census.source,
        areaName: census.areaName,
        areaCode: census.areaCode,
        totalPopulation: census.totalPopulation,
        totalHouseholds: census.totalHouseholds,
        ageDistribution: census.ageDistribution,
      } : null,
      dataSource: census ? "e-Stat国勢調査 + AI分析" : "AI推定分析",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("area-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
