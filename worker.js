/**
 * Cloudflare worker script for Capo.js:
 * 
 * - Proxies requests ONLY from allowed origins using CORS.
 * - Accepts a POST request to `/auth` with `{ code, redirect_uri }` to exchange GitHub OAuth codes for access tokens.
 * - Accepts a `url` GET parameter to proxy HTML text responses from target sites.
 */

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:4321',
  'https://rviscomi.github.io',
  'https://dash.cloudflare.com'
];

class CorsResponse extends Response {
  constructor(origin, body, options = {}) {
    let cors = { 'Vary': 'Origin' };
    const isAllowed = ALLOWED_ORIGINS.includes(origin);
    if (isAllowed) {
      cors['Access-Control-Allow-Origin'] = origin;
    }

    options.headers = options.headers || {};
    Object.assign(options.headers, cors);
    super(body, options);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
  
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const pathname = url.pathname.replace(/\/$/, ''); // Normalize trailing slashes

  // Handle OAuth code exchange (/auth)
  if (pathname === '/auth') {
    if (request.method !== 'POST') {
      return new CorsResponse(origin, JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const { code, redirect_uri, client_id } = await request.json();
      if (!code) {
        return new CorsResponse(origin, JSON.stringify({ error: 'Missing code' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      let targetClientId = client_id;
      let targetClientSecret;

      if (client_id === env.DEV_GITHUB_CLIENT_ID || client_id === 'Ov23liRBfXQEx49vqNgF') {
        targetClientId = env.DEV_GITHUB_CLIENT_ID || client_id;
        targetClientSecret = env.DEV_GITHUB_CLIENT_SECRET;
      } else if (client_id === env.PROD_GITHUB_CLIENT_ID || client_id === 'Ov23liwtKNrfi8ZaHeh4') {
        targetClientId = env.PROD_GITHUB_CLIENT_ID || client_id;
        targetClientSecret = env.PROD_GITHUB_CLIENT_SECRET;
      } else {
        targetClientId = env.GITHUB_CLIENT_ID || client_id;
        targetClientSecret = env.GITHUB_CLIENT_SECRET || env.DEV_GITHUB_CLIENT_SECRET || env.PROD_GITHUB_CLIENT_SECRET;
      }

      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: targetClientId,
          client_secret: targetClientSecret,
          code: code,
          redirect_uri: redirect_uri
        })
      });

      const data = await tokenResponse.json();
      return new CorsResponse(origin, JSON.stringify(data), {
        status: tokenResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new CorsResponse(origin, JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Original proxy handler (?url=...)
  const target = url.searchParams.get('url');
  if (!target) {
    return new CorsResponse(origin, 'Missing `url` parameter', { status: 400 });
  }

  let response;
  try {
    response = await fetch(target);
  } catch (e) {
    return new CorsResponse(origin, 'Fetch error', { status: 502 });
  }

  if (response.status === 530) {
    return new CorsResponse(origin, 'Page does not exist', { status: 404 });
  }
  if (!response.ok) {
    return new CorsResponse(origin, 'Bad response from target', { status: 502 });
  }

  const body = await response.text();

  return new CorsResponse(origin, body, {
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    }
  });
}

async function handleOptions(request) {
  const origin = request.headers.get('origin');
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  const corsHeaders = {
    "Access-Control-Allow-Origin": isAllowed ? origin : "",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Max-Age": "86400",
  };

  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Headers": request.headers.get(
          "Access-Control-Request-Headers"
        ),
      },
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: corsHeaders['Access-Control-Allow-Methods'],
      },
    });
  }
}
