import { supabase } from "@/lib/supabase";

export type Sale = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  created_at: string;
};

export type NewSale = Omit<Sale, "id" | "created_at">;

export async function getSales() {
  return supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function addSale(sale: NewSale) {
  return supabase.from("sales").insert(sale).select().single();
}

export async function deleteSale(id: string) {
  return supabase.from("sales").delete().eq("id", id);
}
