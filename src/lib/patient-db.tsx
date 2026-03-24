// lib/db/patient.ts

import supabase from "./supabaseClient";

export async function savePatientToDB(name: string, cnic: string, dob: Date, gender: string, user_id : string) {
  const { error } = await supabase.from("patients").insert([
    { name, cnic, dob, gender, user_id, created_at: new Date().toISOString()},
  ]);

  if (error) {
      console.error("Error updating patient", error.message);
      //alert("Failed to save changes.");
      return {"status":"danger","message":"Failed to save patient"};
  }
  else{
      console.log("patient successfully added to DB")
      return {"status":"success","message":"Patient saved successfully. Redirecting back to Dashboard"};
  }
}


export async function getUserPatientsWithEmail() {
  // Get the currently logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User fetch error"/*, userError?.message*/);
    return { email: null, patients: [], count: 0 };
  }

  // Fetch the user's patients
  const { data: patients, error } = await supabase
    .from("patients")
    .select("patient_id, cnic, name, dob, gender, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients", error.message);
    return { email: user.email, patients: [], count: 0 };
  }
  else{
    console.log("Fetched data successfully" /*user.email, patients, pitches.length*/)
  }

  return {
    email: user.email,
    patients,
    count: patients.length,
  };
}

export const getPatientById = async (id: string) => {
  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("patient_id", id)
    .single();

  if (error) {
    console.error("Error updating pitch"/*, error.message*/);
    //alert("Failed to save changes.");
    return {patient: null};
  }
  console.log(patient)
  return patient;
};


export async function updatePatientToDb(patientId:string, newName:string, newDOB: Date, newGender:string) {
    const { data, error } = await supabase
        .from("patients")
        .update({ name: newName, dob: newDOB, gender: newGender, updated_at: new Date().toISOString() })
        .eq("patient_id", patientId);

    if (error) {
        console.error("Error updating patient", error.message);
        //alert("Failed to save changes.");
        return {"status":"danger","message":"Failed to save changes"};
    }

    console.log("Patient updated"/*, data*/);
    return {"status":"success","message":"Changes saved successfully."};
}

export async function deletePatientFromDb(patientId:string) {
  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("patient_id", patientId);

  if (error) {
    console.error("Error deleting patients", /*error.message*/);
    //alert("Failed to delete pitch.");
    return {"status":"danger","message":"Failed to delete patient."};
  }

  //alert("Pitch deleted successfully!");
  return {"status":"success","message":"Patient deleted successfully"};
}


/* ---------------- CNIC UNIQUE CHECK ---------------- */
  export async function cnicExistsForUser (userId: string, cnic: string) {
    const { data, error } = await supabase
      .from("patients")
      .select("patient_id")
      .eq("user_id", userId)
      .eq("cnic", cnic)
      .single();

    if (error && error.code !== "PGRST116") 
      return { "status":"success","message": error };
    return !!data;
  };
// ================================
// PROFILE LOGIC 
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