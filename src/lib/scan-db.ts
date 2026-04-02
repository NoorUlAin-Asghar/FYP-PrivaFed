import supabase from "./supabaseClient";

export interface ScanRecord {
  user_id: string;
  patient_id: string;
  scan_type?: string;
  notes?: string;
  file_url: string;
  created_at?: string;
}

/**
 * Save scan metadata to DB
 */
export async function saveScanToDB(scan: ScanRecord) {
  scan.created_at = new Date().toISOString();
  const { error } = await supabase.from("scans").insert([scan]);
  if (error) {
    console.error("Error saving scan", error.message);
    return { status: "danger", message: "Failed to save scan", error };
  }
  console.log("Scan successfully added to DB");
  return { status: "success", message: "Scan saved successfully" };
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