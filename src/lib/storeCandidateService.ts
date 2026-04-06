import { supabase } from "@/integrations/supabase/client";

export type StoreCandidate = {
  id: string;
  user_id: string;
  store_name: string;
  industry: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  memo: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type StoreCandidateInput = {
  store_name: string;
  industry: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  memo?: string | null;
};

export async function fetchStoreCandidates(): Promise<StoreCandidate[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("store_candidates" as any)
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as any[]) ?? [];
}

export async function createStoreCandidate(input: StoreCandidateInput): Promise<StoreCandidate> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");

  const { data, error } = await supabase
    .from("store_candidates" as any)
    .insert({
      user_id: user.id,
      store_name: input.store_name,
      industry: input.industry,
      address: input.address,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      memo: input.memo ?? null,
    } as any)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

export async function deleteStoreCandidate(id: string): Promise<void> {
  const { error } = await supabase
    .from("store_candidates" as any)
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
