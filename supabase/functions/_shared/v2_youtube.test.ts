import { assertEquals, assertThrows } from "jsr:@std/assert";
import { canonicalYouTubeUrl, extractYouTubeVideoId, parseIsoDuration } from "./v2_youtube.ts";

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
