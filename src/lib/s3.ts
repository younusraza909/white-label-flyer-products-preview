import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_KEY || "",
  },
});

export function s3KeyFromUrl(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url.split("?")[0]);
    if (!hostname.includes(".amazonaws.com")) return null;
    const key = pathname.replace(/^\//, "");
    return key || null;
  } catch {
    return null;
  }
}

export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );
}

export function s3UrlFromKey(key: string): string {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}
