import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type DiagnosisResult = {
  strengths: string[];
  weaknesses: string[];
  targetCustomers: string;
  differentiationPoints: string[];
  bottlenecks: string[];
  actions: {
    name: string;
    reason: string;
    estimatedCost: string;
    difficulty: string;
    expectedEffect: string;
  }[];
};

export type PromoTexts = Record<string, string[]>;

export type KPIPlan = {
  kpis: {
    metric: string;
    target: string;
    measurement: string;
    frequency: string;
  }[];
};

export type DiagnosisRow = {
  id: string;
  user_id: string;
  store_name: string;
  industry: string;
  address: string;
  station: string | null;
  target_audience: string | null;
  strengths: string | null;
  concerns: string | null;
  budget: string | null;
  competitors: string | null;
  media: string[] | null;
  diagnosis_result: DiagnosisResult | null;
  promo_texts: PromoTexts | null;
  kpi_plan: KPIPlan | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function createDiagnosis(input: {
  store_name: string;
  industry: string;
  address: string;
  station?: string;
  target_audience?: string;
  strengths?: string;
  concerns?: string;
  budget?: string;
  competitors?: string;
  media?: string[];
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("diagnoses")
    .insert({ ...input, user_id: user.id, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function runAIDiagnosis(diagnosisId: string, type: "diagnosis" | "promo" | "kpi", language: string = "ja") {
  const { data, error } = await supabase.functions.invoke("diagnose", {
    body: { diagnosisId, type, language },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.result;
}

export async function getDiagnosis(id: string) {
  const { data, error } = await supabase
    .from("diagnoses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as DiagnosisRow;
}

export async function getUserDiagnoses() {
  const { data, error } = await supabase
    .from("diagnoses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as DiagnosisRow[];
}
