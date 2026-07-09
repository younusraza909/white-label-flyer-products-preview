import { NextResponse } from "next/server";
import { query } from "@/lib/db-postgres";
import { s3KeyFromUrl, s3UrlFromKey, uploadToS3 } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const id = formData.get("id");
    const currentUrl = formData.get("currentUrl");

    if (!(file instanceof File) || !id || typeof currentUrl !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    const key = s3KeyFromUrl(currentUrl);
    if (!key) {
      return NextResponse.json({ error: "Invalid S3 URL" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToS3(key, buffer, file.type);

    const url = `${s3UrlFromKey(key)}?v=${Date.now()}`;
    await query(
      "UPDATE flyer_products SET product_white_label_image = $1 WHERE id = $2",
      [url, id],
    );

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("Upload failed:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
