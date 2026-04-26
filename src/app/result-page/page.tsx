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
  const [originalSlices, setOriginalSlices] = useState<string[]>([]);
  const [segmentedSlices, setSegmentedSlices] = useState<string[]>([]);
  const [currentSlice, setCurrentSlice] = useState(0);

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

        const res = await fetch("/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url: scan.file_url, scan_id: scanId }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.error ?? "Segmentation failed");

        const origSlices: string[] = result.original_slices ?? [result.original_url];
        const segSlices: string[] = result.segmented_slices ?? [result.segmented_url];

        setOriginalSlices(origSlices);
        setSegmentedSlices(segSlices);
        setCurrentSlice(Math.floor(origSlices.length / 2)); // start at middle
      } catch (err: any) {
        console.error(err);
        toast.error(err.message ?? "Failed to load segmentation");
      } finally {
        setLoading(false);
      }
    }

    runSegmentation();
  }, [scanId]);

  const totalSlices = originalSlices.length;

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

          {!loading && totalSlices > 0 && (
            <>
              {/* Slice slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Slice</span>
                  <span>{currentSlice + 1} / {totalSlices}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={totalSlices - 1}
                  value={currentSlice}
                  onChange={(e) => setCurrentSlice(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              {/* Images */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Original Scan</h2>
                  <img
                    src={originalSlices[currentSlice]}
                    alt="Original"
                    className="rounded-xl shadow-md w-full"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">Segmented Output</h2>
                  <img
                    src={segmentedSlices[currentSlice]}
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

          {!loading && totalSlices === 0 && (
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