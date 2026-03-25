// lib/db/user.ts

import supabase from "./supabaseClient";

// ================================
// User PROFILE LOGIC 
// ================================
function normalizeDob(dob: string | null) {
  if (!dob) return null;
  return dob.length === 10 ? dob : dob.split("T")[0]; // YYYY-MM-DD
}

function normalizeDate(date: string | null) {
  if (!date) return null;
  return date.length === 10 ? date : date.split("T")[0];
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
  cnic,
  hospital_affiliation,
  license_number,
  license_authority,
  license_expiry_date,
}: {
  full_name: string;
  phone: string;
  gender: string;
  dob: string;
  cnic?: string;

  // 🔹 NEW FIELDS
  hospital_affiliation?: string;
  license_number?: string;
  license_authority?: string;
  license_expiry_date?: string;
}) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated", userError);
    return { status: "danger", message: "Not authenticated" };
  }

  const normalizedDob = normalizeDob(dob);
  const normalizedExpiry = normalizeDate(license_expiry_date || null);

  // 1️⃣ Check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, cnic")
    .eq("id", user.id)
    .maybeSingle();

  if (fetchError) {
    console.error("Profile existence check failed", fetchError);
    return { status: "danger", message: "Failed to check profile" };
  }

  // 2️⃣ UPDATE
  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        phone,
        gender,
        dob: normalizedDob,

        // 🔹 NEW FIELDS
        hospital_affiliation: hospital_affiliation || null,
        license_number: license_number || null,
        license_authority: license_authority || null,
        license_expiry_date: normalizedExpiry,

        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Profile update failed", error);
      return { status: "danger", message: "Failed to update profile" };
    }

    return { status: "success", message: "Profile updated successfully" };
  }

  // 3️⃣ INSERT
  const { error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email,
      full_name,
      phone,
      gender,
      cnic: cnic || null,
      dob: normalizedDob,

      // 🔹 NEW FIELDS
      hospital_affiliation: hospital_affiliation || null,
      license_number: license_number || null,
      license_authority: license_authority || null,
      license_expiry_date: normalizedExpiry,

      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Profile insert failed", error);
    return { status: "danger", message: "Failed to create profile" };
  }

  return { status: "success", message: "Profile created successfully" };
}