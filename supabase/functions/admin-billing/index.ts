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

    const { action, email, note, settings } = await req.json();

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

    if (action === "list-users") {
      // Get all users from auth.users via admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ perPage: 500 });
      if (authError) throw authError;

      // Get subscription data
      const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("user_id, plan, current_period_end, stripe_customer_id, stripe_subscription_id");

      // Get usage counts for current month
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: usageCounts } = await supabase
        .from("usage_counts")
        .select("user_id, usage_count")
        .eq("year_month", monthKey);

      // Get whitelist
      const { data: whitelistData } = await supabase
        .from("free_whitelist")
        .select("email");
      const whitelistEmails = new Set((whitelistData || []).map((w: any) => w.email));

      const users = (authUsers?.users || []).map((u: any) => {
        const sub = (subscriptions || []).find((s: any) => s.user_id === u.id);
        const usage = (usageCounts || []).find((uc: any) => uc.user_id === u.id);
        const isWhitelisted = whitelistEmails.has(u.email);

        let plan = "Free";
        if (isWhitelisted) plan = "Whitelist";
        if (sub?.plan === "pro") plan = "Pro";

        return {
          id: u.id,
          email: u.email || "—",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          plan,
          subscription_status: sub?.status || null,
          subscription_end: sub?.current_period_end || null,
          usage_this_month: usage?.count || 0,
        };
      });

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-plan-settings") {
      const { data, error } = await supabase
        .from("plan_settings")
        .select("*")
        .order("setting_key");
      if (error) throw error;
      const result: Record<string, string> = {};
      for (const row of data || []) result[row.setting_key] = row.setting_value;
      return new Response(JSON.stringify({ settings: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "save-plan-settings") {
      if (!settings || typeof settings !== "object") {
        return new Response(JSON.stringify({ error: "Settings object required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      for (const [key, value] of Object.entries(settings as Record<string, string>)) {
        const { error } = await supabase
          .from("plan_settings")
          .update({ setting_value: String(value), updated_by: userEmail, updated_at: new Date().toISOString() })
          .eq("setting_key", key);
        if (error) throw error;
      }
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
