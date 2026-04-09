import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@mapboost.ai";
    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({ error: "SENDGRID_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      to,
      subject,
      storeName,
      clientCompany,
      clientName,
      totalQuantity,
      totalCost,
      deliveryDate,
      pdfBase64,
    } = await req.json();

    if (!to || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "to and pdfBase64 are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailBody = `
${clientCompany || ""}
${clientName || "ご担当者"} 様より、発注書をお送りいたします。

■ 案件概要
・店舗名: ${storeName || "-"}
・合計部数: ${(totalQuantity || 0).toLocaleString()}部
・合計金額: ¥${(totalCost || 0).toLocaleString()}（税別）
・希望納期: ${deliveryDate || "ご相談"}

詳細は添付の発注書PDFをご確認ください。
ご不明な点がございましたらお気軽にご連絡ください。

---
MapBoost AI
https://boost.share-map.net/
`.trim();

    // Send via SendGrid API
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: ADMIN_EMAIL, name: "MapBoost AI" },
        subject: subject || "【発注書】チラシ配布業務のご依頼",
        content: [{ type: "text/plain", value: emailBody }],
        attachments: [
          {
            content: pdfBase64,
            filename: `${storeName || "発注書"}_発注書.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("SendGrid API error:", res.status, errText);
      return new Response(
        JSON.stringify({ error: `Email send failed: ${res.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent via SendGrid");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-flyer-order error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
