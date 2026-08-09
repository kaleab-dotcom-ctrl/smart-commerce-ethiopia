import { supabase } from "@/lib/supabase";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type NewCustomer = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

export async function getCustomers() {
  return supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });
}

export async function createCustomer(customer: NewCustomer) {
  return supabase
    .from("customers")
    .insert({
      name: customer.name.trim(),
      email: customer.email ? customer.email.trim() : null,
      phone: customer.phone ? customer.phone.trim() : null,
    })
    .select()
    .single();
}
