import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildMeoPrompt(
  storeName: string,
  address: string,
  industry: string,
  currentRating?: number,
  monthlyReviews?: number,
  isEn = false
): { system: string; user: string } {
  const ratingInfo = currentRating ? (isEn ? `Current Google Rating: ${currentRating}` : `現在のGoogle評価: ${currentRating}`) : "";
  const reviewInfo = monthlyReviews ? (isEn ? `Monthly Reviews: ${monthlyReviews}` : `月間レビュー数: ${monthlyReviews}`) : "";

  const system = isEn
    ? `You are an expert AI consultant specializing in Google Business Profile optimization and MEO (Map Engine Optimization). You understand local SEO, Google Maps ranking factors, review management, and GBP content strategy. Provide realistic, actionable analysis. Always respond in English.`
    : `あなたはGoogleビジネスプロフィール最適化とMEO（マップエンジン最適化）を専門とするAIコンサルタントです。ローカルSEO、Googleマップの順位要因、口コミ管理、GBPコンテンツ戦略に精通しています。現実的で実行可能な分析を行ってください。必ず日本語で回答してください。`;

  const user = isEn
    ? `Please perform a comprehensive MEO (Map Engine Optimization) analysis for the following business.

Store Name: ${storeName}
Address: ${address}
Industry: ${industry}
${ratingInfo}
${reviewInfo}

Analyze the following:
1. Overall MEO score (0-100) based on the provided information
2. Profile completeness estimate, review strength, and local SEO scores (0-100 each)
3. 5-8 specific, actionable improvement suggestions with difficulty level and expected impact
4. 3 Google Business Profile post suggestions with title, body, CTA, and image description
5. Competitive insight for this area and industry`
    : `以下のビジネスについて、包括的なMEO（マップエンジン最適化）分析を行ってください。

店舗名: ${storeName}
住所: ${address}
業種: ${industry}
${ratingInfo}
${reviewInfo}

以下を分析してください:
1. 提供情報に基づくMEO総合スコア（0-100）
2. プロフィール充実度、口コミ評価力、ローカルSEOスコア（各0-100）
3. 5〜8個の具体的で実行可能な改善提案（難易度と期待効果付き）
4. Googleビジネスプロフィール投稿案3件（タイトル、本文、CTA、推奨画像の説明付き）
5. このエリア・業種での競合に関するインサイト`;

  return { system, user };
}

const meoToolDef = {
  type: "function",
  function: {
    name: "provide_meo_analysis",
    description: "MEO分析結果を構造化データで返す",
    parameters: {
      type: "object",
      properties: {
        meoScore: { type: "number", description: "MEO総合スコア (0-100)" },
        profileScore: { type: "number", description: "プロフィール充実度スコア (0-100)" },
        reviewScore: { type: "number", description: "口コミ評価力スコア (0-100)" },
        localSeoScore: { type: "number", description: "ローカルSEOスコア (0-100)" },
        improvements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "改善提案タイトル" },
              description: { type: "string", description: "改善提案の詳細説明" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "難易度" },
              impact: { type: "string", enum: ["low", "medium", "high"], description: "期待される効果" },
            },
            required: ["title", "description", "difficulty", "impact"],
          },
        },
        postSuggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "投稿タイトル" },
              body: { type: "string", description: "投稿本文" },
              cta: { type: "string", description: "Call to Action文言" },
              imageDescription: { type: "string", description: "推奨画像の説明" },
            },
            required: ["title", "body", "cta", "imageDescription"],
          },
        },
        competitiveInsight: { type: "string", description: "競合環境に関するインサイト" },
      },
      required: ["meoScore", "profileScore", "reviewScore", "localSeoScore", "improvements", "postSuggestions", "competitiveInsight"],
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

    const { storeName, address, industry, currentRating, monthlyReviews, language } = await req.json();
    const isEn = language === "en";

    if (!storeName || !address || !industry) {
      return new Response(JSON.stringify({ error: isEn ? "storeName, address, and industry are required" : "店舗名、住所、業種は必須です" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { system: systemPrompt, user: userPrompt } = buildMeoPrompt(
      storeName, address, industry, currentRating, monthlyReviews, isEn
    );

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
        tools: [meoToolDef],
        tool_choice: { type: "function", function: { name: "provide_meo_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: isEn ? "Rate limit reached. Please try again later." : "AIリクエストの制限に達しました。しばらくしてから再度お試しください。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: isEn ? "AI credits exhausted." : "AIクレジットが不足しています。" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: isEn ? "Error during AI analysis" : "AI分析中にエラーが発生しました" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: isEn ? "Could not parse AI response" : "AIからの応答を解析できませんでした" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meo-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
