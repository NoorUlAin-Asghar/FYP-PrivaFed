"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import supabase from "@/lib/supabaseClient";
import { toast } from "sonner";
import { getUserPatientsWithEmail } from "@/lib/patient-db";
import { saveScanToDB } from "@/lib/scan-db";
import { X, FileText } from "lucide-react";

export default function ScanUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [patientName, setPatientName] = useState("");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const [scanId, setScanId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Fetch patient name
  useEffect(() => {
    if (!patientId) return;

    async function fetchPatientName() {
      const { patients } = await getUserPatientsWithEmail();
      const patient = patients.find(p => p.patient_id === patientId);
      if (patient) setPatientName(patient.name);
    }

    fetchPatientName();
  }, [patientId]);

  // 🔹 Upload Function
  const handleUpload = async () => {
    if (!patientId) return toast.error("Invalid patient");
    if (!scanFile) return toast.error("Please select a scan file");

    if (!scanFile.name.endsWith(".nii")) {
      return toast.error("Only .nii files are allowed");
    }

    const pattern = /^sub-strokecase\d+_dwi\.nii$/;
    if (!pattern.test(scanFile.name)) {
      return toast.error("Filename must be like sub-strokecase0001_dwi.nii");
    }

    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const filePath = `scans/${user.id}/${Date.now()}-${scanFile.name}`;

      // 🔹 Upload to correct bucket
      const { error: uploadError } = await supabase.storage
        .from("ScanRecord") // ⚠️ MAKE SURE THIS MATCHES YOUR BUCKET
        .upload(filePath, scanFile, {
          contentType: "application/octet-stream",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("ScanRecord")
        .getPublicUrl(filePath);

      // 🔥 IMPORTANT: get inserted row (with scan_id)
      const { data, error } = await supabase
        .from("scans")
        .insert([
          {
            user_id: user.id,
            patient_id: patientId,
            scan_type: scanType,
            notes,
            file_url: urlData.publicUrl,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      console.log("✅ SCAN ID:", data.scan_id);

      setScanId(data.scan_id); // ✅ store scanId

      toast.success("Scan uploaded successfully!");

    } catch (err: any) {
      console.error("🔥 ERROR:", err);
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const clearScanFile = () => {
    setScanFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // 🔹 Segmentation Button
  const handleSegmentation = () => {
    if (!scanId) {
      toast.error("Upload scan first");
      return;
    }

    router.push(`/result-page?scanId=${scanId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#008080] to-[#00f5f5]">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Upload Scan for {patientName || "Patient"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* 🔹 File + Upload */}
          <div className="grid gap-2">
            <Label>Scan File *</Label>

            {scanFile ? (
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-teal-600" />
                <span className="flex-1 truncate text-sm">{scanFile.name}</span>
                {!scanId && (
                  <button
                    type="button"
                    onClick={clearScanFile}
                    className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <Input
                ref={fileInputRef}
                type="file"
                accept=".nii"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  if (!file.name.endsWith(".nii")) {
                    toast.error("Only .nii files are allowed");
                    return;
                  }

                  const pattern = /^sub-strokecase\d+_dwi\.nii$/;
                  if (!pattern.test(file.name)) {
                    toast.error("Filename must be like sub-strokecase0001_dwi.nii");
                    return;
                  }

                  setScanFile(file);
                }}
              />
            )}
          </div>

          {/* 🔹 Scan Type */}
          <div className="grid gap-2">
            <Label>Scan Type</Label>
            <Input
              placeholder="e.g MRI, CT Scan"
              value={scanType}
              onChange={(e) => setScanType(e.target.value)}
            />
          </div>

          {/* 🔹 Notes */}
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Input
              placeholder="Optional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

        </CardContent>

        {/* 🔹 Segmentation */}
              <CardFooter className="flex gap-3">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-1/2"
        >
          {uploading ? "Uploading..." : "Upload Scan"}
        </Button>

        <Button
  className="w-1/2"
  onClick={handleSegmentation}
  disabled={!scanId}
>
  Run Segmentation
</Button>
      </CardFooter>
      </Card>
    </div>
  );
}