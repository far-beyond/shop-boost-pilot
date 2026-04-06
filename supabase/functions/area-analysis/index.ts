import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { address, radius, industry, analysisType } = await req.json();

    if (!address) {
      return new Response(JSON.stringify({ error: "address is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";
    let toolDef: any = null;

    if (analysisType === "area") {
      systemPrompt = `あなたは日本の地域マーケティング分析の専門家AIです。日本の国勢調査データ、商業統計、住民基本台帳データに精通しています。
指定された住所と商圏半径に基づいて、できるだけ実際の統計データに近い推定値を用いて分析してください。
人口や世帯数は、日本の市区町村の公開データに基づいた現実的な数値を使用してください。必ず日本語で回答してください。`;

      userPrompt = `以下の条件で商圏分析を行ってください。

住所: ${address}
商圏半径: ${radius || "3km"}
業種: ${industry || "指定なし"}

この地域の人口統計、年齢構成、世帯構成、来店動機の傾向を分析し、向いている業種と不利な業種を判定してください。
人口数値は日本の実際の統計に基づいた現実的な推定値を使ってください。`;

      toolDef = {
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
                  properties: {
                    ageGroup: { type: "string" },
                    percentage: { type: "number" },
                    count: { type: "number" },
                  },
                  required: ["ageGroup", "percentage", "count"],
                },
                description: "年齢構成（10代、20代、30代、40代、50代、60代以上）",
              },
              householdTypes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    percentage: { type: "number" },
                    count: { type: "number" },
                  },
                  required: ["type", "percentage", "count"],
                },
                description: "世帯構成（単身、夫婦のみ、ファミリー、高齢者世帯）",
              },
              primaryTarget: { type: "string", description: "このエリアの主要ターゲット層の詳細説明" },
              suitableIndustries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    reason: { type: "string" },
                    score: { type: "number", description: "適性スコア(100点満点)" },
                  },
                  required: ["industry", "reason", "score"],
                },
                description: "向いている業種（5つ）",
              },
              unsuitableIndustries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["industry", "reason"],
                },
                description: "不利な業種（3つ）",
              },
              visitMotivations: {
                type: "array",
                items: { type: "string" },
                description: "来店動機の傾向（5つ）",
              },
              areaCharacteristics: { type: "string", description: "エリアの特徴をまとめた自然な日本語の説明文（200文字程度）" },
              competitiveEnvironment: { type: "string", description: "競合環境の分析" },
            },
            required: ["areaName", "population", "households", "ageDistribution", "householdTypes", "primaryTarget", "suitableIndustries", "unsuitableIndustries", "visitMotivations", "areaCharacteristics", "competitiveEnvironment"],
          },
        },
      };
    } else if (analysisType === "opening") {
      systemPrompt = `あなたは日本の出店戦略コンサルタントAIです。地域の人口動態、競合環境、商圏特性を踏まえて、出店の成功可能性を100点満点でスコアリングします。
必ず日本語で回答してください。根拠のある現実的な分析をしてください。`;

      userPrompt = `以下の条件で出店分析を行ってください。

業種: ${industry}
出店候補エリア: ${address}

このエリアでの出店成功率を100点満点で評価し、想定ターゲット、客単価、来店頻度、リスク要因、改善アドバイスを提示してください。`;

      toolDef = {
        type: "function",
        function: {
          name: "provide_opening_analysis",
          description: "出店分析結果を構造化データで返す",
          parameters: {
            type: "object",
            properties: {
              overallScore: { type: "number", description: "総合スコア（100点満点）" },
              scoreBreakdown: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    score: { type: "number" },
                    maxScore: { type: "number" },
                    comment: { type: "string" },
                  },
                  required: ["category", "score", "maxScore", "comment"],
                },
                description: "スコア内訳（立地、人口、競合、ターゲット適合度、成長性の5カテゴリ）",
              },
              successProbability: { type: "string", description: "成功しやすいかの判定（高い/中程度/低い）" },
              targetCustomer: { type: "string", description: "想定ターゲット層の詳細" },
              estimatedUnitPrice: { type: "string", description: "想定客単価" },
              estimatedVisitFrequency: { type: "string", description: "想定来店頻度" },
              riskFactors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    risk: { type: "string" },
                    severity: { type: "string", description: "高/中/低" },
                    mitigation: { type: "string" },
                  },
                  required: ["risk", "severity", "mitigation"],
                },
                description: "リスク要因（3〜5個）",
              },
              improvements: {
                type: "array",
                items: { type: "string" },
                description: "改善アドバイス（3〜5個）",
              },
              overallComment: { type: "string", description: "総合コメント（200文字程度の自然な日本語）" },
            },
            required: ["overallScore", "scoreBreakdown", "successProbability", "targetCustomer", "estimatedUnitPrice", "estimatedVisitFrequency", "riskFactors", "improvements", "overallComment"],
          },
        },
      };
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

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("area-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
