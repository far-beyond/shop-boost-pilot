import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { diagnosisId, type, language } = await req.json();
    const isEn = language === "en";

    if (!diagnosisId) {
      return new Response(JSON.stringify({ error: "diagnosisId is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch the diagnosis record
    const { data: diagnosis, error: fetchError } = await supabase
      .from("diagnoses")
      .select("*")
      .eq("id", diagnosisId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !diagnosis) {
      return new Response(JSON.stringify({ error: "Diagnosis not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const storeInfo = `
店舗名: ${diagnosis.store_name}
業種: ${diagnosis.industry}
住所: ${diagnosis.address}
最寄駅: ${diagnosis.station || "不明"}
ターゲット層: ${diagnosis.target_audience || "不明"}
店の強み: ${diagnosis.strengths || "不明"}
現在の悩み: ${diagnosis.concerns || "不明"}
月の予算: ${diagnosis.budget || "不明"}
競合店舗: ${diagnosis.competitors || "不明"}
利用したい媒体: ${(diagnosis.media || []).join("、") || "不明"}
`.trim();

    let systemPrompt = "";
    let userPrompt = "";
    let toolDef: any = null;

    if (type === "diagnosis") {
      systemPrompt = isEn
        ? "You are an expert customer acquisition consultant AI for physical retail stores. Analyze store information and provide specific, actionable customer acquisition diagnostics. Always respond in English."
        : "あなたは日本の実店舗向け集客コンサルタントAIです。店舗情報を分析して、具体的で実行可能な集客診断を行います。必ず日本語で回答してください。";
      userPrompt = isEn
        ? `Analyze the following store information and provide a customer acquisition diagnosis.\n\n${storeInfo}`
        : `以下の店舗情報を分析して、集客診断を行ってください。\n\n${storeInfo}`;
      toolDef = {
        type: "function",
        function: {
          name: "provide_diagnosis",
          description: "店舗の集客診断結果を構造化データで返す",
          parameters: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" }, description: "店舗の強み（3〜5個）" },
              weaknesses: { type: "array", items: { type: "string" }, description: "弱み・課題（3〜5個）" },
              targetCustomers: { type: "string", description: "狙うべき客層の詳細説明" },
              differentiationPoints: { type: "array", items: { type: "string" }, description: "差別化ポイント（2〜4個）" },
              bottlenecks: { type: "array", items: { type: "string" }, description: "集客ボトルネック（3〜5個）" },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    reason: { type: "string" },
                    estimatedCost: { type: "string" },
                    difficulty: { type: "string" },
                    expectedEffect: { type: "string" },
                  },
                  required: ["name", "reason", "estimatedCost", "difficulty", "expectedEffect"],
                },
                description: "今すぐやるべき施策3つ",
              },
            },
            required: ["strengths", "weaknesses", "targetCustomers", "differentiationPoints", "bottlenecks", "actions"],
          },
        },
      };
    } else if (type === "promo") {
      systemPrompt = isEn
        ? "You are a marketing copywriter AI for physical retail stores. Create optimal promotional text for each media channel. Always respond in English."
        : "あなたは日本の実店舗向けマーケティングコピーライターAIです。各媒体に最適な販促文を作成します。必ず日本語で回答してください。";
      userPrompt = isEn
        ? `Based on the following store information, create promotional text for each media channel.\n\n${storeInfo}`
        : `以下の店舗情報に基づいて、各媒体向けの販促文を作成してください。\n\n${storeInfo}`;
      toolDef = {
        type: "function",
        function: {
          name: "provide_promo_texts",
          description: "媒体別の販促文を構造化データで返す",
          parameters: {
            type: "object",
            properties: {
              "Googleビジネスプロフィール": { type: "array", items: { type: "string" }, description: "Google向け投稿文2つ" },
              "Instagram": { type: "array", items: { type: "string" }, description: "Instagram投稿文2つ" },
              "X": { type: "array", items: { type: "string" }, description: "X(Twitter)投稿文2つ" },
              "チラシ": { type: "array", items: { type: "string" }, description: "チラシ用テキスト2つ" },
              "LINE": { type: "array", items: { type: "string" }, description: "LINE配信文2つ" },
              "広告見出し": { type: "array", items: { type: "string" }, description: "広告見出し4つ" },
            },
            required: ["Googleビジネスプロフィール", "Instagram", "X", "チラシ", "LINE", "広告見出し"],
          },
        },
      };
    } else if (type === "kpi") {
      systemPrompt = isEn
        ? "You are a KPI consultant AI for physical retail stores. Design metrics and target values to measure the effectiveness of customer acquisition strategies. Always respond in English."
        : "あなたは日本の実店舗向けKPIコンサルタントAIです。集客施策の効果を測るための指標と目標値を設計します。必ず日本語で回答してください。";
      userPrompt = isEn
        ? `Based on the following store information, design KPIs for customer acquisition strategies.\n\n${storeInfo}`
        : `以下の店舗情報に基づいて、集客施策のKPIを設計してください。\n\n${storeInfo}`;
      toolDef = {
        type: "function",
        function: {
          name: "provide_kpi_plan",
          description: "KPI設計を構造化データで返す",
          parameters: {
            type: "object",
            properties: {
              kpis: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    metric: { type: "string" },
                    target: { type: "string" },
                    measurement: { type: "string" },
                    frequency: { type: "string" },
                  },
                  required: ["metric", "target", "measurement", "frequency"],
                },
                description: "KPI一覧（5〜8個）",
              },
            },
            required: ["kpis"],
          },
        },
      };
    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use: diagnosis, promo, or kpi" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        return new Response(JSON.stringify({ error: "AIリクエストの制限に達しました。しばらくしてから再度お試しください。" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AIクレジットが不足しています。" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      return new Response(JSON.stringify({ error: "AI分析中にエラーが発生しました" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AIからの応答を解析できませんでした" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Save result to database
    const updateData: Record<string, any> = {};
    if (type === "diagnosis") {
      updateData.diagnosis_result = result;
      updateData.status = "completed";
    } else if (type === "promo") {
      updateData.promo_texts = result;
    } else if (type === "kpi") {
      updateData.kpi_plan = result;
    }

    await supabase.from("diagnoses").update(updateData).eq("id", diagnosisId).eq("user_id", userId);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
