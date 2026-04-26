"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import supabase from "@/lib/supabaseClient";
import { toast } from "sonner";
import { getUserPatientsWithEmail } from "@/lib/patient-db";
import { saveScanToDB } from "@/lib/scan-db";

export default function ScanUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [patientName, setPatientName] = useState("");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanType, setScanType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const [scanId, setScanId] = useState<string | null>(null); // ✅ NEW

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
            <div className="flex gap-2">
              <Input
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

            </div>
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