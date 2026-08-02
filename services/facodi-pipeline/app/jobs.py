import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4


class JobStore:
    def __init__(self, database_path: str):
        self.database_path = database_path

    def initialize(self) -> None:
        Path(self.database_path).parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as connection:
            connection.execute(
                '''
                CREATE TABLE IF NOT EXISTS enrichment_job (
                    id TEXT PRIMARY KEY,
                    source_url TEXT NOT NULL,
                    state TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    title TEXT,
                    summary TEXT,
                    error TEXT
                )
                '''
            )
            connection.execute(
                '''
                CREATE UNIQUE INDEX IF NOT EXISTS enrichment_job_active_source
                ON enrichment_job (source_url)
                WHERE state IN ('queued', 'processing')
                '''
            )

    def create_or_reuse(self, source_url: str) -> dict[str, str | None]:
        timestamp = self._timestamp()
        with self._connect() as connection:
            existing = connection.execute(
                '''
                SELECT id, source_url, state, created_at, updated_at, title, summary, error
                FROM enrichment_job
                WHERE source_url = ? AND state IN ('queued', 'processing')
                ''',
                (source_url,),
            ).fetchone()
            if existing:
                return dict(existing)

            job_id = str(uuid4())
            connection.execute(
                '''
                INSERT INTO enrichment_job (id, source_url, state, created_at, updated_at)
                VALUES (?, ?, 'queued', ?, ?)
                ''',
                (job_id, source_url, timestamp, timestamp),
            )
            return dict(
                connection.execute(
                    '''
                    SELECT id, source_url, state, created_at, updated_at, title, summary, error
                    FROM enrichment_job WHERE id = ?
                    ''',
                    (job_id,),
                ).fetchone()
            )

    def get(self, job_id: str) -> dict[str, str | None] | None:
        with self._connect() as connection:
            row = connection.execute(
                '''
                SELECT id, source_url, state, created_at, updated_at, title, summary, error
                FROM enrichment_job WHERE id = ?
                ''',
                (job_id,),
            ).fetchone()
            return dict(row) if row else None

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(UTC).isoformat()