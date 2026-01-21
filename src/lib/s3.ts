import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client(): S3Client | null {
  const endpoint = process.env.UPLOADS_S3_ENDPOINT;
  const region = process.env.UPLOADS_S3_REGION;
  const accessKeyId = process.env.UPLOADS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.UPLOADS_S3_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    console.error("S3 environment variables not configured");
    return null;
  }

  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Generate a presigned download URL for an S3 object
 * @param fileUrl - The public URL to the S3 object (e.g., https://bucket.s3.region.amazonaws.com/key)
 * @param expiresIn - Expiration time in seconds (default: 7 days)
 * @returns Presigned URL or null if generation fails
 */
export async function generateDownloadUrl(
  fileUrl: string,
  expiresIn: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string | null> {
  try {
    const client = getS3Client();
    const bucket = process.env.UPLOADS_S3_BUCKET;

    if (!client || !bucket) {
      console.error("S3 not configured for download URL generation");
      return null;
    }

    // Extract key from fileUrl
    // Supports formats:
    // - https://bucket.s3.region.amazonaws.com/path/to/file.mp3
    // - https://cdn.example.com/path/to/file.mp3
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: "attachment", // Force download instead of inline play
    });

    const downloadUrl = await getSignedUrl(client, command, { expiresIn });

    return downloadUrl;
  } catch (error) {
    console.error("Failed to generate download URL:", error);
    return null;
  }
}

/**
 * Extract S3 key from a public URL
 */
export function extractS3Key(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
    return key;
  } catch (error) {
    console.error("Failed to extract S3 key from URL:", error);
    return null;
  }
}
