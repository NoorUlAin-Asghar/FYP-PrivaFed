import supabase from "./supabaseClient";

export interface ScanRecord {
  scan_id?: string; // ✅ NEW
  user_id: string;
  patient_id: string;
  scan_type?: string;
  notes?: string;
  file_url: string;
  created_at?: string;
}

/**
 * Save scan metadata to DB (UPDATED)
 */
export async function saveScanToDB(scan: ScanRecord) {
  scan.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("scans")
    .insert([scan])
    .select()           // ✅ IMPORTANT
    .single();          // ✅ get single inserted row

  if (error) {
    console.error("Error saving scan", error.message);
    return { status: "danger", message: "Failed to save scan", error };
  }

  console.log("✅ Scan saved:", data);

  return {
    status: "success",
    message: "Scan saved successfully",
    data,               // ✅ includes scan_id
  };
}

/**
 * Get scans for a specific patient
 */
export async function getScansForPatient(patientId: string) {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching scans", error.message);
    return { scans: [], error };
  }

  return { scans: data };
}

/**
 * 🔥 NEW: Get scan by scanId (VERY IMPORTANT)
 */
export async function getScanById(scanId: string) {
  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("scan_id", scanId)
    .single();

  if (error) {
    console.error("Error fetching scan", error.message);
    return { scan: null, error };
  }

  return { scan: data };
}