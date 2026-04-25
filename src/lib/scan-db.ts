import supabase from "./supabaseClient";

export interface ScanRecord {
  scan_id?: string;
  user_id: string;
  patient_id: string;
  scan_type?: string;
  notes?: string;
  file_url: string;
  created_at?: string;
  segmented_url?: string;
  original_slice_url?: string;
  segmented_at?: string;
}

export async function saveScanToDB(scan: ScanRecord) {
  scan.created_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("scans")
    .insert([scan])
    .select()
    .single();

  if (error) {
    console.error("Error saving scan", error.message);
    return { status: "danger", message: "Failed to save scan", error };
  }

  return { status: "success", message: "Scan saved successfully", data };
}

export async function updateScanSegmentation(
  scanId: string,
  segmentedUrl: string,
  originalSliceUrl: string
) {
  const { error } = await supabase
    .from("scans")
    .update({
      segmented_url: segmentedUrl,
      original_slice_url: originalSliceUrl,
      segmented_at: new Date().toISOString(),
    })
    .eq("scan_id", scanId);

  if (error) {
    console.error("Error saving segmentation result", error.message);
    return { status: "danger", message: "Failed to save segmentation result" };
  }

  return { status: "success", message: "Segmentation result saved" };
}

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
