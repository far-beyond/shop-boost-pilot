import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toolDef = {
  type: "function",
  function: {
    name: "provide_ad_proposal",
    description: "広告提案を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "広告戦略の概要" },
        googleAds: {
          type: "object",
          properties: {
            campaignType: { type: "string", description: "推奨キャンペーンタイプ" },
            dailyBudget: { type: "number", description: "推奨日予算（円）" },
            monthlyBudget: { type: "number", description: "推奨月予算（円）" },
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  matchType: { type: "string", enum: ["完全一致", "フレーズ一致", "部分一致"] },
                  estimatedCPC: { type: "number", description: "推定CPC（円）" },
                  priority: { type: "string", enum: ["高", "中", "低"] },
                },
                required: ["keyword", "matchType", "estimatedCPC", "priority"],
              },
            },
            adCopies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  headline1: { type: "string", description: "見出し1（30文字以内）" },
                  headline2: { type: "string", description: "見出し2（30文字以内）" },
                  headline3: { type: "string", description: "見出し3（30文字以内）" },
                  description1: { type: "string", description: "説明文1（90文字以内）" },
                  description2: { type: "string", description: "説明文2（90文字以内）" },
                },
                required: ["headline1", "headline2", "headline3", "description1", "description2"],
              },
            },
            expectedCTR: { type: "string" },
            expectedCPA: { type: "string" },
          },
          required: ["campaignType", "dailyBudget", "monthlyBudget", "keywords", "adCopies", "expectedCTR", "expectedCPA"],
        },
        metaAds: {
          type: "object",
          properties: {
            campaignObjective: { type: "string", description: "キャンペーン目的" },
            dailyBudget: { type: "number", description: "推奨日予算（円）" },
            monthlyBudget: { type: "number", description: "推奨月予算（円）" },
            targetAudiences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "オーディエンス名" },
                  ageRange: { type: "string" },
                  gender: { type: "string" },
                  interests: { type: "array", items: { type: "string" } },
                  estimatedReach: { type: "string" },
                },
                required: ["name", "ageRange", "gender", "interests", "estimatedReach"],
              },
            },
            adCreatives: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  format: { type: "string", description: "広告フォーマット（画像、動画、カルーセル等）" },
                  primaryText: { type: "string", description: "メインテキスト" },
                  headline: { type: "string", description: "見出し" },
                  description: { type: "string", description: "説明文" },
                  callToAction: { type: "string", description: "CTAボタン" },
                },
                required: ["format", "primaryText", "headline", "description", "callToAction"],
              },
            },
            expectedCPM: { type: "string" },
            expectedCTR: { type: "string" },
          },
          required: ["campaignObjective", "dailyBudget", "monthlyBudget", "targetAudiences", "adCreatives", "expectedCPM", "expectedCTR"],
        },
        overallStrategy: {
          type: "object",
          properties: {
            recommendedPlatform: { type: "string", description: "最も推奨するプラットフォーム" },
            reason: { type: "string", description: "推奨理由" },
            monthlyTotalBudget: { type: "number" },
            expectedROAS: { type: "string" },
            tips: { type: "array", items: { type: "string" }, description: "運用Tips" },
          },
          required: ["recommendedPlatform", "reason", "monthlyTotalBudget", "expectedROAS", "tips"],
        },
      },
      required: ["summary", "googleAds", "metaAds", "overallStrategy"],
    },
  },
};

function buildPrompt(address: string, industry: string, budget: string, target: string, storeName: string) {
  const system = `あなたは日本のデジタル広告（Google広告・Meta広告）の戦略プランナーAIです。
地域の実店舗向けに最適な広告プランを設計します。
日本のリスティング広告・SNS広告の相場に基づいた現実的な提案を行ってください。
広告コピーは日本の消費者に刺さる自然な日本語で作成してください。
必ず日本語で回答してください。`;

  const user = `以下の条件で広告提案を作成してください。

店舗所在地: ${address}
${storeName ? `店舗名: ${storeName}` : ""}
業種: ${industry}
${budget ? `月間広告予算目安: ${budget}` : "予算: 指定なし（最適な提案をしてください）"}
${target ? `ターゲット層: ${target}` : ""}

以下を含む提案を出してください:
1. Google広告プラン: キャンペーンタイプ、推奨キーワード（10個以上）、広告文（3パターン）、推定CPC/CTR/CPA
2. Meta広告(Instagram/Facebook)プラン: 目的、ターゲティング設定（3パターン）、広告クリエイティブ案（3パターン）、推定CPM/CTR
3. 総合戦略: 最も推奨するプラットフォーム、予算配分、期待ROAS、運用Tips`;

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

    const { address, industry, budget, target, storeName } = await req.json();

    if (!address || !industry) {
      return new Response(JSON.stringify({ error: "住所と業種は必須です" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system, user } = buildPrompt(address, industry, budget || "", target || "", storeName || "");

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
        tool_choice: { type: "function", function: { name: "provide_ad_proposal" } },
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
    console.error("ad-proposal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
