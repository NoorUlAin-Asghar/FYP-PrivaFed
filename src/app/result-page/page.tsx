"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getScanById } from "@/lib/scan-db";
import { FileText } from "lucide-react";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams.get("scanId");

  const [loading, setLoading] = useState(true);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [segmentedUrl, setSegmentedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      toast.error("Invalid scan");
      setLoading(false);
      return;
    }

    async function runSegmentation() {
      try {
        const { scan, error } = await getScanById(scanId!);
        if (error || !scan) throw new Error("Scan not found");

        // Use cached result if already segmented
        if (scan.segmented_url && scan.original_slice_url) {
          setOriginalUrl(scan.original_slice_url);
          setSegmentedUrl(scan.segmented_url);
          return;
        }

        // Otherwise run the model and persist the result
        const res = await fetch("/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url: scan.file_url, scan_id: scanId }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Segmentation failed");

        setOriginalUrl(result.original_url);
        setSegmentedUrl(result.segmented_url);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message ?? "Failed to load segmentation");
      } finally {
        setLoading(false);
      }
    }

    runSegmentation();
  }, [scanId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] p-6">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Segmentation Result
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {loading && (
            <div className="text-center text-lg font-medium">
              Processing segmentation... ⏳
            </div>
          )}

          {!loading && segmentedUrl && (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Original Scan (mid axial slice)</h2>
                  <img
                    src={originalUrl || ""}
                    alt="Original"
                    className="rounded-xl shadow-md w-full"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Segmented Output</h2>
                  <img
                    src={segmentedUrl}
                    alt="Segmented"
                    className="rounded-xl shadow-md border-2 border-teal-500 w-full"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push(`/report/${scanId}`)}
                >
                  <FileText className="w-4 h-4" />
                  Generate Report
                </Button>
              </div>
            </>
          )}

          {!loading && !segmentedUrl && (
            <div className="text-center text-red-500">
              No segmentation result available
            </div>
          )}

          <div className="text-center pt-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
