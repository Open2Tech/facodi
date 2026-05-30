"""Deterministic playlist assignment ported from the production Edge Function."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import re
from typing import Any

from .analysis import VideoAnalysis, normalize_confidence, normalize_text

SUBJECT_SIGNALS = (
    "math",
    "design",
    "programming",
    "database",
    "business",
    "language",
    "science",
    "humanities",
)

SUBJECT_KEYWORDS: dict[str, tuple[str, ...]] = {
    "math": (
        "matematica",
        "calculo",
        "analise",
        "integral",
        "derivada",
        "limite",
        "equacao",
        "logaritmo",
        "trigonometria",
        "algebra",
        "matriz",
        "vetor",
        "probabilidade",
        "estatistica",
    ),
    "design": (
        "design",
        "comunicacao",
        "grafico",
        "grafica",
        "visual",
        "tipografia",
        "ilustracao",
        "multimedia",
        "interacao",
        "marketing",
        "caligrafia",
    ),
    "programming": (
        "programacao",
        "programming",
        "javascript",
        "typescript",
        "python",
        "java",
        "react",
        "node",
        "codigo",
        "algoritmo",
        "software",
        "linux",
        "ciberseguranca",
    ),
    "database": (
        "sql",
        "sql server",
        "t-sql",
        "database",
        "banco de dados",
        "base de dados",
        "tabela",
        "consulta",
        "query",
        "procedure",
        "trigger",
        "view",
    ),
    "business": ("negocio", "business", "empreendedorismo", "gestao", "vendas", "financeiro"),
    "language": ("ingles", "portugues", "espanhol", "frances", "lingua", "idioma", "grammar"),
    "science": ("fisica", "quimica", "biologia", "ciencia", "laboratorio", "energia"),
    "humanities": ("historia", "filosofia", "sociologia", "literatura", "cultura", "arte"),
}

PLAYLIST_ASSIGNMENT_ALGORITHM_VERSION = "playlist-assignment-v5-openai-enrichment-python"
MIN_PLAYLIST_ASSIGNMENT_CONFIDENCE = 0.65
MIN_PLAYLIST_ASSIGNMENT_SCORE = 7
MIN_DETERMINISTIC_PLAYLIST_SCORE = 12


@dataclass(frozen=True)
class PlaylistCandidate:
    id: str
    name: str
    description: str | None = None
    language: str = "pt"
    is_public: bool = True
    is_ordered: bool = True
    course_code: str | None = None
    unit_code: str | None = None

    @classmethod
    def from_dict(cls, row: dict[str, Any]) -> "PlaylistCandidate":
        return cls(
            id=str(row.get("id") or ""),
            name=str(row.get("name") or ""),
            description=row.get("description") if isinstance(row.get("description"), str) else None,
            language=str(row.get("language") or "pt"),
            is_public=bool(row.get("is_public", True)),
            is_ordered=bool(row.get("is_ordered", True)),
            course_code=row.get("course_code") if isinstance(row.get("course_code"), str) else None,
            unit_code=row.get("unit_code") if isinstance(row.get("unit_code"), str) else None,
        )


@dataclass(frozen=True)
class PlaylistAssignment:
    algorithm_version: str
    assigned_playlist_id: str | None
    score: float
    reliability: str
    reason: str
    top_candidates: list[dict[str, Any]]
    rejected_playlist_id: str | None
    provider_confidence: float | None
    decision_source: str
    signals: dict[str, int]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def tokenize(value: str | None) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", normalize_text(value)) if len(token) > 2]


def token_overlap_score(left: str | None, right: str | None) -> int:
    left_tokens = set(tokenize(left))
    if not left_tokens:
        return 0
    return sum(1 for token in tokenize(right) if token in left_tokens)


def subject_signal_score(text: str, subject: str) -> int:
    normalized = normalize_text(text)
    return sum(1 for keyword in SUBJECT_KEYWORDS[subject] if keyword in normalized)


def get_subject_signals(source_text: str) -> dict[str, int]:
    return {subject: subject_signal_score(source_text, subject) for subject in SUBJECT_SIGNALS}


def playlist_text(playlist: PlaylistCandidate) -> str:
    return " ".join(
        [
            playlist.name,
            playlist.description or "",
            playlist.course_code or "",
            playlist.unit_code or "",
        ]
    )


def analysis_text(analysis: VideoAnalysis, title: str | None = None, description: str | None = None) -> str:
    return " ".join(
        [
            title or "",
            description or "",
            analysis.suggested_playlist_query or "",
            " ".join(analysis.semantic_tags),
            analysis.summary_description,
            analysis.short_summary,
        ]
    )


def playlist_subject_score(playlist: PlaylistCandidate, subject: str) -> int:
    return subject_signal_score(playlist_text(playlist), subject)


def is_general_education_playlist(playlist: PlaylistCandidate) -> bool:
    text = normalize_text(f"{playlist.name} {playlist.description or ''}")
    return not playlist.course_code and not playlist.unit_code and (
        "educacao" in text or "education" in text
    )


def is_database_playlist(playlist: PlaylistCandidate) -> bool:
    text = normalize_text(playlist_text(playlist))
    return "base de dados" in text or "sql" in text or "database" in text


def is_calculus_one_playlist(playlist: PlaylistCandidate) -> bool:
    text = normalize_text(playlist_text(playlist))
    return "analise matematica i" in text or "calculo i" in text or "calculo 1" in text


def has_calculus_one_signals(source_text: str) -> bool:
    text = normalize_text(source_text)
    return any(
        marker in text
        for marker in (
            "calculo 1",
            "calculo i",
            "derivada",
            "equacao",
            "logaritm",
            "trigonometr",
            "limite",
            "funcoes",
            "funcao",
        )
    )


def has_strong_subject_conflict(playlist: PlaylistCandidate, signals: dict[str, int]) -> bool:
    strongest = max(signals.items(), key=lambda item: item[1], default=(None, 0))
    if not strongest[0] or strongest[1] < 2:
        return False
    return playlist_subject_score(playlist, strongest[0]) == 0


def score_playlist(
    playlist: PlaylistCandidate,
    analysis: VideoAnalysis,
    source_text: str,
    signals: dict[str, int],
) -> float:
    text = playlist_text(playlist)
    score = 0.0
    score += min(7, token_overlap_score(source_text, text))
    score += min(5, token_overlap_score(" ".join(analysis.semantic_tags), text))
    score += min(6, token_overlap_score(analysis.suggested_playlist_query, text))

    for subject, signal_score in signals.items():
        if signal_score > 0:
            score += min(12, signal_score * playlist_subject_score(playlist, subject) * 2)

    if signals["database"] >= 2:
        if is_database_playlist(playlist):
            score += 8
        elif "algoritmos" in normalize_text(text):
            score -= 4

    if analysis.suggested_playlist_id == playlist.id:
        score += 4
    if normalize_text(playlist.language) == normalize_text(analysis.language):
        score += 1
    if playlist.course_code or playlist.unit_code:
        score += 1
    if is_general_education_playlist(playlist):
        score -= 6

    return score


def assign_playlist(
    playlists: list[dict[str, Any]] | list[PlaylistCandidate],
    analysis: VideoAnalysis,
    *,
    title: str | None = None,
    description: str | None = None,
    top_candidate_limit: int = 5,
) -> PlaylistAssignment:
    candidates = [
        item if isinstance(item, PlaylistCandidate) else PlaylistCandidate.from_dict(item)
        for item in playlists
    ]
    candidates = [candidate for candidate in candidates if candidate.id and candidate.name]
    source_text = analysis_text(analysis, title, description)
    signals = get_subject_signals(source_text)
    provider_confidence = normalize_confidence(analysis.classification_confidence)

    scored = []
    for playlist in candidates:
        score = score_playlist(playlist, analysis, source_text, signals)
        compatible = score >= MIN_PLAYLIST_ASSIGNMENT_SCORE and not has_strong_subject_conflict(
            playlist, signals
        )
        scored.append(
            {
                "playlistId": playlist.id,
                "name": playlist.name,
                "score": score,
                "compatible": compatible,
                "isAiSuggested": playlist.id == analysis.suggested_playlist_id,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)
    top_candidates = scored[:top_candidate_limit]
    suggested = next(
        (item for item in scored if item["playlistId"] == analysis.suggested_playlist_id),
        None,
    )

    assigned_playlist_id: str | None = None
    rejected_playlist_id: str | None = None
    score = 0.0
    reason = "No playlist met the direct content adherence threshold."
    decision_source = "none"

    if suggested:
        if provider_confidence < MIN_PLAYLIST_ASSIGNMENT_CONFIDENCE:
            rejected_playlist_id = str(suggested["playlistId"])
            reason = "OpenAI playlist suggestion rejected because classification confidence is below threshold."
        elif not suggested["compatible"]:
            rejected_playlist_id = str(suggested["playlistId"])
            reason = "OpenAI playlist suggestion rejected by deterministic adherence checks."
        else:
            assigned_playlist_id = str(suggested["playlistId"])
            score = float(suggested["score"])
            reason = f"OpenAI suggested \"{suggested['name']}\" and deterministic adherence checks confirmed the match."
            decision_source = "openai"

    best = scored[0] if scored else None
    runner_up = scored[1] if len(scored) > 1 else None
    if not assigned_playlist_id and not suggested and best and best["compatible"]:
        best_playlist = next((playlist for playlist in candidates if playlist.id == best["playlistId"]), None)
        margin = float(best["score"]) - float(runner_up["score"] if runner_up else 0)
        strong_database_match = (
            signals["database"] >= 2
            and best_playlist is not None
            and is_database_playlist(best_playlist)
            and float(best["score"]) >= MIN_DETERMINISTIC_PLAYLIST_SCORE
        )
        calculus_candidate = next(
            (
                item
                for item in scored
                if any(
                    playlist.id == item["playlistId"] and is_calculus_one_playlist(playlist)
                    for playlist in candidates
                )
            ),
            None,
        )
        strong_calculus_match = (
            signals["math"] >= 1
            and has_calculus_one_signals(source_text)
            and calculus_candidate is not None
            and float(calculus_candidate["score"]) >= 6
        )

        if strong_calculus_match and calculus_candidate:
            assigned_playlist_id = str(calculus_candidate["playlistId"])
            score = float(calculus_candidate["score"])
            reason = "Deterministic scoring selected Analise Matematica I for Calculo 1 signals."
            decision_source = "deterministic"
        elif strong_database_match or (
            float(best["score"]) >= MIN_DETERMINISTIC_PLAYLIST_SCORE and margin >= 4
        ):
            assigned_playlist_id = str(best["playlistId"])
            score = float(best["score"])
            reason = (
                "Deterministic scoring selected a strong database playlist match."
                if strong_database_match
                else "Deterministic scoring selected a strong curricular playlist match."
            )
            decision_source = "deterministic"

    return PlaylistAssignment(
        algorithm_version=PLAYLIST_ASSIGNMENT_ALGORITHM_VERSION,
        assigned_playlist_id=assigned_playlist_id,
        score=score,
        reliability="high" if assigned_playlist_id else "low",
        reason=reason,
        top_candidates=top_candidates,
        rejected_playlist_id=rejected_playlist_id,
        provider_confidence=provider_confidence,
        decision_source=decision_source,
        signals=signals,
    )
