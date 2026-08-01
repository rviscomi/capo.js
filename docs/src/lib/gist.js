/**
 * Fetches the content of the first HTML file (or first file) in a GitHub Gist.
 * @param {string} gistId
 * @returns {Promise<string>}
 */
export async function fetchGist(gistId) {
  if (!gistId || typeof gistId !== "string" || !/^[a-f0-9]+$/i.test(gistId.trim())) {
    throw new Error("Invalid Gist ID.");
  }
  const response = await fetch(`https://api.github.com/gists/${gistId.trim()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Gist: ${response.statusText}`);
  }
  const data = await response.json();
  const files = Object.values(data.files || {});
  if (files.length === 0) {
    throw new Error("Gist contains no files.");
  }

  // Find the first html file, otherwise fallback to the first file
  const htmlFile = files.find((file) => file.filename.endsWith(".html") || file.filename.endsWith(".htm")) || files[0];

  if (htmlFile.truncated && htmlFile.raw_url) {
    const rawResponse = await fetch(htmlFile.raw_url);
    if (!rawResponse.ok) {
      throw new Error(`Failed to fetch raw Gist content: ${rawResponse.statusText}`);
    }
    return await rawResponse.text();
  }

  return htmlFile.content;
}

/**
 * Exchanges a GitHub OAuth authorization code for an access token via a proxy endpoint.
 * @param {string} code
 * @param {string} redirectUri
 * @param {string} clientId
 * @param {string} authEndpoint
 * @returns {Promise<string>}
 */
export async function exchangeCodeForToken(code, redirectUri, clientId, authEndpoint) {
  const response = await fetch(authEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, redirect_uri: redirectUri, client_id: clientId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error_description || data.error || response.statusText || `HTTP ${response.status}`;
    throw new Error(`Auth failed: ${errorMsg}`);
  }

  if (data.access_token) {
    return data.access_token;
  } else if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  throw new Error("No access token returned from auth proxy.");
}

/**
 * Creates a secret GitHub Gist containing the provided HTML content.
 * @param {string} htmlContent
 * @param {string} token
 * @returns {Promise<string>} The created Gist ID
 */
export async function createGist(htmlContent, token) {
  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "Capo.js HTML snapshot",
      public: false,
      files: {
        "capo-head.html": {
          content: htmlContent,
        },
      },
    }),
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}`);
  }

  const gistData = await response.json();
  return gistData.id;
}
