import { supabase } from "@/integrations/supabase/client";

const DEFAULT_FREE_MONTHLY_LIMIT = 10;

async function getFreeMonthlyLimit(): Promise<number> {
  try {
    const { data } = await supabase
      .from("plan_settings")
      .select("setting_value")
      .eq("setting_key", "free_monthly_limit")
      .maybeSingle();
    if (data?.setting_value) return parseInt(data.setting_value, 10) || DEFAULT_FREE_MONTHLY_LIMIT;
  } catch {}
  return DEFAULT_FREE_MONTHLY_LIMIT;
}

export async function checkUsageLimit(): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  isWhitelisted: boolean;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  // Check whitelist
  const { data: wl } = await supabase
    .from("free_whitelist")
    .select("email")
    .eq("email", user.email?.toLowerCase() || "")
    .maybeSingle();

  if (wl) {
    return { allowed: true, used: 0, limit: Infinity, isWhitelisted: true };
  }

  // Check subscription
  const { data: subData } = await supabase.functions.invoke("check-subscription");
  if (subData?.subscribed) {
    return { allowed: true, used: 0, limit: Infinity, isWhitelisted: false };
  }

  // Check usage count
  const yearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: usage } = await supabase
    .from("usage_counts")
    .select("usage_count")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth)
    .maybeSingle();

  const used = usage?.usage_count || 0;
  const limit = await getFreeMonthlyLimit();
  return {
    allowed: used < limit,
    used,
    limit,
    isWhitelisted: false,
  };
}

export async function incrementUsage(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const yearMonth = new Date().toISOString().slice(0, 7);
  const { data: existing } = await supabase
    .from("usage_counts")
    .select("id, usage_count")
    .eq("user_id", user.id)
    .eq("year_month", yearMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_counts")
      .update({ usage_count: existing.usage_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("usage_counts")
      .insert({ user_id: user.id, year_month: yearMonth, usage_count: 1 });
  }
}
