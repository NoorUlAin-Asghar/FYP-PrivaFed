// lib/db/user.ts

import supabase from "./supabaseClient";

// ================================
// User PROFILE LOGIC 
// ================================
function normalizeDob(dob: string | null) {
  if (!dob) return null;
  return dob.length === 10 ? dob : dob.split("T")[0]; // YYYY-MM-DD
}

export async function getUserProfile() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User fetch error", userError);
    return { profile: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile", error);
    return { profile: null };
  }

  return { profile: data };
}

export async function saveOrUpdateProfile({
  full_name,
  phone,
  gender,
  dob,
  cnic, // 🔹 Added CNIC parameter
}: {
  full_name: string;
  phone: string;
  gender: string;
  dob: string;
  cnic?: string; // 🔹 Optional because it's only set on creation
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated", userError);
    return { status: "danger", message: "Not authenticated" };
  }

  const normalizedDob = normalizeDob(dob);

  // 1️⃣ Check if profile exists (including current CNIC if any)
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, cnic") // 🔹 Also fetch existing CNIC
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Profile existence check failed", fetchError);
    return { status: "danger", message: "Failed to check profile" };
  }

  // 2️⃣ UPDATE (CNIC excluded - immutable after creation)
  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        gender,
        dob: normalizedDob,
        updated_at: new Date().toISOString(),
        // ❌ Do not update cnic here - it should remain unchanged
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profile update failed", error);
      return { status: "danger", message: "Failed to update profile" };
    }

    return { status: "success", message: "Profile updated successfully" };
  }

  // 3️⃣ INSERT (CNIC allowed only on creation)
  const { error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name,
      phone,
      gender,
      cnic: cnic || null, // 🔹 Add CNIC only on initial creation
      dob: normalizedDob,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Profile insert failed", error);
    return { status: "danger", message: "Failed to create profile" };
  }

  return { status: "success", message: "Profile created successfully" };
}