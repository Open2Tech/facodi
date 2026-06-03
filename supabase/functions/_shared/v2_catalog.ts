import type { AdminClient } from "./v2_supabase.ts";
import { facodi, unwrap, unwrapMaybe } from "./v2_supabase.ts";
import {
  estimateTokens,
  firstSubstantialParagraph,
  normalizeForSearch,
  normalizeWhitespace,
  sha256Hex,
  slugify,
  splitText,
  stripHtml,
  uniqueStrings,
} from "./v2_text.ts";
import { HttpError } from "./v2_http.ts";

export interface CourseSyncPayload {
  external_source?: string;
  external_id?: string | number;
  odoo_id?: string | number;
  odoo_channel_id?: string | number;
  slug?: string;
  title?: string;
  name?: string;
  summary?: string;
  description_short?: string;
  description?: string;
  description_html?: string;
  degree_type?: string;
  language?: string;
  school?: string;
  source_url?: string;
  plan_url?: string;
  published?: boolean;
  is_published?: boolean;
  website_published?: boolean;
  tag_names?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  units?: CurricularUnitSyncPayload[];
}

export interface CurricularUnitSyncPayload {
  external_source?: string;
  external_id?: string | number;
  odoo_slide_id?: string | number;
  code?: string;
  slug?: string;
  title?: string;
  name?: string;
  summary?: string;
  description?: string;
  description_html?: string;
  curricular_year?: number | string | null;
  year?: number | string | null;
  semester?: number | string | null;
  ects?: number | string | null;
  language?: string;
  official_pdf_url?: string;
  resource_links?: string[];
  metadata?: Record<string, unknown>;
}

export interface CourseSyncResult {
  course_id: string;
  external_id: string;
  slug: string;
  units_created_or_updated: number;
  knowledge_chunks_written: number;
}

function toInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getExternalId(payload: CourseSyncPayload | CurricularUnitSyncPayload): string {
  const record = payload as Record<string, unknown>;
  const raw = record.external_id ?? record.odoo_id ?? record.odoo_channel_id ??
    record.odoo_slide_id;
  if (raw === null || raw === undefined || String(raw).trim() === "") {
    throw new HttpError(
      400,
      "missing_external_id",
      "Course or unit payload is missing an external id.",
    );
  }
  return String(raw).trim();
}

function inferDegreeType(title: string, tags: string[]): string | null {
  const haystack = normalizeForSearch([title, ...tags].join(" "));
  if (haystack.includes("ctesp") || haystack.includes("tecnico superior profissional")) {
    return "Curso Tecnico Superior Profissional";
  }
  if (haystack.includes("pos graduacao")) {
    return "Pos-Graduacao";
  }
  if (haystack.includes("curso livre") || haystack.includes("formacao livre")) {
    return "Formacao Livre";
  }
  if (haystack.includes("licenciatura")) {
    return "Licenciatura";
  }
  if (haystack.includes("mestrado")) {
    return "Mestrado";
  }
  if (haystack.includes("doutoramento")) {
    return "Doutoramento";
  }
  return null;
}

async function upsertKnowledgeSource(
  admin: AdminClient,
  row: Record<string, unknown>,
): Promise<string> {
  const db = facodi(admin);
  let existingQuery = db
    .from("knowledge_sources")
    .select("id")
    .eq("entity_type", row.entity_type as string)
    .eq("source_type", row.source_type as string)
    .limit(1);

  if (row.course_id) {
    existingQuery = existingQuery.eq("course_id", row.course_id as string);
  }
  if (row.curricular_unit_id) {
    existingQuery = existingQuery.eq("curricular_unit_id", row.curricular_unit_id as string);
  }

  const existing = unwrapMaybe<{ id: string }>(await existingQuery.maybeSingle());
  if (existing) {
    const updated = unwrap<{ id: string }>(
      await db.from("knowledge_sources").update(row).eq("id", existing.id).select("id").single(),
    );
    return updated.id;
  }

  const inserted = unwrap<{ id: string }>(
    await db.from("knowledge_sources").insert(row).select("id").single(),
  );
  return inserted.id;
}

async function replaceChunks(
  admin: AdminClient,
  sourceId: string,
  chunks: Array<Record<string, unknown>>,
): Promise<number> {
  const db = facodi(admin);
  const deleteResult = await db.from("knowledge_chunks").delete().eq("source_id", sourceId);
  if (deleteResult.error) {
    throw new HttpError(500, "supabase_error", deleteResult.error.message);
  }

  if (chunks.length === 0) {
    return 0;
  }

  const insertResult = await db.from("knowledge_chunks").insert(chunks);
  if (insertResult.error) {
    throw new HttpError(500, "supabase_error", insertResult.error.message);
  }
  return chunks.length;
}

