import { supabase } from "@/lib/supabase";

export type Sale = {
  id: string;
  user_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  created_at: string;
};

export type NewSale = Omit<Sale, "id" | "created_at">;

export async function getSales() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  return query;
}

export async function addSale(sale: NewSale) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabase
    .from("sales")
    .insert({
      ...sale,
      ...(user?.id ? { user_id: user.id } : {}),
    })
    .select()
    .single();
}

export async function deleteSale(id: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("sales").delete().eq("id", id);
  if (user?.id) {
    query = query.eq("user_id", user.id);
  }
  return query;
}
