import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker/worker.js";

test("Worker - OPTIONS preflight", async (t) => {
  await t.test("allows matching origin", async () => {
    const request = new Request("http://localhost/auth", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
    assert.equal(response.headers.get("Access-Control-Allow-Headers"), "content-type");
  });

  await t.test("handles non-allowed origin", async () => {
    const request = new Request("http://localhost/auth", {
      method: "OPTIONS",
      headers: {
        Origin: "http://disallowed-origin.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "");
  });

  await t.test("handles simple OPTIONS request", async () => {
    const request = new Request("http://localhost/auth", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Allow"), "GET,POST,OPTIONS");
  });
});

test("Worker - /auth endpoint", async (t) => {
  await t.test("returns 405 for non-POST method", async () => {
    const request = new Request("http://localhost/auth", {
      method: "GET",
      headers: { Origin: "http://localhost:3000" },
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 405);
    const body = await response.json();
    assert.deepEqual(body, { error: "Method Not Allowed" });
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
  });

  await t.test("returns 400 for missing code", async () => {
    const request = new Request("http://localhost/auth", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ redirect_uri: "http://localhost:3000/callback" }),
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.deepEqual(body, { error: "Missing code" });
  });

  await t.test("exchanges code for token using env DEV client ID", async () => {
    const originalFetch = globalThis.fetch;
    let fetchedUrl, fetchedOptions;
    globalThis.fetch = async (url, options) => {
      fetchedUrl = url;
      fetchedOptions = options;
      return new Response(JSON.stringify({ access_token: "dev_secret_token", token_type: "bearer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const env = {
        DEV_GITHUB_CLIENT_ID: "dev_client_123",
        DEV_GITHUB_CLIENT_SECRET: "dev_secret_456",
      };
      const request = new Request("http://localhost/auth", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "test_code",
          redirect_uri: "http://localhost:3000/callback",
          client_id: "dev_client_123",
        }),
      });

      const response = await worker.fetch(request, env);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.access_token, "dev_secret_token");
      assert.equal(fetchedUrl, "https://github.com/login/oauth/access_token");
      assert.deepEqual(JSON.parse(fetchedOptions.body), {
        client_id: "dev_client_123",
        client_secret: "dev_secret_456",
        code: "test_code",
        redirect_uri: "http://localhost:3000/callback",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test("exchanges code for token using env PROD client ID", async () => {
    const originalFetch = globalThis.fetch;
    let fetchedOptions;
    globalThis.fetch = async (url, options) => {
      fetchedOptions = options;
      return new Response(JSON.stringify({ access_token: "prod_secret_token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      const env = {
        PROD_GITHUB_CLIENT_ID: "prod_client_123",
        PROD_GITHUB_CLIENT_SECRET: "prod_secret_456",
      };
      const request = new Request("http://localhost/auth", {
        method: "POST",
        headers: {
          Origin: "https://rviscomi.github.io",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: "test_code",
          redirect_uri: "https://rviscomi.github.io/capo.js/",
          client_id: "prod_client_123",
        }),
      });

      const response = await worker.fetch(request, env);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://rviscomi.github.io");
      assert.deepEqual(JSON.parse(fetchedOptions.body), {
        client_id: "prod_client_123",
        client_secret: "prod_secret_456",
        code: "test_code",
        redirect_uri: "https://rviscomi.github.io/capo.js/",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test("handles upstream fetch error gracefully", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("Network error");
    };

    try {
      const request = new Request("http://localhost/auth", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: "test_code" }),
      });
      const response = await worker.fetch(request, {});
      assert.equal(response.status, 500);
      const data = await response.json();
      assert.equal(data.error, "Network error");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

test("Worker - proxy endpoint (?url=...)", async (t) => {
  await t.test("returns 400 when url parameter is missing", async () => {
    const request = new Request("http://localhost/", {
      headers: { Origin: "http://localhost:3000" },
    });
    const response = await worker.fetch(request, {});
    assert.equal(response.status, 400);
    const text = await response.text();
    assert.equal(text, "Missing `url` parameter");
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
  });

  await t.test("proxies successful target response", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (targetUrl) => {
      assert.equal(targetUrl, "https://example.com");
      return new Response("<html><head></head></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    try {
      const request = new Request("http://localhost/?url=https%3A%2F%2Fexample.com", {
        headers: { Origin: "http://localhost:3000" },
      });
      const response = await worker.fetch(request, {});
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), "text/plain;charset=utf-8");
      assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000");
      const text = await response.text();
      assert.equal(text, "<html><head></head></html>");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test("returns 502 on fetch failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error("Connection refused");
    };

    try {
      const request = new Request("http://localhost/?url=https%3A%2F%2Fexample.com");
      const response = await worker.fetch(request, {});
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.equal(text, "Fetch error");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test("returns 404 when target returns 530 status", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response("", { status: 530 });
    };

    try {
      const request = new Request("http://localhost/?url=https%3A%2F%2Fexample.com");
      const response = await worker.fetch(request, {});
      assert.equal(response.status, 404);
      const text = await response.text();
      assert.equal(text, "Page does not exist");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.test("returns 502 when target returns non-ok status", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response("Internal Server Error", { status: 500 });
    };

    try {
      const request = new Request("http://localhost/?url=https%3A%2F%2Fexample.com");
      const response = await worker.fetch(request, {});
      assert.equal(response.status, 502);
      const text = await response.text();
      assert.equal(text, "Bad response from target");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
