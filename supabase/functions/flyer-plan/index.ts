import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toolDef = {
  type: "function",
  function: {
    name: "provide_flyer_plan",
    description: "チラシ配布計画を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "配布計画の概要" },
        distributionAreas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              areaName: { type: "string", description: "配布エリア名" },
              reason: { type: "string", description: "このエリアを選定した理由" },
              estimatedHouseholds: { type: "number", description: "推定世帯数" },
              recommendedQuantity: { type: "number", description: "推奨配布部数" },
              priority: { type: "string", enum: ["高", "中", "低"], description: "配布優先度" },
              targetDescription: { type: "string", description: "エリアの主要ターゲット層" },
            },
            required: ["areaName", "reason", "estimatedHouseholds", "recommendedQuantity", "priority", "targetDescription"],
          },
        },
        totalQuantity: { type: "number", description: "合計推奨部数" },
        estimatedCost: {
          type: "object",
          properties: {
            printingCostPerUnit: { type: "number", description: "印刷単価（円）" },
            distributionCostPerUnit: { type: "number", description: "配布単価（円）" },
            totalPrintingCost: { type: "number", description: "印刷費合計（円）" },
            totalDistributionCost: { type: "number", description: "配布費合計（円）" },
            totalCost: { type: "number", description: "合計費用（円）" },
          },
          required: ["printingCostPerUnit", "distributionCostPerUnit", "totalPrintingCost", "totalDistributionCost", "totalCost"],
        },
        timing: {
          type: "object",
          properties: {
            bestDays: { type: "array", items: { type: "string" }, description: "配布に最適な曜日" },
            bestTimeSlots: { type: "array", items: { type: "string" }, description: "配布に最適な時間帯" },
            seasonalTips: { type: "string", description: "季節ごとの配布アドバイス" },
            frequency: { type: "string", description: "推奨配布頻度" },
          },
          required: ["bestDays", "bestTimeSlots", "seasonalTips", "frequency"],
        },
        catchcopies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string", description: "メインキャッチコピー" },
              subCopy: { type: "string", description: "サブコピー" },
              tone: { type: "string", description: "トーン（親しみ系、緊急系、信頼系など）" },
              targetAudience: { type: "string", description: "ターゲット層" },
              callToAction: { type: "string", description: "行動喚起フレーズ" },
            },
            required: ["headline", "subCopy", "tone", "targetAudience", "callToAction"],
          },
        },
        designTips: {
          type: "array",
          items: { type: "string" },
          description: "チラシデザインのアドバイス",
        },
        expectedResponseRate: { type: "string", description: "期待反応率" },
        expectedROI: { type: "string", description: "期待投資対効果" },
      },
      required: ["summary", "distributionAreas", "totalQuantity", "estimatedCost", "timing", "catchcopies", "designTips", "expectedResponseRate", "expectedROI"],
    },
  },
};

function buildPrompt(address: string, industry: string, budget: string, target: string, storeName: string, isEn = false) {
  const system = isEn
    ? `You are an expert AI in flyer/leaflet distribution strategy. Design optimal distribution plans based on regional characteristics, target audience, and industry. Provide realistic cost estimates. Generate multiple compelling catchcopy patterns. Always respond in English.`
    : `あなたは日本のチラシ・ポスティング配布戦略の専門家AIです。地域の特性、ターゲット層、業種に応じた最適な配布計画を設計します。
日本のポスティング業界の相場（印刷費: A4片面カラー 3〜8円/枚、配布費: 3〜7円/枚）に基づいた現実的なコスト見積もりを出してください。
キャッチコピーは日本の消費者に刺さる自然な日本語で、複数パターン生成してください。
必ず日本語で回答してください。`;

  const user = isEn
    ? `Please create a flyer distribution plan with the following conditions.

Store Location: ${address}
${storeName ? `Store Name: ${storeName}` : ""}
Industry: ${industry}
${budget ? `Budget: ${budget}` : "Budget: Not specified (please provide optimal suggestions)"}
${target ? `Target Audience: ${target}` : ""}

Include:
1. Distribution areas (3-5): area name, reason, estimated households, recommended quantity, priority
2. Total quantity and cost estimate (printing + distribution breakdown)
3. Optimal distribution timing (days, time slots, seasons)
4. Catchcopy ideas (5+ patterns, different tones)
5. Flyer design tips
6. Expected response rate and ROI`
    : `以下の条件でチラシ配布計画を作成してください。

店舗所在地: ${address}
${storeName ? `店舗名: ${storeName}` : ""}
業種: ${industry}
${budget ? `予算目安: ${budget}` : "予算: 指定なし（最適な提案をしてください）"}
${target ? `ターゲット層: ${target}` : ""}

以下を含む配布計画を出してください:
1. 配布エリア（3〜5エリア）: エリア名、選定理由、推定世帯数、推奨部数、優先度
2. 合計部数とコスト見積もり（印刷費・配布費の内訳付き）
3. 最適な配布タイミング（曜日・時間帯・季節）
4. キャッチコピー案（5パターン以上、異なるトーンで）
5. チラシデザインのアドバイス
6. 期待反応率と投資対効果`;

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

    const { address, industry, budget, target, storeName, language } = await req.json();
    const isEn = language === "en";

    if (!address || !industry) {
      return new Response(JSON.stringify({ error: "住所と業種は必須です" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system, user } = buildPrompt(address, industry, budget || "", target || "", storeName || "", isEn);

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
        tool_choice: { type: "function", function: { name: "provide_flyer_plan" } },
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
    console.error("flyer-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
