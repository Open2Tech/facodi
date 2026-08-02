from pathlib import Path

from app.jobs import JobStore
from app.processor import process_enrichment_job


class FakeResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, str]:
        return {'title': 'Official lesson', 'author_name': 'Odoo'}


def test_processor_marks_youtube_job_ready(tmp_path: Path, monkeypatch) -> None:
    database_path = str(tmp_path / 'jobs.sqlite3')
    job_store = JobStore(database_path)
    job_store.initialize()
    job = job_store.create_or_reuse('https://www.youtube.com/watch?v=example')
    monkeypatch.setattr('app.processor.httpx.get', lambda *_args, **_kwargs: FakeResponse())

    process_enrichment_job(str(job['id']), str(job['source_url']), database_path)

    completed = job_store.get(str(job['id']))
    assert completed is not None
    assert completed['state'] == 'ready'
    assert completed['title'] == 'Official lesson'
    assert completed['summary'] == 'Vídeo "Official lesson", publicado por Odoo. Fonte original: youtube.com.'


def test_processor_marks_unsupported_provider_failed(tmp_path: Path) -> None:
    database_path = str(tmp_path / 'jobs.sqlite3')
    job_store = JobStore(database_path)
    job_store.initialize()
    job = job_store.create_or_reuse('https://drive.google.com/file/d/example/view')

    process_enrichment_job(str(job['id']), str(job['source_url']), database_path)

    failed = job_store.get(str(job['id']))
    assert failed is not None
    assert failed['state'] == 'failed'
    assert failed['error'] == 'No metadata provider is available for this video host'


def test_processor_claims_job_only_once(tmp_path: Path, monkeypatch) -> None:
    database_path = str(tmp_path / 'jobs.sqlite3')
    job_store = JobStore(database_path)
    job_store.initialize()
    job = job_store.create_or_reuse('https://www.youtube.com/watch?v=example')
    calls = []

    def fake_get(*_args, **_kwargs):
        calls.append(True)
        return FakeResponse()

    monkeypatch.setattr('app.processor.httpx.get', fake_get)
    process_enrichment_job(str(job['id']), str(job['source_url']), database_path)
    process_enrichment_job(str(job['id']), str(job['source_url']), database_path)

    assert len(calls) == 1