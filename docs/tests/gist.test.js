/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchGist, exchangeCodeForToken, createGist } from "../src/lib/gist.js";

describe("gist library", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchGist", () => {
    it("should successfully fetch html content from a Gist ID", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          files: {
            "file.js": { filename: "file.js", content: "console.log()" },
            "index.html": { filename: "index.html", content: "<html></html>" },
          },
        }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const html = await fetchGist("1234567890abcdef");
      expect(html).toBe("<html></html>");
      expect(globalThis.fetch).toHaveBeenCalledWith("https://api.github.com/gists/1234567890abcdef");
    });

    it("should fetch raw_url if content is truncated", async () => {
      const mockApiResponse = {
        ok: true,
        json: async () => ({
          files: {
            "index.html": {
              filename: "index.html",
              truncated: true,
              raw_url: "https://raw.githubusercontent.com/gists/raw-file",
            },
          },
        }),
      };
      const mockRawResponse = {
        ok: true,
        text: async () => "<html>large content</html>",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockApiResponse).mockResolvedValueOnce(mockRawResponse);

      const html = await fetchGist("1234567890abcdef");
      expect(html).toBe("<html>large content</html>");
      expect(globalThis.fetch).toHaveBeenNthCalledWith(2, "https://raw.githubusercontent.com/gists/raw-file");
    });

    it("should fallback to the first file if no HTML file exists", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          files: {
            "somefile.txt": { filename: "somefile.txt", content: "plain text" },
          },
        }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const html = await fetchGist("1234567890abcdef");
      expect(html).toBe("plain text");
    });

    it("should throw error if fetch fails", async () => {
      const mockResponse = {
        ok: false,
        statusText: "Not Found",
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await expect(fetchGist("1234567890abcdef")).rejects.toThrow("Failed to fetch Gist: Not Found");
    });

    it("should throw error if Gist ID is invalid", async () => {
      await expect(fetchGist("../invalid-gist-id!")).rejects.toThrow("Invalid Gist ID.");
    });
  });

  describe("exchangeCodeForToken", () => {
    it("should exchange code for access token successfully", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const token = await exchangeCodeForToken(
        "auth-code",
        "http://localhost/redirect",
        "mock-client-id",
        "https://proxy/auth",
      );
      expect(token).toBe("mock-access-token");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://proxy/auth",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            code: "auth-code",
            redirect_uri: "http://localhost/redirect",
            client_id: "mock-client-id",
          }),
        }),
      );
    });

    it("should throw error if server returns error info", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ error: "bad_verification_code", error_description: "The code passed is incorrect" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await expect(
        exchangeCodeForToken("auth-code", "http://localhost/redirect", "mock-client-id", "https://proxy/auth"),
      ).rejects.toThrow("The code passed is incorrect");
    });
  });

  describe("createGist", () => {
    it("should successfully create a gist and return the id", async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({ id: "new-gist-id" }),
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      const id = await createGist("<h1>Hello</h1>", "mock-token");
      expect(id).toBe("new-gist-id");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "https://api.github.com/gists",
        expect.objectContaining({
          method: "POST",
          headers: {
            Authorization: "Bearer mock-token",
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
        }),
      );
    });

    it("should throw unauthorized error if status is 401", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse);

      await expect(createGist("<h1>Hello</h1>", "bad-token")).rejects.toThrow("Unauthorized");
    });
  });
});
