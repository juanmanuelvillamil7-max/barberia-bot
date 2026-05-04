import { supabase } from "./supabase";

export async function upsertClientByEmail(
  fullName: string,
  email: string,
  phone?: string
): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from("clients")
      .select("id, phone")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      const updates: Record<string, string> = { full_name: fullName };
      if (phone && !existing.phone) updates.phone = phone;
      await supabase.from("clients").update(updates).eq("id", existing.id);
      return existing.id as string;
    }

    const insertData: Record<string, string> = { full_name: fullName, email };
    if (phone) {
      const { data: phoneOwner } = await supabase
        .from("clients")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (!phoneOwner) insertData.phone = phone;
    }

    const { data: created } = await supabase
      .from("clients")
      .insert(insertData)
      .select("id")
      .single();

    return (created?.id as string) ?? null;
  } catch (err) {
    console.error("upsertClientByEmail error:", err);
    return null;
  }
}

export async function upsertClientByPhone(
  fullName: string,
  phone: string
): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      await supabase.from("clients").update({ full_name: fullName }).eq("id", existing.id);
      return existing.id as string;
    }

    const { data: created } = await supabase
      .from("clients")
      .insert({ full_name: fullName, phone })
      .select("id")
      .single();

    return (created?.id as string) ?? null;
  } catch (err) {
    console.error("upsertClientByPhone error:", err);
    return null;
  }
}
