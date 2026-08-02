from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

    pipeline_token: SecretStr
    database_path: str = '/data/facodi-pipeline.sqlite3'
    allowed_video_hosts: tuple[str, ...] = (
        'youtu.be',
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'vimeo.com',
        'www.vimeo.com',
        'drive.google.com',
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()