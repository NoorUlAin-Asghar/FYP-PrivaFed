import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client — used only server-side, never exposed to the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function extractStoragePath(publicUrl: string): string | null {
  const marker = "/object/public/ScanRecord/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function POST(req: Request) {
  try {
    const { file_url, scan_id } = await req.json();

    // Download the file server-side using the admin key (bucket stays private)
    const path = extractStoragePath(file_url);
    if (!path) {
      return NextResponse.json({ error: "Could not resolve file path" }, { status: 400 });
    }

    const { data: blob, error: downloadError } = await supabaseAdmin.storage
      .from("ScanRecord")
      .download(path);

    if (downloadError || !blob) {
      console.error("Download error:", downloadError?.message);
      return NextResponse.json({ error: "Failed to download scan file" }, { status: 500 });
    }

    // Convert to base64 and forward to the Python inference server
    const buffer = await blob.arrayBuffer();
    const fileContent = Buffer.from(buffer).toString("base64");

    const res = await fetch("http://localhost:8000/segment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_content: fileContent }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.detail ?? "Inference failed" },
        { status: 500 }
      );
    }

    const data = await res.json();

    // Persist segmentation result to the scans table
    if (scan_id && data.segmented_url && data.original_url) {
      await supabaseAdmin
        .from("scans")
        .update({
          segmented_url: data.segmented_url,
          original_slice_url: data.original_url,
          segmented_at: new Date().toISOString(),
        })
        .eq("scan_id", scan_id);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