async function writeKnowledgeChunks(
  admin: AdminClient,
  source: {
    entity_type: "course" | "curricular_unit";
    course_id: string;
    curricular_unit_id?: string | null;
    source_type: "odoo_channel" | "odoo_slide";
    source_url?: string | null;
    title: string;
  },
  text: string,
): Promise<number> {
  const content = normalizeWhitespace(text);
  if (content.length < 40) {
    return 0;
  }

  const contentHash = await sha256Hex(content);
  const sourceId = await upsertKnowledgeSource(admin, {
    entity_type: source.entity_type,
    course_id: source.course_id,
    curricular_unit_id: source.curricular_unit_id ?? null,
    source_type: source.source_type,
    source_url: source.source_url ?? null,
    title: source.title,
    content_hash: contentHash,
    metadata: { generated_by: "facodi_v2_sync" },
  });

  const rows = splitText(content).map((chunk, index) => ({
    source_id: sourceId,
    entity_type: source.entity_type,
    course_id: source.course_id,
    curricular_unit_id: source.curricular_unit_id ?? null,
    chunk_type: index === 0 ? "summary" : "body",
    chunk_index: index,
    content_text: chunk,
    content_tokens: estimateTokens(chunk),
    metadata: { content_hash: contentHash },
  }));

  return await replaceChunks(admin, sourceId, rows);
}

async function ensureTerm(
  admin: AdminClient,
  taxonomyCode: string,
  name: string,
  language = "pt",
): Promise<string | null> {
  const normalizedName = normalizeForSearch(name);
  if (!normalizedName) {
    return null;
  }
  const db = facodi(admin);
  const taxonomy = unwrapMaybe<{ id: string }>(
    await db.from("taxonomies").select("id").eq("code", taxonomyCode).maybeSingle(),
  );
  if (!taxonomy) {
    return null;
  }

  const existing = unwrapMaybe<{ id: string }>(
    await db
      .from("terms")
      .select("id")
      .eq("taxonomy_id", taxonomy.id)
      .eq("normalized_name", normalizedName)
      .eq("language", language)
      .maybeSingle(),
  );
  if (existing) {
    return existing.id;
  }

  const inserted = unwrap<{ id: string }>(
    await db
      .from("terms")
      .insert({
        taxonomy_id: taxonomy.id,
        name,
        normalized_name: normalizedName,
        language,
      } as Record<string, unknown>)
      .select("id")
      .single(),
  );
  return inserted.id;
}

async function attachCourseTerm(
  admin: AdminClient,
  courseId: string,
  taxonomyCode: string,
  name: string,
) {
  const termId = await ensureTerm(admin, taxonomyCode, name);
  if (!termId) {
    return;
  }
  const result = await facodi(admin)
    .from("course_terms")
    .upsert(
      { course_id: courseId, term_id: termId, source: "odoo", confidence: 1 },
      { onConflict: "course_id,term_id" },
    );
  if (result.error) {
    throw new HttpError(500, "supabase_error", result.error.message);
  }
}

async function attachUnitTerm(
  admin: AdminClient,
  unitId: string,
  taxonomyCode: string,
  name: string,
  confidence = 0.75,
) {
  const termId = await ensureTerm(admin, taxonomyCode, name);
  if (!termId) {
    return;
  }
  const result = await facodi(admin)
    .from("curricular_unit_terms")
    .upsert(
      { curricular_unit_id: unitId, term_id: termId, source: "extracted", confidence },
      { onConflict: "curricular_unit_id,term_id" },
    );
  if (result.error) {
    throw new HttpError(500, "supabase_error", result.error.message);
  }
}

