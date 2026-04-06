import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toolDef = {
  type: "function",
  function: {
    name: "provide_location_match",
    description: "サービスに最適な出店・広告・チラシ配布エリアの提案を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "総合的なエリアマッチング分析の概要" },
        recommendedLocations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rank: { type: "number", description: "推奨順位" },
              areaName: { type: "string", description: "推奨エリア名（例: 渋谷区神南）" },
              matchScore: { type: "number", description: "マッチ度（0-100）" },
              population: { type: "string", description: "エリアの推定人口規模" },
              mainTarget: { type: "string", description: "主要ターゲット層" },
              strengths: { type: "array", items: { type: "string" }, description: "このエリアの強み" },
              risks: { type: "array", items: { type: "string" }, description: "このエリアのリスク" },
              storeOpeningAdvice: { type: "string", description: "出店に関するアドバイス" },
              adStrategy: { type: "string", description: "このエリアでの広告戦略" },
              flyerStrategy: { type: "string", description: "このエリアでのチラシ配布戦略" },
              estimatedMonthlyCustomers: { type: "string", description: "月間見込み顧客数" },
              competitionLevel: { type: "string", enum: ["低", "中", "高"], description: "競合密度" },
              rentEstimate: { type: "string", description: "家賃相場の目安" },
            },
            required: ["rank", "areaName", "matchScore", "population", "mainTarget", "strengths", "risks", "storeOpeningAdvice", "adStrategy", "flyerStrategy", "estimatedMonthlyCustomers", "competitionLevel", "rentEstimate"],
          },
        },
        comparisonTable: {
          type: "array",
          items: {
            type: "object",
            properties: {
              areaName: { type: "string" },
              matchScore: { type: "number" },
              competitionLevel: { type: "string" },
              targetFit: { type: "string", description: "ターゲット適合度（高/中/低）" },
              costEfficiency: { type: "string", description: "コスト効率（高/中/低）" },
              growthPotential: { type: "string", description: "成長可能性（高/中/低）" },
            },
            required: ["areaName", "matchScore", "competitionLevel", "targetFit", "costEfficiency", "growthPotential"],
          },
        },
        overallRecommendation: {
          type: "object",
          properties: {
            bestArea: { type: "string", description: "最もおすすめのエリア" },
            reason: { type: "string", description: "推奨理由" },
            actionPlan: { type: "array", items: { type: "string" }, description: "具体的なアクションプラン（5つ）" },
            budgetGuide: { type: "string", description: "初期投資の目安" },
          },
          required: ["bestArea", "reason", "actionPlan", "budgetGuide"],
        },
      },
      required: ["summary", "recommendedLocations", "comparisonTable", "overallRecommendation"],
    },
  },
};

function buildPrompt(
  industry: string,
  serviceDescription: string,
  targetAudience: string,
  budget: string,
  currentLocation: string,
  preferences: string
) {
  const system = `あなたは日本の店舗出店・集客戦略のエキスパートAIです。
サービスの特性を分析し、最適な出店エリア・広告エリア・チラシ配布エリアを提案します。
日本の各エリアの人口動態、商業特性、競合状況、家賃相場に基づいた現実的な提案を行ってください。
必ず5つのエリアを提案し、それぞれに出店・広告・チラシの観点からアドバイスしてください。
必ず日本語で回答してください。`;

  const user = `以下のサービスに最適な出店・広告・チラシ配布エリアを提案してください。

業種: ${industry}
サービス内容: ${serviceDescription}
${targetAudience ? `ターゲット層: ${targetAudience}` : ""}
${budget ? `予算規模: ${budget}` : ""}
${currentLocation ? `現在の所在地/希望エリア: ${currentLocation}` : ""}
${preferences ? `その他の条件・希望: ${preferences}` : ""}

以下を含む提案をお願いします:
1. 推奨エリアを5つ、マッチ度スコア付きでランキング
2. 各エリアの強み・リスク
3. 各エリアでの出店アドバイス、広告戦略、チラシ配布戦略
4. エリア比較表
5. 総合的なおすすめと具体的なアクションプラン`;

  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { industry, serviceDescription, targetAudience, budget, currentLocation, preferences } = await req.json();

    if (!industry || !serviceDescription) {
      return new Response(JSON.stringify({ error: "業種とサービス内容は必須です" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system, user } = buildPrompt(industry, serviceDescription, targetAudience || "", budget || "", currentLocation || "", preferences || "");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        tools: [toolDef],
        tool_choice: { type: "function", function: { name: "provide_location_match" } },
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
    console.error("location-match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
