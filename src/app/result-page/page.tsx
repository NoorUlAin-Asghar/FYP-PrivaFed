"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import supabase from "@/lib/supabaseClient";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");

  const [loading, setLoading] = useState(true);
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [segmentedUrl, setSegmentedUrl] = useState<string | null>(null);

  // 🔹 Fetch latest scan
  useEffect(() => {
    if (!patientId) {
      toast.error("Invalid patient");
      return;
    }

    async function fetchLatestScan() {
      try {
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;

        setScanUrl(data.file_url);

        // 🔥 Call segmentation API (replace with your backend)
        const res = await fetch("/api/segment", {
          method: "POST",
          body: JSON.stringify({ file_url: data.file_url }),
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.error);

        // expected: result.segmented_url
        setSegmentedUrl(result.segmented_url);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load segmentation");
      } finally {
        setLoading(false);
      }
    }

    fetchLatestScan();
  }, [patientId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0f2027] via-[#203a43] to-[#2c5364] p-6">
      <Card className="w-full max-w-4xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold">
            Segmentation Result
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* 🔹 Loading */}
          {loading && (
            <div className="text-center text-lg font-medium">
              Processing segmentation... ⏳
            </div>
          )}

          {/* 🔹 Result */}
          {!loading && segmentedUrl && (
            <div className="grid md:grid-cols-2 gap-6">

              {/* Original */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Original Scan</h2>
                <img
                  src={scanUrl || ""}
                  alt="Original"
                  className="rounded-xl shadow-md"
                />
              </div>

              {/* Segmented */}
              <div>
                <h2 className="text-lg font-semibold mb-2">Segmented Output</h2>
                <img
                  src={segmentedUrl}
                  alt="Segmented"
                  className="rounded-xl shadow-md border-2 border-teal-500"
                />
              </div>

            </div>
          )}

          {/* 🔹 Error fallback */}
          {!loading && !segmentedUrl && (
            <div className="text-center text-red-500">
              No segmentation result available
            </div>
          )}

          {/* 🔹 Back button */}
          <div className="text-center pt-4">
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}