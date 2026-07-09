import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getAwsCredentials() {
  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? "";
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY ??
    "";
  return { accessKeyId, secretAccessKey };
}

function getS3Client() {
  const { accessKeyId, secretAccessKey } = getAwsCredentials();
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "AWS credentials are missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env, then restart the dev server.",
    );
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
}

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
  await getS3Client().send(
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
