"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getScanById } from "@/lib/scan-db";
import { getPatientById } from "@/lib/patient-db";
import { Printer, ArrowLeft, PlayCircle } from "lucide-react";

type ReportData = {
  patient: {
    name: string;
    cnic: string;
    dob: string;
    gender: string;
  };
  scan: {
    scan_id: string;
    scan_type: string;
    notes: string;
    created_at: string;
    segmented_at: string;
    original_slice_url: string;
    segmented_url: string;
  };
};

function formatCNIC(cnic: string) {
  if (!cnic) return "";
  return `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`;
}

export default function ReportPage() {
  const { scanId } = useParams<{ scanId: string }>();
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notSegmented, setNotSegmented] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        const { scan, error: scanErr } = await getScanById(scanId);
        if (scanErr || !scan) throw new Error("Scan not found");

        // Segmentation hasn't been run yet — guide the user
        if (!scan.segmented_url || !scan.original_slice_url) {
          setNotSegmented(true);
          return;
        }

        // getPatientById returns the patient directly, or {patient:null} on error
        const patient = await getPatientById(scan.patient_id);
        if (!patient || !patient.name) throw new Error("Patient not found");

        setReport({
          patient: {
            name: patient.name,
            cnic: String(patient.cnic),
            dob: new Date(patient.dob).toLocaleDateString(),
            gender: patient.gender,
          },
          scan: {
            scan_id: scan.scan_id,
            scan_type: scan.scan_type || "MRI",
            notes: scan.notes || "—",
            created_at: new Date(scan.created_at).toLocaleString(),
            segmented_at: new Date(scan.segmented_at).toLocaleString(),
            original_slice_url: scan.original_slice_url,
            segmented_url: scan.segmented_url,
          },
        });
      } catch (err: any) {
        toast.error(err.message ?? "Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [scanId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading report...</p>
      </div>
    );
  }

  // Segmentation not yet run — prompt the user to run it first
  if (notSegmented) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center space-y-4">
          <PlayCircle className="w-14 h-14 text-[#008080] mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800">Segmentation Required</h2>
          <p className="text-gray-500 text-sm">
            This scan has not been analysed yet. Please run segmentation first — the
            report will be available once the model has processed the scan.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="bg-[#008080] hover:bg-teal-800 w-full gap-2"
              onClick={() => router.push(`/result-page?scanId=${scanId}`)}
            >
              <PlayCircle className="w-4 h-4" />
              Run Segmentation Now
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">Report could not be loaded.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">

      {/* Action bar — hidden when printing */}
      <div className="max-w-3xl mx-auto flex gap-3 mb-6 print:hidden">
        <Button variant="outline" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          className="gap-2 bg-[#008080] hover:bg-teal-800"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Download / Print Report
        </Button>
      </div>

      {/* Report content */}
      <div
        id="report"
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 space-y-8 print:shadow-none print:rounded-none print:p-0"
      >
        {/* Header */}
        <div className="border-b pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#008080]">PrivaFed</h1>
            <p className="text-gray-500 text-sm mt-1">
              Brain MRI Stroke Lesion Segmentation Report
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Report generated on</p>
            <p className="font-medium text-gray-700">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Patient Information */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-[#008080] pl-3">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-semibold text-gray-900">{report.patient.name}</p>
            </div>
            <div>
              <p className="text-gray-500">CNIC</p>
              <p className="font-semibold text-gray-900">{formatCNIC(report.patient.cnic)}</p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-semibold text-gray-900">{report.patient.dob}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-semibold text-gray-900 capitalize">{report.patient.gender}</p>
            </div>
          </div>
        </section>

        {/* Scan Information */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-[#008080] pl-3">
            Scan Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Scan Type</p>
              <p className="font-semibold text-gray-900">{report.scan.scan_type}</p>
            </div>
            <div>
              <p className="text-gray-500">Scan ID</p>
              <p className="font-semibold text-gray-900 text-xs">{report.scan.scan_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Upload Date</p>
              <p className="font-semibold text-gray-900">{report.scan.created_at}</p>
            </div>
            <div>
              <p className="text-gray-500">Analysis Date</p>
              <p className="font-semibold text-gray-900">{report.scan.segmented_at}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Clinical Notes</p>
              <p className="font-semibold text-gray-900">{report.scan.notes}</p>
            </div>
          </div>
        </section>

        {/* Segmentation Results */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-[#008080] pl-3">
            Analysis Results
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            The images below show the middle axial slice of the DWI scan alongside
            the predicted stroke lesion mask generated by the federated SegResNet model.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Original DWI Scan</p>
              <img
                src={report.scan.original_slice_url}
                alt="Original Scan"
                className="rounded-xl border border-gray-200 w-full"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Segmented Lesion Mask
              </p>
              <img
                src={report.scan.segmented_url}
                alt="Segmented"
                className="rounded-xl border-2 border-teal-400 w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            White regions indicate predicted stroke lesion areas. Model: 3D SegResNet
            trained via Federated Averaging (FedAvg) on ISLES22 dataset. Test Dice: 0.6994.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t pt-4 text-xs text-gray-400 text-center">
          This report was generated automatically by the PrivaFed system. It is intended
          for use by licensed medical practitioners only. Results should be reviewed in
          clinical context.
        </div>
      </div>
    </div>
  );
}
