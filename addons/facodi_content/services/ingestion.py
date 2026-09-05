import hashlib
import json
import re
import socket
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    from .url_safety import fetch_url, redact_url
except ImportError:  # Loaded directly by the dependency-free unit tests.
    from url_safety import fetch_url, redact_url


TRACKING_QUERY_KEYS = {
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
}
YOUTUBE_HOSTS = {
    "youtu.be",
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
}
YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


class IngestionError(ValueError):
    """Raised when a supported source cannot produce a normalised result."""


def canonicalise_source_url(url):
    parsed = urlsplit(str(url or "").strip())
    if parsed.scheme.lower() != "https" or not parsed.hostname:
        raise ValueError("A public HTTPS source URL is required")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("Credentials are not allowed in source URLs")
    host = parsed.hostname.rstrip(".").lower()
    if ":" in host:
        host = f"[{host}]"
    try:
        port = parsed.port
    except ValueError as error:
        raise ValueError("The source URL has an invalid port") from error
    if port and port != 443:
        host = f"{host}:{port}"
    query = urlencode(
        [
            (key, value)
            for key, value in parse_qsl(parsed.query, keep_blank_values=True)
            if not key.lower().startswith("utm_")
            and key.lower() not in TRACKING_QUERY_KEYS
        ],
        doseq=True,
    )
    return urlunsplit(("https", host, parsed.path or "", query, ""))


def youtube_video_id(url):
    parsed = urlsplit(str(url or "").strip())
    host = (parsed.hostname or "").rstrip(".").lower()
    if host not in YOUTUBE_HOSTS:
        raise ValueError("The source URL is not a supported YouTube URL")
    if host == "youtu.be":
        candidate = parsed.path.strip("/").split("/", 1)[0]
    else:
        path_parts = [part for part in parsed.path.split("/") if part]
        if parsed.path.rstrip("/") == "/watch":
            candidate = dict(parse_qsl(parsed.query)).get("v", "")
        elif len(path_parts) >= 2 and path_parts[0] in {"embed", "shorts", "live"}:
            candidate = path_parts[1]
        else:
            candidate = ""
    if not YOUTUBE_ID_RE.match(candidate):
        raise ValueError("The YouTube URL has no valid video identifier")
    return candidate


def _base_result(**values):
    result = {
        "external_key": "",
        "source_url": "",
        "resource_type": "external",
        "name": "Untitled resource",
        "description": "",
        "source_language_code": "",
        "author_name": "",
        "institution_name": "",
        "publication_date": None,
        "duration_minutes": 0.0,
        "mime_type": "",
        "content_text": "",
        "source_version": "",
        "snapshot_payload": {},
    }
    result.update(values)
    return result


def normalise_youtube_oembed(source_url, payload, *, language_code=""):
    video_id = youtube_video_id(source_url)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    facts = dict(payload or {})
    return _base_result(
        external_key=f"youtube:{video_id}",
        source_url=canonical_url,
        resource_type="video",
        name=str(facts.get("title") or "Untitled YouTube video").strip(),
        description=str(facts.get("description") or "").strip(),
        source_language_code=str(language_code or "").strip(),
        author_name=str(facts.get("author_name") or "").strip(),
        institution_name=str(facts.get("provider_name") or "YouTube").strip(),
        mime_type="text/html",
        source_version=str(facts.get("version") or "").strip(),
        snapshot_payload={
            "schema_version": 1,
            "provider": "youtube_oembed",
            "source_url": canonical_url,
            "facts": facts,
        },
    )


class _MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.html_language = ""
        self.meta = {}
        self.title_parts = []
        self.text_parts = []
        self.json_ld_parts = []
        self._in_title = False
        self._in_json_ld = False

    def handle_starttag(self, tag, attrs):
        attributes = {str(key).lower(): value for key, value in attrs}
        lowered = tag.lower()
        if lowered == "html":
            self.html_language = attributes.get("lang") or ""
        elif lowered == "title":
            self._in_title = True
        elif lowered == "meta":
            key = attributes.get("property") or attributes.get("name")
            content = attributes.get("content")
            if key and content is not None:
                self.meta[str(key).lower()] = content
        elif lowered == "script" and (
            attributes.get("type") or ""
        ).lower() == "application/ld+json":
            self._in_json_ld = True

    def handle_endtag(self, tag):
        lowered = tag.lower()
        if lowered == "title":
            self._in_title = False
        elif lowered == "script":
            self._in_json_ld = False

    def handle_data(self, data):
        stripped = data.strip()
        if not stripped:
            return
        if self._in_title:
            self.title_parts.append(stripped)
        elif self._in_json_ld:
            self.json_ld_parts.append(stripped)
        else:
            self.text_parts.append(stripped)


