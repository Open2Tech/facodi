import { assertEquals, assertRejects, assertThrows } from "jsr:@std/assert";
import {
  canonicalYouTubeUrl,
  extractYouTubeVideoId,
  fetchYouTubeMetadata,
  normalizeYouTubeChannelInput,
  parseIsoDuration,
  youtubeApiGet,
} from "./v2_youtube.ts";

Deno.test("extractYouTubeVideoId accepts raw ids", () => {
  assertEquals(extractYouTubeVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

Deno.test("extractYouTubeVideoId parses common URL shapes", () => {
  assertEquals(
    extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42"),
    "dQw4w9WgXcQ",
  );
  assertEquals(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(
    extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assertEquals(
    extractYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
});

Deno.test("extractYouTubeVideoId rejects invalid input", () => {
  assertThrows(() => extractYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ"));
  assertThrows(() => extractYouTubeVideoId("not-a-valid-video"));
});

Deno.test("parseIsoDuration converts YouTube durations", () => {
  assertEquals(parseIsoDuration("PT1H2M3S"), 3723);
  assertEquals(parseIsoDuration("PT7M"), 420);
  assertEquals(parseIsoDuration("PT45S"), 45);
  assertEquals(parseIsoDuration("P1DT1H"), 90000);
  assertEquals(parseIsoDuration("bad"), null);
});

Deno.test("canonicalYouTubeUrl returns watch URLs", () => {
  assertEquals(canonicalYouTubeUrl("dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

Deno.test("normalizeYouTubeChannelInput accepts ids, handles, and URLs", () => {
  assertEquals(normalizeYouTubeChannelInput("UC1234567890123456789012"), {
    id: "UC1234567890123456789012",
  });
  assertEquals(normalizeYouTubeChannelInput("@facodi"), { forHandle: "@facodi" });
  assertEquals(normalizeYouTubeChannelInput("https://www.youtube.com/@facodi"), {
    forHandle: "@facodi",
  });
  assertEquals(normalizeYouTubeChannelInput("https://www.youtube.com/user/facodi"), {
    forUsername: "facodi",
  });
});

Deno.test("youtubeApiGet fails clearly when OAuth secrets are missing", async () => {
  const previous = {
    id: Deno.env.get("YOUTUBE_OAUTH_CLIENT_ID"),
    secret: Deno.env.get("YOUTUBE_OAUTH_CLIENT_SECRET"),
    refresh: Deno.env.get("YOUTUBE_OAUTH_REFRESH_TOKEN"),
  };
  try {
    Deno.env.delete("YOUTUBE_OAUTH_CLIENT_ID");
    Deno.env.delete("YOUTUBE_OAUTH_CLIENT_SECRET");
    Deno.env.delete("YOUTUBE_OAUTH_REFRESH_TOKEN");
    await assertRejects(
      () => youtubeApiGet("videos", { id: "dQw4w9WgXcQ" }),
      Error,
      "YouTube OAuth is not configured",
    );
  } finally {
    if (previous.id) Deno.env.set("YOUTUBE_OAUTH_CLIENT_ID", previous.id);
    if (previous.secret) Deno.env.set("YOUTUBE_OAUTH_CLIENT_SECRET", previous.secret);
    if (previous.refresh) Deno.env.set("YOUTUBE_OAUTH_REFRESH_TOKEN", previous.refresh);
  }
});

Deno.test("youtubeApiGet refreshes OAuth token and calls Data API with bearer token", async () => {
  const previous = {
    id: Deno.env.get("YOUTUBE_OAUTH_CLIENT_ID"),
    secret: Deno.env.get("YOUTUBE_OAUTH_CLIENT_SECRET"),
    refresh: Deno.env.get("YOUTUBE_OAUTH_REFRESH_TOKEN"),
  };
  const seen: Array<{ url: string; auth: string | null }> = [];
  try {
    Deno.env.set("YOUTUBE_OAUTH_CLIENT_ID", "client");
    Deno.env.set("YOUTUBE_OAUTH_CLIENT_SECRET", "secret");
    Deno.env.set("YOUTUBE_OAUTH_REFRESH_TOKEN", "refresh");
    const fetcher = ((input: URL | RequestInfo, init?: RequestInit) => {
      const url = input instanceof URL ? input.toString() : String(input);
      seen.push({ url, auth: new Headers(init?.headers).get("authorization") });
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve(Response.json({ access_token: "access-token" }));
      }
      return Promise.resolve(Response.json({ ok: true }));
    }) as typeof fetch;

    const result = await youtubeApiGet<{ ok: boolean }>("videos", { id: "abc" }, { fetcher });

    assertEquals(result.ok, true);
    assertEquals(seen.length, 2);
    assertEquals(seen[1].auth, "Bearer access-token");
    assertEquals(seen[1].url.includes("youtube/v3/videos?id=abc"), true);
  } finally {
    if (previous.id) Deno.env.set("YOUTUBE_OAUTH_CLIENT_ID", previous.id);
    else Deno.env.delete("YOUTUBE_OAUTH_CLIENT_ID");
    if (previous.secret) Deno.env.set("YOUTUBE_OAUTH_CLIENT_SECRET", previous.secret);
    else Deno.env.delete("YOUTUBE_OAUTH_CLIENT_SECRET");
    if (previous.refresh) Deno.env.set("YOUTUBE_OAUTH_REFRESH_TOKEN", previous.refresh);
    else Deno.env.delete("YOUTUBE_OAUTH_REFRESH_TOKEN");
  }
});

Deno.test("fetchYouTubeMetadata maps OAuth API response", async () => {
  const previous = {
    id: Deno.env.get("YOUTUBE_OAUTH_CLIENT_ID"),
    secret: Deno.env.get("YOUTUBE_OAUTH_CLIENT_SECRET"),
    refresh: Deno.env.get("YOUTUBE_OAUTH_REFRESH_TOKEN"),
  };
  try {
    Deno.env.set("YOUTUBE_OAUTH_CLIENT_ID", "client");
    Deno.env.set("YOUTUBE_OAUTH_CLIENT_SECRET", "secret");
    Deno.env.set("YOUTUBE_OAUTH_REFRESH_TOKEN", "refresh");
    const fetcher = ((input: URL | RequestInfo) => {
      const url = input instanceof URL ? input.toString() : String(input);
      if (url.includes("oauth2.googleapis.com/token")) {
        return Promise.resolve(Response.json({ access_token: "access-token" }));
      }
      return Promise.resolve(Response.json({
        items: [{
          id: "dQw4w9WgXcQ",
          snippet: {
            title: "Video title",
            description: "Video description",
            channelId: "UC123",
            channelTitle: "Channel",
            publishedAt: "2026-01-01T00:00:00Z",
            tags: ["math"],
            defaultAudioLanguage: "pt",
          },
          contentDetails: { duration: "PT2M" },
          statistics: { viewCount: "10" },
        }],
      }));
    }) as typeof fetch;

    const metadata = await fetchYouTubeMetadata("dQw4w9WgXcQ", { fetcher });

    assertEquals(metadata.title, "Video title");
    assertEquals(metadata.duration_seconds, 120);
    assertEquals(metadata.metadata.youtube_auth_mode, "oauth");
  } finally {
    if (previous.id) Deno.env.set("YOUTUBE_OAUTH_CLIENT_ID", previous.id);
    else Deno.env.delete("YOUTUBE_OAUTH_CLIENT_ID");
    if (previous.secret) Deno.env.set("YOUTUBE_OAUTH_CLIENT_SECRET", previous.secret);
    else Deno.env.delete("YOUTUBE_OAUTH_CLIENT_SECRET");
    if (previous.refresh) Deno.env.set("YOUTUBE_OAUTH_REFRESH_TOKEN", previous.refresh);
    else Deno.env.delete("YOUTUBE_OAUTH_REFRESH_TOKEN");
  }
});
