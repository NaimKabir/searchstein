import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
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

export async function getDocumentPages(samplePageUrl: string): Promise<string[]> {
  try {
    // Parse the sample URL to extract bucket and key
    let bucket = s3Bucket;
    let key = '';

    // Remove query string if present (for signed URLs)
    const urlWithoutQuery = samplePageUrl.split('?')[0];

    if (urlWithoutQuery.startsWith('s3://')) {
      const parts = urlWithoutQuery.replace('s3://', '').split('/');
      bucket = parts[0];
      key = decodeURIComponent(parts.slice(1).join('/'));
    } else if (urlWithoutQuery.includes('.s3.') || urlWithoutQuery.includes('.s3-')) {
      const url = new URL(urlWithoutQuery);
      bucket = url.hostname.split('.')[0];
      // Decode the pathname to handle spaces and special characters
      key = decodeURIComponent(url.pathname.slice(1));
    } else {
      key = decodeURIComponent(urlWithoutQuery);
    }

    // Extract the prefix before 'page_' - all pages share this prefix
    const pageIndex = key.indexOf('page_');
    if (pageIndex === -1) {
      throw new Error('Could not find page pattern in S3 key');
    }
    const prefix = key.substring(0, pageIndex);

    // List all objects in S3 with this prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    });

    const listResponse = await s3Client.send(listCommand);
    const contents = listResponse.Contents || [];

    // Filter for page files, extract page numbers, and sort
    const pageFiles = contents
      .filter(obj => obj.Key && obj.Key.match(/page_\d+\.pdf$/))
      .map(obj => {
        const match = obj.Key!.match(/page_(\d+)\.pdf$/);
        return {
          key: obj.Key!,
          pageNumber: match ? parseInt(match[1], 10) : 0,
        };
      })
      .filter(file => file.pageNumber > 0)
      .sort((a, b) => a.pageNumber - b.pageNumber);

    // Sign URLs for all pages in order
    const signedUrls = await Promise.all(
      pageFiles.map(async (file) => {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: file.key,
        });

        return await getSignedUrl(s3Client, command, {
          expiresIn: s3UrlExpiry,
        });
      })
    );

    return signedUrls;
  } catch (error) {
    console.error('Error getting document pages:', error);
    throw error;
  }
}
