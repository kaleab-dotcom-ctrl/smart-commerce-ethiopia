import { supabase } from "@/lib/supabase";

export type Product = {
  id: string;
  business_id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  created_at: string;
};

export type NewProduct = Omit<Product, "id" | "created_at">;

export async function getProducts() {
  return supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function addProduct(product: NewProduct) {
  return supabase.from("products").insert(product).select().single();
}

export async function deleteProduct(id: string) {
  return supabase.from("products").delete().eq("id", id);
}
