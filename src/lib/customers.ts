import { supabase } from "@/lib/supabase";

export type Customer = {
  id: string;
  user_id?: string;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  return query;
}

export async function createCustomer(customer: NewCustomer) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return supabase
    .from("customers")
    .insert({
      name: customer.name.trim(),
      email: customer.email ? customer.email.trim() : null,
      phone: customer.phone ? customer.phone.trim() : null,
      ...(user?.id ? { user_id: user.id } : {}),
    })
    .select()
    .single();
}
