"""AI analysis parsing and deterministic fallback analysis."""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import asdict, dataclass
from typing import Any


DIFFICULTY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "expert": ("especialista", "expert", "mastery", "dominio", "investigacao", "pesquisa"),
    "advanced": ("avancado", "advanced", "complexo", "otimizacao", "producao", "performance"),
    "intermediate": ("intermedio", "intermediate", "medio", "tecnicas", "pratica", "workflow"),
    "foundational": (
        "intro",
        "iniciacao",
        "basico",
        "fundamental",
        "primeiros passos",
        "para iniciantes",
        "introducao",
    ),
}

TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "design": ("design", "visual", "grafico", "interface", "ux", "ui", "branding"),
    "drawing": ("desenho", "drawing", "sketch", "illustration", "arte", "composicao"),
    "photography": ("fotografia", "photography", "light", "camera", "imagem"),
    "video": ("video", "cinema", "producao", "filmagem", "edicao", "motion"),
    "audio": ("audio", "som", "music", "podcast", "voz", "sound design"),
    "web": ("web", "html", "css", "javascript", "site", "wordpress"),
    "marketing": ("marketing", "social media", "seo", "publicidade", "campanha"),
    "business": ("negocio", "empreendedorismo", "business", "startup", "gestao", "vendas"),
    "math": (
        "matematica",
        "calculo",
        "integral",
        "derivada",
        "limite",
        "algebra",
        "estatistica",
    ),
    "database": ("sql", "database", "base de dados", "banco de dados", "query", "tabela"),
}


@dataclass(frozen=True)
class VideoAnalysis:
    optimized_title: str
    summary_description: str
    semantic_tags: list[str]
    suggested_category_id: str | None
    suggested_category: str | None
    suggested_playlist_id: str | None
    suggested_playlist_query: str | None
    classification_confidence: float
    language: str
    cultural_relevance: str
    short_summary: str
    difficulty: str
    topic: str
    pedagogical_score: float

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def normalize_text(value: str | None) -> str:
    normalized = unicodedata.normalize("NFD", value or "")
    normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return normalized.lower().strip()


def normalize_confidence(value: Any, default: float = 0.5) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    return min(1.0, max(0.0, parsed))


def parse_string_array(value: Any, *, limit: int = 8) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        cleaned = " ".join(item.split())[:80]
        if cleaned and cleaned not in result:
            result.append(cleaned)
        if len(result) >= limit:
            break
    return result


def parse_uuid(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    if re.match(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", trimmed, re.I):
        return trimmed
    return None


def infer_difficulty(text: str) -> str:
    normalized = normalize_text(text)
    for level, keywords in DIFFICULTY_KEYWORDS.items():
        if any(keyword in normalized for keyword in keywords):
            return level
    return "intermediate"


def infer_topic(text: str) -> str:
    normalized = normalize_text(text)
    best_topic = "conteudo"
    best_count = 0
    for topic, keywords in TOPIC_KEYWORDS.items():
        count = sum(1 for keyword in keywords if keyword in normalized)
        if count > best_count:
            best_topic = topic
            best_count = count
    if best_count:
        return best_topic
    words = [word for word in re.split(r"[^a-z0-9]+", normalized) if len(word) > 3]
    return words[0] if words else "conteudo"


def normalize_relevance(value: Any) -> str:
    text = normalize_text(str(value or ""))
    if "high" in text or "alta" in text:
        return "High"
    if "low" in text or "baixa" in text:
        return "Low"
    return "Medium"


def _extract_json_object(content: str) -> dict[str, Any]:
    stripped = content.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        return json.loads(stripped)
    match = re.search(r"\{[\s\S]*\}", stripped)
    if not match:
        raise ValueError("No JSON object found in AI response")
    return json.loads(match.group(0))


def parse_ai_analysis(content: str, *, fallback_language: str = "pt") -> VideoAnalysis:
    parsed = _extract_json_object(content)
    tags = parse_string_array(parsed.get("semantic_tags"))
    confidence = normalize_confidence(parsed.get("classification_confidence"))
    optimized_title = str(parsed.get("optimized_title") or "").strip()[:100]
    summary = str(parsed.get("summary_description") or "").strip()[:500]
    short_summary = str(parsed.get("short_summary") or summary or optimized_title).strip()[:240]
    topic = str(parsed.get("suggested_category") or "").strip() or infer_topic(
        " ".join([optimized_title, summary, " ".join(tags)])
    )

    return VideoAnalysis(
        optimized_title=optimized_title,
        summary_description=summary,
        semantic_tags=tags,
        suggested_category_id=parse_uuid(parsed.get("suggested_category_id")),
        suggested_category=topic,
        suggested_playlist_id=parse_uuid(parsed.get("suggested_playlist_id")),
        suggested_playlist_query=(
            str(parsed.get("suggested_playlist_query")).strip()[:120]
            if parsed.get("suggested_playlist_query")
            else None
        ),
        classification_confidence=confidence,
        language=str(parsed.get("language") or fallback_language or "pt").strip()[:12],
        cultural_relevance=normalize_relevance(parsed.get("cultural_relevance")),
        short_summary=short_summary,
        difficulty=infer_difficulty(" ".join([optimized_title, summary, " ".join(tags)])),
        topic=topic,
        pedagogical_score=confidence,
    )


def build_fallback_analysis(
    *,
    title: str,
    description: str | None = None,
    language: str = "pt",
) -> VideoAnalysis:
    source = f"{title}. {description or ''}".strip()
    topic = infer_topic(source)
    difficulty = infer_difficulty(source)
    tags = ["facodi", "youtube", topic]
    summary = source[:250] or "Video do YouTube para curadoria educacional."

    return VideoAnalysis(
        optimized_title=title[:100] or "Video educativo",
        summary_description=summary,
        semantic_tags=tags,
        suggested_category_id=None,
        suggested_category=topic,
        suggested_playlist_id=None,
        suggested_playlist_query=topic,
        classification_confidence=0.45,
        language=language,
        cultural_relevance="Medium",
        short_summary=summary[:180],
        difficulty=difficulty,
        topic=topic,
        pedagogical_score=0.45,
    )
