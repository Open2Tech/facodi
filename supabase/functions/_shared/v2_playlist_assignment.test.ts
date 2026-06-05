import { assertEquals } from "jsr:@std/assert";
import {
  assignPlaylistDeterministically,
  type FacodiPlaylistCandidate,
} from "./v2_playlist_assignment.ts";

const playlists: FacodiPlaylistCandidate[] = [
  {
    id: "pl-ami",
    title: "Análise Matemática I - 1.º Ano 1.º Semestre - LESTI",
    slug: "lesti-19411002",
    description: "Limites, derivadas, integrais e cálculo diferencial.",
    course_id: "course-lesti",
    course_code: "LESTI",
    unit_id: "unit-ami",
    unit_code: "19411002",
  },
  {
    id: "pl-amii",
    title: "Análise Matemática II - LESTI",
    slug: "lesti-19411015",
    description: "Séries e cálculo multivariável.",
    course_id: "course-lesti",
    course_code: "LESTI",
    unit_id: "unit-amii",
    unit_code: "19411015",
  },
  {
    id: "pl-termo",
    title: "Termodinâmica",
    slug: "termodinamica",
    description: "Energia, calor e máquinas térmicas.",
    course_id: "course-eng",
    course_code: "ENG",
    unit_id: "unit-termo",
    unit_code: "TERMO",
  },
];

Deno.test("Matemateca acceptance video selects LESTI Analise Matematica I playlist", () => {
  const result = assignPlaylistDeterministically({
    youtube_video_id: "cv_FW6aI-5A",
    title: "Cálculo 1 - limites e derivadas",
    description: "Aula sobre limites, derivadas, integrais, logaritmos e trigonometria.",
    channel_title: "Matemateca",
    tags: ["calculo"],
  }, playlists);

  assertEquals(result.assigned_playlist_slug, "lesti-19411002");
  assertEquals(result.assigned_unit_code, "19411002");
  assertEquals(result.assigned_curricular_unit_id, "unit-ami");
});

Deno.test("calculus topics beat Analise Matematica II", () => {
  const result = assignPlaylistDeterministically({
    title: "Cálculo 1: derivadas, integrais e limites",
    description: "Equações, logaritmo e trigonometria para início do curso.",
  }, playlists);

  assertEquals(result.assigned_playlist_slug, "lesti-19411002");
});

Deno.test("thermodynamics does not select Analise Matematica I", () => {
  const result = assignPlaylistDeterministically({
    title: "Introdução à termodinâmica",
    description: "Calor, energia interna e máquinas térmicas.",
  }, playlists);

  assertEquals(result.assigned_playlist_slug, "termodinamica");
});
