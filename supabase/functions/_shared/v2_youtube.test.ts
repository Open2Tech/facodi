import { assertEquals, assertRejects } from "jsr:@std/assert";
import {
  canonicalYouTubeUrl,
  extractYouTubeVideoId,
  fetchYouTubeMetadata,
  listYouTubeChannelVideos,
  normalizeYouTubeChannelInput,
  parseIsoDuration,
  resolveYouTubeChannel,
} from "./v2_youtube.ts";

const CHANNEL_HTML = `
  <html><head>
    <link rel="canonical" href="https://www.youtube.com/channel/UCfwhmgRZqb1MHNfUHMQNUJg">
    <meta property="og:title" content="Matemateca">
    <meta property="og:image" content="https://yt.example/thumb.jpg">
  </head><body></body></html>
`;

const VIDEOS_HTML = `
  {"videoRenderer":{"videoId":"cv_FW6aI-5A","title":{"runs":[{"text":"Cálculo 1 - limites e derivadas"}]},"thumbnail":{"thumbnails":[{"url":"https://yt.example/v1.jpg"}]}}}
  {"videoRenderer":{"videoId":"aaaaaaaaaaa","title":{"runs":[{"text":"Outro vídeo"}]}}}
`;

const FEED_XML = `
  <feed>
    <yt:channelId>UCfwhmgRZqb1MHNfUHMQNUJg</yt:channelId>
    <author><name>Matemateca</name></author>
    <entry>
      <yt:videoId>cv_FW6aI-5A</yt:videoId>
      <title>Cálculo 1</title>
      <published>2026-01-01T00:00:00+00:00</published>
      <media:description>Limites, derivadas e integrais.</media:description>
      <media:thumbnail url="https://yt.example/feed.jpg"/>
    </entry>
  </feed>
`;

const WATCH_HTML = `
  <html><head>
    <meta property="og:title" content="Cálculo 1 - limites e derivadas">
    <meta property="og:description" content="Aula de limites, derivadas, integrais e logaritmos.">
    <meta property="og:image" content="https://yt.example/watch.jpg">
    <meta name="keywords" content="calculo, derivada">
    <meta itemprop="datePublished" content="2026-01-01">
  </head><body>{"channelId":"UCfwhmgRZqb1MHNfUHMQNUJg","author":"Matemateca"}</body></html>
`;

function fixtureFetch(url: string | URL | Request): Promise<Response> {
  const href = url instanceof Request ? url.url : String(url);
  if (href.includes("/@Matemateca/videos")) return Promise.resolve(new Response(VIDEOS_HTML));
  if (href.includes("/@Matemateca")) return Promise.resolve(new Response(CHANNEL_HTML));
  if (href.includes("/channel/UCfwhmgRZqb1MHNfUHMQNUJg")) return Promise.resolve(new Response(CHANNEL_HTML));
  if (href.includes("feeds/videos.xml")) return Promise.resolve(new Response(FEED_XML));
  if (href.includes("/watch?v=cv_FW6aI-5A")) return Promise.resolve(new Response(WATCH_HTML));
  if (href.includes("/oembed")) {
    return Promise.resolve(Response.json({
      title: "Cálculo 1 - limites e derivadas",
      author_name: "Matemateca",
      thumbnail_url: "https://yt.example/oembed.jpg",
    }));
  }
  return Promise.resolve(new Response("not found", { status: 404 }));
}

Deno.test("extractYouTubeVideoId parses common URL shapes", () => {
  assertEquals(extractYouTubeVideoId("dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42"), "dQw4w9WgXcQ");
  assertEquals(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(extractYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assertEquals(extractYouTubeVideoId("not-a-valid-video"), null);
});

Deno.test("parseIsoDuration converts YouTube durations", () => {
  assertEquals(parseIsoDuration("PT1H2M3S"), 3723);
  assertEquals(parseIsoDuration("PT7M"), 420);
  assertEquals(parseIsoDuration("PT45S"), 45);
  assertEquals(parseIsoDuration("bad"), null);
});

Deno.test("canonicalYouTubeUrl returns watch URLs", () => {
  assertEquals(canonicalYouTubeUrl("dQw4w9WgXcQ"), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
});

Deno.test("normalizeYouTubeChannelInput accepts handles and channel URLs", () => {
  assertEquals(normalizeYouTubeChannelInput("@Matemateca").handle, "@Matemateca");
  assertEquals(normalizeYouTubeChannelInput("https://youtube.com/@Matemateca").url, "https://www.youtube.com/@Matemateca");
  assertEquals(normalizeYouTubeChannelInput("https://www.youtube.com/@Matemateca/videos").handle, "@Matemateca");
  assertEquals(
    normalizeYouTubeChannelInput("https://www.youtube.com/channel/UCfwhmgRZqb1MHNfUHMQNUJg").channelId,
    "UCfwhmgRZqb1MHNfUHMQNUJg",
  );
});

Deno.test("resolveYouTubeChannel resolves Matemateca without secrets", async () => {
  const channel = await resolveYouTubeChannel("@Matemateca", { fetcher: fixtureFetch as typeof fetch });
  assertEquals(channel.channel_id, "UCfwhmgRZqb1MHNfUHMQNUJg");
  assertEquals(channel.title, "Matemateca");
  assertEquals(channel.source, "youtube_public");
});

Deno.test("listYouTubeChannelVideos preserves public videos tab order", async () => {
  const videos = await listYouTubeChannelVideos("https://www.youtube.com/@Matemateca/videos", 5, {
    fetcher: fixtureFetch as typeof fetch,
  });
  assertEquals(videos[0].youtube_video_id, "cv_FW6aI-5A");
  assertEquals(videos[0].source, "youtube_public");
});

Deno.test("listYouTubeChannelVideos falls back to Atom feed for channel ids", async () => {
  const videos = await listYouTubeChannelVideos("https://www.youtube.com/channel/UCfwhmgRZqb1MHNfUHMQNUJg", 5, {
    fetcher: fixtureFetch as typeof fetch,
  });
  assertEquals(videos[0].youtube_video_id, "cv_FW6aI-5A");
  assertEquals(videos[0].description, "Limites, derivadas e integrais.");
});

Deno.test("fetchYouTubeMetadata reads public watch/oEmbed metadata", async () => {
  const metadata = await fetchYouTubeMetadata("cv_FW6aI-5A", { fetcher: fixtureFetch as typeof fetch });
  assertEquals(metadata.title, "Cálculo 1 - limites e derivadas");
  assertEquals(metadata.channel_title, "Matemateca");
  assertEquals(metadata.metadata.source, "youtube_public");
  assertEquals(metadata.tags.includes("analise matematica i"), true);
});

Deno.test("listYouTubeChannelVideos fails with actionable public error", async () => {
  await assertRejects(
    () => listYouTubeChannelVideos("@blocked", 5, {
      fetcher: (() => Promise.resolve(new Response("blocked", { status: 403 }))) as typeof fetch,
    }),
    Error,
    "bloqueou",
  );
});
