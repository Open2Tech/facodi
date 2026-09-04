import json
import socket

try:
    from .url_safety import validate_outbound_url, redact_url
except ImportError:  # Loaded directly by dependency-free unit tests.
    from url_safety import validate_outbound_url, redact_url


class AIContractError(ValueError):
    """Raised when an AI response does not satisfy the FACODI contract."""


class AITransportError(ValueError):
    """Raised when the configured AI endpoint cannot be used safely."""


def _normalise_item(value, path, assertion_type):
    if not isinstance(value, dict):
        raise AIContractError(f"{path}: expected an object")
    text = str(value.get("value") or "").strip()
    if not text:
        raise AIContractError(f"{path}.value: expected non-empty text")
    try:
        confidence = float(value.get("confidence"))
    except (TypeError, ValueError) as error:
        raise AIContractError(f"{path}.confidence: expected a number") from error
    if confidence < 0 or confidence > 1:
        raise AIContractError(f"{path}.confidence: expected a number between 0 and 1")
    justification = str(value.get("justification") or "").strip()
    if not justification:
        raise AIContractError(f"{path}.justification: expected non-empty text")
    return {
        "assertion_type": assertion_type,
        "value_text": text,
        "confidence": confidence,
        "justification": justification,
        "evidence_json": value.get("evidence") or {},
    }


def normalise_ai_document(document):
    if not isinstance(document, dict):
        raise AIContractError("root: expected an object")
    assertions = []
    for field_name, assertion_type in (
        ("summary", "summary"),
        ("difficulty", "difficulty"),
    ):
        if document.get(field_name) is not None:
            assertions.append(
                _normalise_item(document[field_name], field_name, assertion_type)
            )
    for field_name, assertion_type in (
        ("concepts", "concept"),
        ("learning_outcomes", "learning_outcome"),
        ("competencies", "competency"),
        ("prerequisites", "prerequisite"),
    ):
        values = document.get(field_name) or []
        if not isinstance(values, list):
            raise AIContractError(f"{field_name}: expected a list")
        assertions.extend(
            _normalise_item(item, f"{field_name}[{index}]", assertion_type)
            for index, item in enumerate(values)
        )
    if not assertions:
        raise AIContractError("root: no supported inference was returned")
    return assertions


class OpenAICompatibleClient:
    """Bounded client for an OpenAI-compatible JSON chat endpoint."""

    def __init__(
        self,
        *,
        session=None,
        resolver=socket.getaddrinfo,
        timeout=30,
        max_bytes=2 * 1024 * 1024,
    ):
        if session is None:
            import requests

            session = requests.Session()
        self.session = session
        self.resolver = resolver
        self.timeout = timeout
        self.max_bytes = max_bytes

    def analyse(
        self,
        *,
        endpoint,
        api_key,
        model,
        system_prompt,
        input_payload,
    ):
        safe_endpoint = validate_outbound_url(endpoint, resolver=self.resolver)
        response = self.session.post(
            safe_endpoint,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": json.dumps(input_payload, ensure_ascii=False),
                    },
                ],
            },
            timeout=self.timeout,
            allow_redirects=False,
            stream=True,
        )
        try:
            response_url = validate_outbound_url(
                response.url or safe_endpoint,
                resolver=self.resolver,
            )
            if 300 <= response.status_code < 400:
                raise AITransportError("AI endpoint redirects are not allowed")
            if not 200 <= response.status_code < 300:
                raise AITransportError(
                    f"AI endpoint {redact_url(response_url)} returned HTTP {response.status_code}"
                )
            content_length = response.headers.get("Content-Length")
            if content_length:
                try:
                    if int(content_length) > self.max_bytes:
                        raise AITransportError("AI response exceeds the size limit")
                except ValueError:
                    pass
            chunks = []
            received = 0
            for chunk in response.iter_content(chunk_size=min(64 * 1024, self.max_bytes + 1)):
                if not chunk:
                    continue
                received += len(chunk)
                if received > self.max_bytes:
                    raise AITransportError("AI response exceeds the size limit")
                chunks.append(chunk)
            try:
                outer = json.loads(b"".join(chunks).decode("utf-8"))
                message = outer["choices"][0]["message"]["content"]
                document = json.loads(message) if isinstance(message, str) else message
            except (IndexError, KeyError, TypeError, UnicodeDecodeError, ValueError) as error:
                raise AIContractError("root: invalid OpenAI-compatible response") from error
            normalise_ai_document(document)
            return {
                "document": document,
                "raw_result": outer,
                "provider_model": str(outer.get("model") or model),
            }
        finally:
            response.close()