export async function syncCoursePayload(
  admin: AdminClient,
  payload: CourseSyncPayload,
): Promise<CourseSyncResult> {
  const externalSource = normalizeWhitespace(payload.external_source ?? "odoo") || "odoo";
  const externalId = getExternalId(payload);
  const title = normalizeWhitespace(payload.title ?? payload.name);
  if (!title) {
    throw new HttpError(400, "missing_title", "Course payload is missing title/name.");
  }

  const tags = uniqueStrings([...(payload.tag_names ?? []), ...(payload.tags ?? [])]);
  const descriptionHtml = payload.description_html ?? payload.description ?? null;
  const summary = normalizeWhitespace(
    payload.summary ?? payload.description_short ?? firstSubstantialParagraph(descriptionHtml),
  );
  const slug = slugify(
    payload.slug ?? `${externalSource}-${externalId}-${title}`,
    `course-${externalId}`,
  );
  const degreeType = normalizeWhitespace(payload.degree_type) || inferDegreeType(title, tags);
  const language = normalizeWhitespace(payload.language ?? "pt") || "pt";
  const published = Boolean(
    payload.published ?? payload.is_published ?? payload.website_published ?? true,
  );

  const courseRow = {
    external_source: externalSource,
    external_id: externalId,
    odoo_channel_id: toInteger(payload.odoo_channel_id ?? payload.odoo_id),
    slug,
    title,
    normalized_title: normalizeForSearch(title),
    summary: summary || null,
    description_html: descriptionHtml,
    degree_type: degreeType || null,
    language,
    school: normalizeWhitespace(payload.school) || null,
    source_url: normalizeWhitespace(payload.source_url) || null,
    plan_url: normalizeWhitespace(payload.plan_url) || null,
    status: published ? "active" : "draft",
    published,
    metadata: {
      ...(payload.metadata ?? {}),
      tag_names: tags,
      synced_by: "facodi_backend_v2",
    },
    synced_at: new Date().toISOString(),
  };

  const db = facodi(admin);
  const course = unwrap<{ id: string; slug: string }>(
    await db
      .from("courses")
      .upsert(courseRow, { onConflict: "external_source,external_id" })
      .select("id, slug")
      .single(),
  );

  if (degreeType) {
    await attachCourseTerm(admin, course.id, "course_type", degreeType);
  }
  await attachCourseTerm(admin, course.id, "language", language === "pt" ? "Portugues" : language);

  let chunks = await writeKnowledgeChunks(
    admin,
    {
      entity_type: "course",
      course_id: course.id,
      source_type: "odoo_channel",
      source_url: courseRow.source_url,
      title,
    },
    [title, summary, stripHtml(descriptionHtml)].filter(Boolean).join("\n\n"),
  );

  let units = 0;
  for (const unitPayload of payload.units ?? []) {
    const unitExternalSource = normalizeWhitespace(unitPayload.external_source ?? externalSource) ||
      externalSource;
    const unitExternalId = getExternalId(unitPayload);
    const code = normalizeWhitespace(unitPayload.code) || null;
    const unitTitle = normalizeWhitespace(unitPayload.title ?? unitPayload.name);
    if (!unitTitle) {
      continue;
    }
    const pdfUrl = normalizeWhitespace(unitPayload.official_pdf_url) ||
      (unitPayload.resource_links ?? []).find((link) => /academico\.ualg\.pt|\.pdf/i.test(link)) ||
      null;
    const unitSummary = normalizeWhitespace(
      unitPayload.summary ??
        firstSubstantialParagraph(unitPayload.description_html, unitPayload.description),
    );
    const unitDescription = unitPayload.description_html ?? unitPayload.description ?? null;
    const unitSlug = slugify(
      unitPayload.slug ?? `${course.slug}-${unitExternalId}-${code ?? unitTitle}`,
      `unit-${unitExternalId}`,
    );

    const unit = unwrap<{ id: string }>(
      await db
        .from("curricular_units")
        .upsert(
          {
            course_id: course.id,
            external_source: unitExternalSource,
            external_id: unitExternalId,
            odoo_slide_id: toInteger(unitPayload.odoo_slide_id),
            code,
            slug: unitSlug,
            title: unitTitle,
            normalized_title: normalizeForSearch(`${code ?? ""} ${unitTitle}`),
            summary: unitSummary || null,
            description_html: unitDescription,
            curricular_year: toInteger(unitPayload.curricular_year ?? unitPayload.year),
            semester: toInteger(unitPayload.semester),
            ects: toNumber(unitPayload.ects),
            language: normalizeWhitespace(unitPayload.language ?? language) || language,
            official_pdf_url: pdfUrl,
            status: "active",
            metadata: {
              ...(unitPayload.metadata ?? {}),
              synced_by: "facodi_backend_v2",
            },
            synced_at: new Date().toISOString(),
          },
          { onConflict: "course_id,external_source,external_id" },
        )
        .select("id")
        .single(),
    );

    units += 1;
    if (code) {
      await attachUnitTerm(admin, unit.id, "topic", code, 0.6);
    }
    chunks += await writeKnowledgeChunks(
      admin,
      {
        entity_type: "curricular_unit",
        course_id: course.id,
        curricular_unit_id: unit.id,
        source_type: "odoo_slide",
        source_url: pdfUrl,
        title: `${code ? `${code} - ` : ""}${unitTitle}`,
      },
      [code, unitTitle, unitSummary, stripHtml(unitDescription)].filter(Boolean).join("\n\n"),
    );
  }

  return {
    course_id: course.id,
    external_id: externalId,
    slug: course.slug,
    units_created_or_updated: units,
    knowledge_chunks_written: chunks,
  };
}

export async function syncCatalogPayload(
  admin: AdminClient,
  payload: { courses?: CourseSyncPayload[] } | CourseSyncPayload[],
) {
  const courses = Array.isArray(payload) ? payload : payload.courses ?? [];
  if (courses.length === 0) {
    throw new HttpError(400, "empty_catalog", "Payload must include a non-empty courses array.");
  }

  const results: CourseSyncResult[] = [];
  const errors: Array<{ external_id: string | null; message: string }> = [];
  for (const course of courses) {
    try {
      results.push(await syncCoursePayload(admin, course));
    } catch (error) {
      errors.push({
        external_id: (() => {
          try {
            return getExternalId(course);
          } catch (_error) {
            return null;
          }
        })(),
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return {
    courses_received: courses.length,
    courses_synced: results.length,
    errors,
    results,
  };
}