def _json_ld_entities(parts):
    entities = []
    for raw in parts:
        try:
            value = json.loads(raw)
        except (TypeError, ValueError):
            continue
        if isinstance(value, list):
            entities.extend(item for item in value if isinstance(item, dict))
        elif isinstance(value, dict):
            graph = value.get("@graph")
            if isinstance(graph, list):
                entities.extend(item for item in graph if isinstance(item, dict))
            entities.append(value)
    return entities


def _json_ld_author(entity):
    author = entity.get("author")
    if isinstance(author, list):
        author = author[0] if author else None
    if isinstance(author, dict):
        return str(author.get("name") or "").strip()
    return str(author or "").strip()


def normalise_html(source_url, body, *, headers=None):
    headers = dict(headers or {})
    canonical_url = canonicalise_source_url(source_url)
    parser = _MetadataParser()
    parser.feed(bytes(body).decode("utf-8", errors="replace"))
    entities = _json_ld_entities(parser.json_ld_parts)
    entity = next(
        (
            item
            for item in entities
            if str(item.get("@type") or "").lower()
            in {"article", "book", "chapter", "learningresource", "course"}
        ),
        entities[0] if entities else {},
    )
    schema_type = str(entity.get("@type") or "").lower()
    og_type = str(parser.meta.get("og:type") or "").lower()
    type_map = {
        "article": "article",
        "book": "book",
        "chapter": "chapter",
        "course": "course",
        "video.other": "video",
        "video": "video",
    }
    resource_type = type_map.get(og_type) or type_map.get(schema_type) or "article"
    name = (
        parser.meta.get("og:title")
        or entity.get("headline")
        or entity.get("name")
        or " ".join(parser.title_parts)
        or "Untitled web resource"
    )
    description = (
        parser.meta.get("og:description")
        or parser.meta.get("description")
        or entity.get("description")
        or ""
    )
    language = entity.get("inLanguage") or parser.html_language or ""
    publication_date = str(
        entity.get("datePublished") or parser.meta.get("article:published_time") or ""
    )[:10] or None
    body_digest = hashlib.sha256(bytes(body)).hexdigest()
    version = headers.get("ETag") or headers.get("etag") or headers.get(
        "Last-Modified"
    ) or headers.get("last-modified") or body_digest
    content_text = " ".join(parser.text_parts)
    return _base_result(
        external_key="url:" + hashlib.sha256(canonical_url.encode()).hexdigest(),
        source_url=canonical_url,
        resource_type=resource_type,
        name=str(name).strip(),
        description=str(description).strip(),
        source_language_code=str(language).strip(),
        author_name=_json_ld_author(entity),
        institution_name=str(parser.meta.get("og:site_name") or "").strip(),
        publication_date=publication_date,
        mime_type=str(
            headers.get("Content-Type") or headers.get("content-type") or "text/html"
        ).split(";", 1)[0].strip(),
        content_text=content_text,
        source_version=str(version),
        snapshot_payload={
            "schema_version": 1,
            "provider": "website",
            "source_url": canonical_url,
            "sha256": body_digest,
            "headers": {
                key: value
                for key, value in headers.items()
                if key.lower() in {"content-type", "etag", "last-modified"}
            },
            "metadata": {
                "title": str(name).strip(),
                "description": str(description).strip(),
                "json_ld": entities,
            },
        },
    )


