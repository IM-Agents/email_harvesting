const fs = require("fs")
const path = require("path")
const { env } = require("../config/env")

const LOCAL_ROOT = path.join(__dirname, "../../uploads")

const ensureLocalDir = (key) => {
  const fullPath = path.join(LOCAL_ROOT, key)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  return fullPath
}

const isS3Configured = () =>
  Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)

let s3Client = null

const getS3Client = () => {
  if (!isS3Configured()) return null
  if (!s3Client) {
    const { S3Client } = require("@aws-sdk/client-s3")
    s3Client = new S3Client({
      region: env.S3_REGION || "us-east-1",
      endpoint: env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

const putObject = async (key, data) => {
  if (isS3Configured()) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3")
    const client = getS3Client()
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: data,
      })
    )
    return { storage_key: key, backend: "s3" }
  }

  const fullPath = ensureLocalDir(key)
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
  fs.writeFileSync(fullPath, buffer)
  return { storage_key: key, backend: "local", path: fullPath }
}

const getObjectPath = async (key) => {
  if (isS3Configured()) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3")
    const client = getS3Client()
    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
      })
    )
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)
    const tempPath = path.join(LOCAL_ROOT, "tmp", path.basename(key))
    fs.mkdirSync(path.dirname(tempPath), { recursive: true })
    fs.writeFileSync(tempPath, buffer)
    return tempPath
  }

  return path.join(LOCAL_ROOT, key)
}

const moveUploadToStorage = async (tempPath, storageKey) => {
  const buffer = fs.readFileSync(tempPath)
  await putObject(storageKey, buffer)
  try {
    fs.unlinkSync(tempPath)
  } catch {
    // ignore cleanup errors
  }
  return storageKey
}

const readStorageToPath = async (storageKey, destPath) => {
  if (isS3Configured()) {
    const temp = await getObjectPath(storageKey)
    fs.copyFileSync(temp, destPath)
    return destPath
  }

  const source = path.join(LOCAL_ROOT, storageKey)
  fs.copyFileSync(source, destPath)
  return destPath
}

module.exports = {
  LOCAL_ROOT,
  isS3Configured,
  putObject,
  getObjectPath,
  moveUploadToStorage,
  readStorageToPath,
}
