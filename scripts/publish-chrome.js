import fs from "fs";
import path from "path";

const { CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN, CHROME_EXTENSION_ID } = process.env;

const requiredEnv = ["CHROME_CLIENT_ID", "CHROME_CLIENT_SECRET", "CHROME_REFRESH_TOKEN", "CHROME_EXTENSION_ID"];

const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`❌ Error: Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const ZIP_PATH = path.resolve("dist/chrome.zip");
if (!fs.existsSync(ZIP_PATH)) {
  console.error(`❌ Error: Zip file not found at ${ZIP_PATH}. Run 'npm run build' first.`);
  process.exit(1);
}

async function getAccessToken() {
  console.log("🔑 Requesting OAuth2 access token...");
  const params = new URLSearchParams({
    client_id: CHROME_CLIENT_ID,
    client_secret: CHROME_CLIENT_SECRET,
    refresh_token: CHROME_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to obtain access token (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function uploadPackage(accessToken) {
  console.log(`📦 Uploading package (${ZIP_PATH}) to Chrome Web Store item ${CHROME_EXTENSION_ID}...`);
  const zipBuffer = fs.readFileSync(ZIP_PATH);

  const res = await fetch(`https://www.googleapis.com/upload/chromewebstore/v1.1/items/${CHROME_EXTENSION_ID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-api-version": "2",
    },
    body: zipBuffer,
  });

  const data = await res.json();
  if (!res.ok || data.uploadState !== "SUCCESS") {
    throw new Error(`Package upload failed: ${JSON.stringify(data, null, 2)}`);
  }

  console.log("✅ Package uploaded successfully.");
  return data;
}

async function publishItem(accessToken) {
  console.log(`🚀 Submitting item ${CHROME_EXTENSION_ID} for review / publishing...`);
  const res = await fetch(`https://www.googleapis.com/chromewebstore/v1.1/items/${CHROME_EXTENSION_ID}/publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-api-version": "2",
      "Content-Length": "0",
    },
  });

  const data = await res.json();
  if (!res.ok || (Array.isArray(data.status) && !data.status.includes("OK"))) {
    throw new Error(`Publish failed: ${JSON.stringify(data, null, 2)}`);
  }

  console.log("✅ Item submitted to Chrome Web Store successfully:", data);
  return data;
}

async function main() {
  try {
    const accessToken = await getAccessToken();
    await uploadPackage(accessToken);
    await publishItem(accessToken);
    console.log("🎉 Chrome Web Store update completed successfully!");
  } catch (error) {
    console.error("❌ Chrome Web Store publish error:", error.message);
    process.exit(1);
  }
}

main();
