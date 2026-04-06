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

    const { text, tone, language } = await req.json();
    const isEn = language === "en";

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const validTones = ["soft", "strong", "alternative"];
    if (!tone || !validTones.includes(tone)) {
      return new Response(JSON.stringify({ error: "tone must be one of: soft, strong, alternative" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const toneInstructions: Record<string, Record<string, string>> = {
      ja: {
        soft: "以下の販促文をもっとやわらかく、親しみやすいトーンに書き換えてください。意味は変えないでください。",
        strong: "以下の販促文をもっと力強く、インパクトのあるトーンに書き換えてください。意味は変えないでください。",
        alternative: "以下の販促文とは別のアプローチで、同じ商品・サービスの魅力を伝える新しい販促文を作成してください。",
      },
      en: {
        soft: "Rewrite the following promotional text in a softer, friendlier tone. Keep the meaning the same.",
        strong: "Rewrite the following promotional text in a stronger, more impactful tone. Keep the meaning the same.",
        alternative: "Create a new promotional text using a different approach to convey the appeal of the same product/service.",
      },
    };

    const lang = isEn ? "en" : "ja";
    const sysMsg = isEn
      ? "You are a marketing copywriter for physical retail stores. Adjust the promotional text as instructed. Return only the resulting text. No explanations or preambles."
      : "あなたは日本の実店舗向けマーケティングコピーライターです。指示に従って販促文を調整してください。結果のテキストのみ返してください。説明や前置きは不要です。";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sysMsg },
          { role: "user", content: `${toneInstructions[lang][tone]}\n\n${isEn ? "Original text" : "元の文"}:\n${text}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI調整中にエラーが発生しました" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const result = aiData.choices?.[0]?.message?.content?.trim();

    if (!result) {
      return new Response(JSON.stringify({ error: "AIからの応答を取得できませんでした" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("adjust-promo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
