/**
 * helpers/storage.js
 * S3-compatible object storage for job photos / file uploads.
 *
 * Uses the AWS S3 SDK, so any S3-compatible backend works by changing the
 * endpoint + credentials only — no code changes:
 *   - Local demo  → MinIO  (S3_ENDPOINT=http://minio:9000)
 *   - Production  → Wasabi / AWS S3 / DigitalOcean Spaces
 *
 * Config (falls back to the WASABI_* backup vars when the S3_* vars are unset,
 * so one set of credentials can serve both photo storage and DB backups):
 *   S3_ENDPOINT          e.g. http://minio:9000 | https://s3.us-east-1.wasabisys.com
 *   S3_REGION            default us-east-1
 *   S3_BUCKET            default mbc-uploads
 *   S3_ACCESS_KEY
 *   S3_SECRET_KEY
 *   S3_FORCE_PATH_STYLE  default true (required by MinIO; harmless on Wasabi/Spaces)
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} = require('@aws-sdk/client-s3');

function getBucket() {
  return process.env.S3_BUCKET || process.env.WASABI_BUCKET || 'mbc-uploads';
}

/** True when an object store endpoint + credentials are configured. */
function isConfigured() {
  const endpoint = process.env.S3_ENDPOINT || process.env.WASABI_ENDPOINT;
  const key      = process.env.S3_ACCESS_KEY || process.env.WASABI_ACCESS_KEY;
  const secret   = process.env.S3_SECRET_KEY || process.env.WASABI_SECRET_KEY;
  return Boolean(endpoint && key && secret);
}

let _client = null;
function getClient() {
  if (_client) return _client;

  const region          = process.env.S3_REGION   || process.env.WASABI_REGION   || 'us-east-1';
  const endpoint        = process.env.S3_ENDPOINT  || process.env.WASABI_ENDPOINT || undefined;
  const accessKeyId     = process.env.S3_ACCESS_KEY || process.env.WASABI_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.WASABI_SECRET_KEY;
  const forcePathStyle  = (process.env.S3_FORCE_PATH_STYLE || 'true') !== 'false';

  _client = new S3Client({
    region,
    endpoint,
    credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined,
    forcePathStyle,
  });
  return _client;
}

/** Ensure the bucket exists (no-op if it already does). Safe to call repeatedly. */
async function ensureBucket() {
  const Bucket = getBucket();
  const client = getClient();
  try {
    await client.send(new HeadBucketCommand({ Bucket }));
  } catch (err) {
    try {
      await client.send(new CreateBucketCommand({ Bucket }));
    } catch (e) {
      const code = e.name || e.Code || '';
      // Tolerate races / already-owned buckets; surface anything else.
      if (!/BucketAlreadyOwnedByYou|BucketAlreadyExists/.test(code)) throw e;
    }
  }
}

async function putObject(key, body, contentType) {
  await ensureBucket();
  await getClient().send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return { bucket: getBucket(), key };
}

/** Returns the raw S3 GetObject response — `.Body` is a readable stream. */
async function getObject(key) {
  return getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
}

async function deleteObject(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

module.exports = {
  getBucket,
  isConfigured,
  getClient,
  ensureBucket,
  putObject,
  getObject,
  deleteObject,
};
