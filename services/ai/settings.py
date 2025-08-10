from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Postgres on host port 5433 (from docker-compose)
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5433/medlens"

    # Redis (default)
    REDIS_URL: str = "redis://localhost:6379/0"

    # MinIO / S3-compatible store
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minio"
    S3_SECRET_KEY: str = "minio12345"
    S3_BUCKET: str = "medlens"

    # CORS for local Next.js
    CORS_ORIGINS: str = "http://localhost:3000"

    # Optional Hugging Face token (for private models/endpoints later)
    HF_TOKEN: str | None = None

settings = Settings()