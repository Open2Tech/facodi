from urllib.parse import urlencode, urlparse

import httpx

from .jobs import JobStore


def process_enrichment_job(job_id: str, source_url: str, database_path: str) -> None:
    job_store = JobStore(database_path)
    if not job_store.claim(job_id):
        return

    try:
        metadata = _fetch_oembed_metadata(source_url)
        title = str(metadata['title']).strip()
        author = str(metadata.get('author_name') or 'fonte original').strip()
        host = (urlparse(source_url).hostname or '').removeprefix('www.')
        summary = f'Vídeo "{title}", publicado por {author}. Fonte original: {host}.'
        job_store.mark_ready(job_id, title=title, summary=summary)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        job_store.mark_failed(job_id, _safe_error(exc))


def _fetch_oembed_metadata(source_url: str) -> dict[str, object]:
    host = (urlparse(source_url).hostname or '').lower()
    if host in {'youtu.be', 'youtube.com', 'www.youtube.com', 'm.youtube.com'}:
        endpoint = 'https://www.youtube.com/oembed'
    elif host in {'vimeo.com', 'www.vimeo.com'}:
        endpoint = 'https://vimeo.com/api/oembed.json'
    else:
        raise ValueError('No metadata provider is available for this video host')

    query = urlencode({'url': source_url, 'format': 'json'})
    response = httpx.get(f'{endpoint}?{query}', timeout=15.0, follow_redirects=True)
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict) or not payload.get('title'):
        raise ValueError('The metadata provider returned no title')
    return payload


def _safe_error(exc: Exception) -> str:
    if isinstance(exc, httpx.HTTPStatusError):
        return f'Metadata provider returned HTTP {exc.response.status_code}'
    if isinstance(exc, httpx.TimeoutException):
        return 'Metadata provider timed out'
    return str(exc)[:500]