def normalise_youtube_listing_page(payload):
    results = []
    for item in (payload or {}).get("items") or []:
        snippet = item.get("snippet") or {}
        resource_id = snippet.get("resourceId") or {}
        content_details = item.get("contentDetails") or {}
        video_id = resource_id.get("videoId") or content_details.get("videoId")
        if not video_id or not YOUTUBE_ID_RE.match(str(video_id)):
            continue
        canonical_url = f"https://www.youtube.com/watch?v={video_id}"
        results.append(
            _base_result(
                external_key=f"youtube:{video_id}",
                source_url=canonical_url,
                resource_type="video",
                name=str(snippet.get("title") or "Untitled YouTube video").strip(),
                description=str(snippet.get("description") or "").strip(),
                institution_name=str(snippet.get("channelTitle") or "YouTube").strip(),
                publication_date=str(snippet.get("publishedAt") or "")[:10] or None,
                mime_type="text/html",
                snapshot_payload={
                    "schema_version": 1,
                    "provider": "youtube_data_api",
                    "source_url": canonical_url,
                    "facts": item,
                },
            )
        )
    return results, (payload or {}).get("nextPageToken") or ""


def normalise_pdf(filename, payload, *, source_url="", reader_factory):
    raw = bytes(payload)
    digest = hashlib.sha256(raw).hexdigest()
    reader = reader_factory(BytesIO(raw))
    page_text = []
    for page in reader.pages:
        text = str(page.extract_text() or "").strip()
        if text:
            page_text.append(text)
    canonical_url = canonicalise_source_url(source_url) if source_url else ""
    return _base_result(
        external_key=(
            "url:" + hashlib.sha256(canonical_url.encode()).hexdigest()
            if canonical_url
            else f"sha256:{digest}"
        ),
        source_url=canonical_url,
        resource_type="document",
        name=Path(str(filename or "document.pdf")).stem,
        mime_type="application/pdf",
        content_text="\n\n".join(page_text),
        source_version=digest,
        snapshot_payload={
            "schema_version": 1,
            "provider": "uploaded_pdf" if not canonical_url else "remote_pdf",
            "source_url": canonical_url,
            "sha256": digest,
            "byte_size": len(raw),
            "page_count": len(reader.pages),
        },
    )


