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
            connection.execute(
                '''
                UPDATE enrichment_job
                SET state = 'queued', updated_at = ?
                WHERE state = 'processing'
                ''',
                (self._timestamp(),),
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

    def claim(self, job_id: str) -> bool:
        timestamp = self._timestamp()
        with self._connect() as connection:
            cursor = connection.execute(
                '''
                UPDATE enrichment_job
                SET state = 'processing', updated_at = ?, error = NULL
                WHERE id = ? AND state = 'queued'
                ''',
                (timestamp, job_id),
            )
            return cursor.rowcount == 1

    def mark_ready(self, job_id: str, *, title: str, summary: str) -> None:
        self._update_terminal_state(job_id, state='ready', title=title, summary=summary, error=None)

    def mark_failed(self, job_id: str, error: str) -> None:
        self._update_terminal_state(job_id, state='failed', title=None, summary=None, error=error)

    def _update_terminal_state(
        self,
        job_id: str,
        *,
        state: str,
        title: str | None,
        summary: str | None,
        error: str | None,
    ) -> None:
        with self._connect() as connection:
            connection.execute(
                '''
                UPDATE enrichment_job
                SET state = ?, updated_at = ?, title = ?, summary = ?, error = ?
                WHERE id = ?
                ''',
                (state, self._timestamp(), title, summary, error, job_id),
            )

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(UTC).isoformat()