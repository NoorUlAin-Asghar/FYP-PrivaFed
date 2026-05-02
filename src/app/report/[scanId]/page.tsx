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

        if (!scan.segmented_url || !scan.original_slice_url) {
          setNotSegmented(true);
          return;
        }

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
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0 print:px-0">

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
        className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-10 print:p-6 space-y-6 print:space-y-4 print:shadow-none print:rounded-none print:max-w-none"
      >

        {/* Header */}
        <div className="border-b pb-4 print:pb-3 flex justify-between items-start">
          <div>
            <h1 className="text-3xl print:text-2xl font-bold text-[#008080]">PrivaFed</h1>
            <p className="text-gray-500 text-sm mt-1">
              Brain MRI Stroke Lesion Segmentation Report
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Report generated on</p>
            <p className="font-medium text-gray-700">{new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Patient + Scan info side by side in print to save vertical space */}
        <div className="grid grid-cols-1 print:grid-cols-2 gap-6 print:gap-4">

          {/* Patient Information */}
          <section>
            <h2 className="text-lg print:text-base font-bold text-gray-800 mb-3 border-l-4 border-[#008080] pl-3">
              Patient Information
            </h2>
            <div className="grid grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
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

          {/* Scan Details */}
          <section>
            <h2 className="text-lg print:text-base font-bold text-gray-800 mb-3 border-l-4 border-[#008080] pl-3">
              Scan Details
            </h2>
            <div className="grid grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
              <div>
                <p className="text-gray-500">Scan Type</p>
                <p className="font-semibold text-gray-900">{report.scan.scan_type}</p>
              </div>
              <div>
                <p className="text-gray-500">Scan ID</p>
                <p className="font-semibold text-gray-900 text-xs truncate">{report.scan.scan_id}</p>
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

        </div>

        {/* Segmentation Results — break-inside-avoid keeps both images on the same page */}
        <section className="break-inside-avoid">
          <h2 className="text-lg print:text-base font-bold text-gray-800 mb-2 border-l-4 border-[#008080] pl-3">
            Analysis Results
          </h2>
          <p className="text-sm print:text-xs text-gray-500 mb-3">
            Middle axial slice of the DWI scan alongside the predicted stroke lesion mask
            generated by the federated SegResNet model.
          </p>
          <div className="grid grid-cols-2 gap-6 print:gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Original DWI Scan</p>
              <img
                src={report.scan.original_slice_url}
                alt="Original Scan"
                className="rounded-xl border border-gray-200 w-full"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700 mb-2">Segmented Lesion Mask</p>
              <img
                src={report.scan.segmented_url}
                alt="Segmented"
                className="rounded-xl border-2 border-teal-400 w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            White regions indicate predicted stroke lesion areas.
          </p>
        </section>

        {/* Model Performance Metrics */}
        <section className="break-inside-avoid">
          <h2 className="text-lg print:text-base font-bold text-gray-800 mb-2 border-l-4 border-[#008080] pl-3">
            Model Performance Metrics
          </h2>
          <p className="text-sm print:text-xs text-gray-500 mb-3">
            Evaluated on 50 held-out test cases from the ISLES22 dataset using the best
            global federated model (3D SegResNet, FedAvg, 3 clients).
          </p>
          <table className="w-full text-sm print:text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 font-medium">
                <th className="py-2 pr-4 font-medium">Metric</th>
                <th className="py-2 pr-4 font-medium">Value</th>
                <th className="py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 text-gray-500">Dice Score</td>
                <td className="py-2 pr-4 font-semibold text-gray-900">0.6994</td>
                <td className="py-2 text-gray-500">Overlap between predicted and ground-truth lesion mask</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-500">IoU (Jaccard Index)</td>
                <td className="py-2 pr-4 font-semibold text-gray-900">0.5377</td>
                <td className="py-2 text-gray-500">Intersection over union of predicted and true regions</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-gray-500">HD95 (Hausdorff Distance)</td>
                <td className="py-2 pr-4 font-semibold text-gray-900">7.42 mm</td>
                <td className="py-2 text-gray-500">95th percentile surface distance between predicted and true boundary</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="border-t pt-4 print:pt-3 text-xs text-gray-400 text-center">
          This report was generated automatically by the PrivaFed system. It is intended
          for use by licensed medical practitioners only. Results should be reviewed in
          clinical context.
        </div>

      </div>
    </div>
  );
}