class IngestionClient:
    """Network boundary for source adapters; it never writes Odoo records."""

    def __init__(
        self,
        *,
        session=None,
        resolver=socket.getaddrinfo,
        timeout=20,
        max_bytes=10 * 1024 * 1024,
        pdf_reader_factory=None,
    ):
        if session is None:
            import requests

            session = requests.Session()
        self.session = session
        self.resolver = resolver
        self.timeout = timeout
        self.max_bytes = max_bytes
        self.pdf_reader_factory = pdf_reader_factory

    def _fetch(self, url, *, request_headers=None, accepted_statuses=None):
        fetched = fetch_url(
            url,
            session=self.session,
            resolver=self.resolver,
            timeout=self.timeout,
            max_bytes=self.max_bytes,
            headers=request_headers,
        )
        accepted_statuses = set(accepted_statuses or ())
        if not 200 <= fetched.status_code < 300 and fetched.status_code not in accepted_statuses:
            raise IngestionError(
                f"Source {redact_url(fetched.url)} returned HTTP {fetched.status_code}"
            )
        return fetched

    @staticmethod
    def _json_object(fetched):
        try:
            payload = json.loads(fetched.body.decode("utf-8"))
        except (UnicodeDecodeError, ValueError) as error:
            raise IngestionError("The source returned invalid JSON") from error
        if not isinstance(payload, dict):
            raise IngestionError("The source JSON root must be an object")
        return payload

    def ingest_url(self, source_url, *, language_code=""):
        try:
            video_id = youtube_video_id(source_url)
        except ValueError:
            video_id = ""
        if video_id:
            canonical_url = f"https://www.youtube.com/watch?v={video_id}"
            endpoint = "https://www.youtube.com/oembed?" + urlencode(
                [("url", canonical_url), ("format", "json")]
            )
            fetched = self._fetch(endpoint)
            return normalise_youtube_oembed(
                canonical_url,
                self._json_object(fetched),
                language_code=language_code,
            )

        canonical_url = canonicalise_source_url(source_url)
        fetched = self._fetch(canonical_url)
        content_type = (fetched.content_type or "").split(";", 1)[0].lower()
        if content_type == "application/pdf" or fetched.body.startswith(b"%PDF"):
            reader_factory = self.pdf_reader_factory
            if reader_factory is None:
                from odoo.tools.pdf import PdfFileReader

                reader_factory = PdfFileReader
            return normalise_pdf(
                Path(urlsplit(fetched.url).path).name or "document.pdf",
                fetched.body,
                source_url=fetched.url,
                reader_factory=reader_factory,
            )
        if content_type in {"text/html", "application/xhtml+xml"}:
            return normalise_html(
                fetched.url,
                fetched.body,
                headers=fetched.headers,
            )
        raise IngestionError(
            f"Source {redact_url(fetched.url)} has unsupported content type"
        )

    def refresh_url(
        self,
        source_url,
        *,
        etag="",
        last_modified="",
        language_code="",
    ):
        """Conditionally fetch one canonical source without writing any model."""

        request_headers = {}
        if etag:
            request_headers["If-None-Match"] = str(etag)
        if last_modified:
            request_headers["If-Modified-Since"] = str(last_modified)
        try:
            video_id = youtube_video_id(source_url)
        except ValueError:
            video_id = ""
        if video_id:
            canonical_url = f"https://www.youtube.com/watch?v={video_id}"
            endpoint = "https://www.youtube.com/oembed?" + urlencode(
                [("url", canonical_url), ("format", "json")]
            )
        else:
            canonical_url = canonicalise_source_url(source_url)
            endpoint = canonical_url
        fetched = self._fetch(
            endpoint,
            request_headers=request_headers,
            accepted_statuses={304, 404, 410},
        )
        response_headers = {
            str(key).lower(): value for key, value in fetched.headers.items()
        }
        validators = {
            "etag": str(response_headers.get("etag") or etag or ""),
            "last_modified": str(
                response_headers.get("last-modified") or last_modified or ""
            ),
        }
        if fetched.status_code == 304:
            return {"status": "not_modified", **validators}
        if fetched.status_code in {404, 410}:
            return {"status": "missing", **validators}
        if video_id:
            result = normalise_youtube_oembed(
                canonical_url,
                self._json_object(fetched),
                language_code=language_code,
            )
        else:
            content_type = (fetched.content_type or "").split(";", 1)[0].lower()
            if content_type == "application/pdf" or fetched.body.startswith(b"%PDF"):
                reader_factory = self.pdf_reader_factory
                if reader_factory is None:
                    from odoo.tools.pdf import PdfFileReader

                    reader_factory = PdfFileReader
                result = normalise_pdf(
                    Path(urlsplit(fetched.url).path).name or "document.pdf",
                    fetched.body,
                    source_url=fetched.url,
                    reader_factory=reader_factory,
                )
            elif content_type in {"text/html", "application/xhtml+xml"}:
                result = normalise_html(
                    fetched.url,
                    fetched.body,
                    headers=fetched.headers,
                )
            else:
                raise IngestionError(
                    f"Source {redact_url(fetched.url)} has unsupported content type"
                )
        return {"status": "changed", "result": result, **validators}

    def discover_youtube_page(
        self,
        *,
        listing_type,
        listing_id,
        api_key,
        page_token="",
    ):
        if listing_type == "playlist":
            endpoint = "https://www.googleapis.com/youtube/v3/playlistItems"
            parameters = [
                ("part", "snippet,contentDetails"),
                ("maxResults", "50"),
                ("playlistId", str(listing_id)),
                ("key", str(api_key)),
            ]
        elif listing_type == "channel":
            endpoint = "https://www.googleapis.com/youtube/v3/search"
            parameters = [
                ("part", "snippet"),
                ("maxResults", "50"),
                ("channelId", str(listing_id)),
                ("type", "video"),
                ("order", "date"),
                ("key", str(api_key)),
            ]
        else:
            raise IngestionError("YouTube listing type must be playlist or channel")
        if page_token:
            parameters.append(("pageToken", str(page_token)))
        fetched = self._fetch(endpoint + "?" + urlencode(parameters))
        return normalise_youtube_listing_page(self._json_object(fetched))
