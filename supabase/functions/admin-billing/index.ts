import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Hardcoded admin emails - only these users can access admin functions
const ADMIN_EMAILS = ["admin@mapboost.ai", "pekepon6666@gmail.com"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check admin via whitelist table or hardcoded list
    const userEmail = userData.user.email;
    const { data: whitelistCheck } = await supabase
      .from("free_whitelist")
      .select("email")
      .eq("email", userEmail)
      .single();

    const isAdmin = ADMIN_EMAILS.includes(userEmail) || !!whitelistCheck;
    // For admin actions, only hardcoded admins
    const isHardAdmin = ADMIN_EMAILS.includes(userEmail);

    const { action, email, note } = await req.json();

    if (action === "check-admin") {
      return new Response(JSON.stringify({ isAdmin: isHardAdmin }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isHardAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list-payments") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        return new Response(JSON.stringify({ error: "Stripe not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      
      const charges = await stripe.charges.list({ limit: 50 });
      const payments = charges.data.map((c: any) => ({
        id: c.id,
        amount: c.amount,
        currency: c.currency,
        status: c.status,
        created: new Date(c.created * 1000).toISOString(),
        customer_email: c.billing_details?.email || c.receipt_email || null,
        description: c.description,
      }));

      return new Response(JSON.stringify({ payments }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list-whitelist") {
      const { data, error } = await supabase
        .from("free_whitelist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ whitelist: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "add-whitelist") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase
        .from("free_whitelist")
        .insert({ email: email.toLowerCase().trim(), note: note || null });
      if (error) {
        if (error.code === "23505") {
          return new Response(JSON.stringify({ error: "Email already whitelisted" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw error;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "remove-whitelist") {
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error } = await supabase
        .from("free_whitelist")
        .delete()
        .eq("email", email.toLowerCase().trim());
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-billing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
