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

  // Fetch patient name for display
  useEffect(() => {
    if (!patientId) return;

    async function fetchPatientName() {
      const { patients } = await getUserPatientsWithEmail();
      const patient = patients.find(p => p.patient_id === patientId);
      if (patient) setPatientName(patient.name);
    }

    fetchPatientName();
  }, [patientId]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) return toast.error("Invalid patient");
    if (!scanFile) return toast.error("Please select a scan file");

    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("User not authenticated");

      const filePath = `scans/${user.id}/${Date.now()}-${scanFile.name}`;
      const { error: uploadError } = await supabase.storage.from("scans").upload(filePath, scanFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("scans").getPublicUrl(filePath);

      const res = await saveScanToDB({
        user_id: user.id,
        patient_id: patientId,
        scan_type: scanType,
        notes,
        file_url: urlData.publicUrl,
      });

      if (res.error) throw res.error;

      toast.success("Scan uploaded successfully!");
      router.push(`/patient/${patientId}`); // back to patient profile

    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#008080] to-[#00f5f5]">
      <Card className="w-full max-w-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Upload Scan for {patientName || "Patient"}
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleUpload}>
          <CardContent className="space-y-6">

            <div className="grid gap-2">
              <Label>Scan File *</Label>
              <Input type="file" accept="image/*,.pdf,.dcm" onChange={(e) => setScanFile(e.target.files?.[0] || null)} />
            </div>

            <div className="grid gap-2">
              <Label>Scan Type</Label>
              <Input placeholder="e.g MRI, CT Scan" value={scanType} onChange={(e) => setScanType(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

          </CardContent>

          <CardFooter>
            <Button className="w-full" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Scan"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}