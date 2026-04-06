import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("ERROR", "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    log("ERROR", "No stripe-signature header");
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400, headers: corsHeaders });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    log("ERROR", { message: (err as Error).message });
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: corsHeaders });
  }

  log("Event received", { type: event.type, id: event.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscription(supabase, stripe, subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, stripe, subscription);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscription(supabase, stripe, subscription);
        }
        break;
      }
      default:
        log("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    log("ERROR processing event", { message: (err as Error).message });
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function getAuthUserByEmail(supabase: any, email: string) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u: any) => u.email === email);
  return user ?? null;
}

async function upsertSubscription(supabase: any, stripe: Stripe, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    log("Customer deleted, skipping");
    return;
  }
  const email = (customer as Stripe.Customer).email;
  if (!email) {
    log("No email on customer", { customerId });
    return;
  }

  const user = await getAuthUserByEmail(supabase, email);
  if (!user) {
    log("No auth user found for email", { email });
    return;
  }

  // current_period_end removed in Stripe API 2025-08-27.basil
  // Use latest_invoice to get period end
  let periodEnd: string | null = null;
  const invoiceId = (subscription as any).latest_invoice;
  if (invoiceId && typeof invoiceId === "string") {
    try {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      const lines = (invoice as any).lines?.data;
      if (lines && lines.length > 0 && lines[0].period?.end) {
        const endTs = lines[0].period.end;
        periodEnd = typeof endTs === "number"
          ? new Date(endTs * 1000).toISOString()
          : endTs;
      }
    } catch (e) {
      log("Could not retrieve invoice for period end", { error: (e as Error).message });
    }
  }
  const planName = subscription.status === "active" ? "pro" : "free";

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan: planName,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    log("ERROR upserting subscription", { error: error.message });
    throw error;
  }
  log("Subscription upserted", { userId: user.id, plan: planName, status: subscription.status });
}

async function handleSubscriptionDeleted(supabase: any, stripe: Stripe, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = (customer as Stripe.Customer).email;
  if (!email) return;

  const user = await getAuthUserByEmail(supabase, email);
  if (!user) return;

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        plan: "free",
        current_period_end: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    log("ERROR updating cancelled subscription", { error: error.message });
    throw error;
  }
  log("Subscription cancelled", { userId: user.id });
}
