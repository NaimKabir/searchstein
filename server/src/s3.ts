import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const s3UrlExpiry = parseInt(process.env.S3_URL_EXPIRY || '1800', 10);
const s3Bucket = process.env.S3_BUCKET || '';

export async function signS3Url(s3Url: string): Promise<string> {
  try {
    // Parse S3 URL to extract bucket and key
    // Format: s3://bucket-name/path/to/file or https://bucket-name.s3.region.amazonaws.com/path/to/file
    let bucket = s3Bucket;
    let key = '';

    if (s3Url.startsWith('s3://')) {
      const parts = s3Url.replace('s3://', '').split('/');
      bucket = parts[0];
      key = parts.slice(1).join('/');
    } else if (s3Url.includes('.s3.') || s3Url.includes('.s3-')) {
      // HTTPS URL format
      const url = new URL(s3Url);
      bucket = url.hostname.split('.')[0];
      key = url.pathname.slice(1); // Remove leading slash
    } else {
      // Assume it's just the key
      key = s3Url;
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: s3UrlExpiry,
    });

    return signedUrl;
  } catch (error) {
    console.error('S3 URL signing error:', error);
    throw error;
  }
}
