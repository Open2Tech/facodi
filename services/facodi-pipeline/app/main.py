from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, HttpUrl

from .config import Settings, get_settings
from .jobs import JobStore


class EnrichmentRequest(BaseModel):
    source_url: HttpUrl


class EnrichmentJob(BaseModel):
    id: str
    state: str
    source_url: str
    created_at: str
    updated_at: str
    title: str | None = None
    summary: str | None = None
    error: str | None = None


def get_job_store(settings: Settings = Depends(get_settings)) -> JobStore:
    return JobStore(settings.database_path)


def require_token(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    expected = f'Bearer {settings.pipeline_token.get_secret_value()}'
    if authorization != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized')


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    JobStore(settings.database_path).initialize()
    yield


app = FastAPI(title='FACODI Pipeline', version='0.1.0', lifespan=lifespan)


@app.get('/healthz')
def health_check() -> dict[str, str]:
    return {'status': 'ok'}


@app.post('/v1/videos/enrich', response_model=EnrichmentJob, dependencies=[Depends(require_token)])
def create_enrichment_job(
    request: EnrichmentRequest,
    settings: Settings = Depends(get_settings),
    job_store: JobStore = Depends(get_job_store),
) -> dict[str, str | None]:
    host = (urlparse(str(request.source_url)).hostname or '').lower()
    if host not in settings.allowed_video_hosts:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='Unsupported video host')
    return job_store.create_or_reuse(str(request.source_url))


@app.get('/v1/jobs/{job_id}', response_model=EnrichmentJob, dependencies=[Depends(require_token)])
def get_enrichment_job(job_id: str, job_store: JobStore = Depends(get_job_store)) -> dict[str, str | None]:
    job = job_store.get(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Job not found')
    return job