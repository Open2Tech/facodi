"""Deterministic matching primitives used by the Odoo domain layer.

The scorer deliberately has no Odoo dependency so its behaviour can be tested
quickly and reproduced outside a running server.  AI may propose additional
matches, but accepted canonical concepts remain the only input to this baseline.
"""

from __future__ import annotations


LEVEL_ORDER = {
    "beginner": 0,
    "intermediate": 1,
    "advanced": 2,
    "expert": 3,
}


def _bounded(value: object, *, default: float = 0.0) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = default
    return max(0.0, min(number, 1.0))


def score_candidate(
    *,
    requirements: list[dict],
    evidence: list[dict],
    resource_level: str | None = None,
    unit_level: str | None = None,
) -> dict:
    """Score accepted resource evidence against weighted UC requirements.

    Relevance measures how much of the required weight has a matching concept.
    Coverage additionally discounts that overlap by the evidence confidence.
    Confidence is the mean confidence of the matched concepts.  Duplicate
    evidence for a concept is collapsed to its strongest accepted observation.
    """

    weights: dict[int, float] = {}
    for requirement in requirements or []:
        concept_id = int(requirement.get("concept_id") or 0)
        if not concept_id:
            continue
        weights[concept_id] = max(
            weights.get(concept_id, 0.0),
            _bounded(requirement.get("weight"), default=1.0),
        )

    confidences: dict[int, float] = {}
    for item in evidence or []:
        concept_id = int(item.get("concept_id") or 0)
        if concept_id not in weights:
            continue
        confidences[concept_id] = max(
            confidences.get(concept_id, 0.0),
            _bounded(item.get("confidence")),
        )

    total_weight = sum(weights.values())
    matched_ids = sorted(confidences)
    matched_weight = sum(weights[concept_id] for concept_id in matched_ids)
    weighted_confidence = sum(
        weights[concept_id] * confidences[concept_id]
        for concept_id in matched_ids
    )

    if total_weight:
        relevance_score = matched_weight / total_weight
        coverage_score = weighted_confidence / total_weight
    else:
        relevance_score = 0.0
        coverage_score = 0.0
    confidence = (
        sum(confidences.values()) / len(confidences) if confidences else 0.0
    )

    if resource_level in LEVEL_ORDER and unit_level in LEVEL_ORDER:
        distance = abs(LEVEL_ORDER[resource_level] - LEVEL_ORDER[unit_level])
        level_score = max(0.0, 1.0 - (0.25 * distance))
    else:
        level_score = 0.5

    return {
        "matched_count": len(matched_ids),
        "required_count": len(weights),
        "matched_concept_ids": matched_ids,
        "relevance_score": _bounded(relevance_score),
        "coverage_score": _bounded(coverage_score),
        "confidence": _bounded(confidence),
        "level_score": _bounded(level_score),
    }


def classify_coverage(
    score: float,
    *,
    strong_resource_count: int,
    good: float = 0.80,
    partial: float = 0.30,
    redundancy_count: int = 3,
) -> str:
    """Return the stable coverage label for one curricular requirement."""

    bounded_score = _bounded(score)
    if int(strong_resource_count or 0) >= max(1, int(redundancy_count)):
        return "redundant"
    if bounded_score >= _bounded(good, default=0.80):
        return "good"
    if bounded_score >= _bounded(partial, default=0.30):
        return "partial"
    return "gap"
