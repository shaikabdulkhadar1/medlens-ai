# MedLens AI Backend

A FastAPI-based medical case management system with AI-powered analysis capabilities.

## Features

- **Case Management**: Create and manage patient cases
- **File Upload**: Support for medical images, documents, vitals data, and FHIR data
- **AI Processing**: Background job processing for medical analysis
- **Real-time Updates**: WebSocket support for job status updates
- **S3 Storage**: MinIO integration for file storage
- **PostgreSQL**: Robust database for case and artifact management

## Architecture

```
├── main.py          # FastAPI application and routes
├── models.py        # Database operations and helper functions
├── worker.py        # Background job processing
├── job_queue.py     # Redis-based job queue
├── s3.py           # S3/MinIO storage operations
├── settings.py     # Configuration and environment variables
└── requirements.txt # Python dependencies
```

## API Endpoints

### Cases

#### `POST /cases`

Creates a new patient case.

**Request:**

```json
{
  "user_id": "uuid",
  "title": "string or null"
}
```

**Response:**

```json
{
  "case_id": "uuid"
}
```

#### `GET /cases`

Returns all cases for a user.

**Query Parameters:**

- `user_id` (required): User UUID
- `limit` (optional): Number of cases to return (default: 50)

**Response:**

```json
{
  "cases": [
    {
      "id": "uuid",
      "title": "string or null",
      "status": "string",
      "created_at": "ISO timestamp"
    }
  ]
}
```

#### `GET /cases/{case_id}`

Returns detailed information about a specific case.

**Response:**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string or null",
  "status": "string",
  "created_at": "ISO timestamp",
  "artifacts": [
    {
      "id": "uuid",
      "kind": "image|document|vitals|fhir",
      "uri": "s3://bucket/key",
      "meta_json": {},
      "parsed_json": {},
      "created_at": "ISO timestamp"
    }
  ],
  "model_runs": [
    {
      "id": "uuid",
      "artifact_id": "uuid or null",
      "task": "string",
      "model_name": "string",
      "params_json": {},
      "result_json": {},
      "latency_ms": 123,
      "cache_hit": false,
      "created_at": "ISO timestamp"
    }
  ]
}
```

### File Upload

#### `POST /upload/direct`

Uploads files directly to S3/MinIO storage.

**Form Data:**

- `case_id`: Case UUID
- `kind`: File type ("image", "document", "vitals", "fhir")
- `file`: Binary file data

**Response:**

```json
{
  "s3_uri": "s3://bucket/key",
  "artifact_id": "uuid"
}
```

#### `POST /upload/presign`

Generates presigned URLs for direct S3 uploads.

**Request:**

```json
{
  "case_id": "uuid",
  "files": [
    {
      "filename": "string",
      "contentType": "string",
      "kind": "image|document|vitals|fhir"
    }
  ]
}
```

**Response:**

```json
{
  "presigned": [
    {
      "url": "presigned-put-url",
      "key": "s3-key",
      "s3_uri": "s3://bucket/key",
      "kind": "image|document|vitals|fhir"
    }
  ]
}
```

### Job Processing

#### `POST /cases/ingest`

Queues artifacts for AI processing.

**Request:**

```json
{
  "case_id": "uuid",
  "artifacts": [
    {
      "kind": "image|document|vitals|fhir",
      "s3_uri": "s3://bucket/key",
      "meta": {}
    }
  ]
}
```

**Response:**

```json
{
  "queued": true,
  "artifacts": 2
}
```

#### `WebSocket /ws/cases/{case_id}`

Real-time job status updates.

**Messages:**

```json
{
  "jid": "job-id",
  "status": "queued|running|done|error",
  "result": {}
}
```

## Database Schema

### Tables

#### `cases`

- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `title` (TEXT, nullable)
- `status` (TEXT, default 'pending')
- `created_at` (TIMESTAMPTZ, default now())

#### `artifacts`

- `id` (UUID, Primary Key)
- `case_id` (UUID, Foreign Key to cases)
- `kind` (TEXT, check constraint: image|document|vitals|fhir)
- `uri` (TEXT, S3 URI)
- `parsed_json` (JSONB, nullable)
- `meta_json` (JSONB, nullable)
- `created_at` (TIMESTAMPTZ, default now())

#### `model_runs`

- `id` (UUID, Primary Key)
- `case_id` (UUID, Foreign Key to cases)
- `artifact_id` (UUID, Foreign Key to artifacts, nullable)
- `task` (TEXT)
- `model_name` (TEXT)
- `params_json` (JSONB, nullable)
- `result_json` (JSONB, nullable)
- `latency_ms` (INTEGER, nullable)
- `cache_hit` (BOOLEAN, default false)
- `created_at` (TIMESTAMPTZ, default now())

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/medlens

# Redis
REDIS_URL=redis://localhost:6379/0

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minio
S3_SECRET_KEY=minio12345
S3_BUCKET=medlens

# CORS
CORS_ORIGINS=http://localhost:3000

# Optional: Hugging Face token for AI models
HF_TOKEN=your_hf_token_here
```

## Setup and Installation

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Start infrastructure services:**

   ```bash
   cd ../../infra
   docker-compose up -d
   ```

3. **Initialize database:**

   ```bash
   psql -h localhost -p 5433 -U postgres -d medlens -f ../../db/schema.sql
   ```

4. **Start the FastAPI server:**

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Start the worker (in a separate terminal):**
   ```bash
   python worker.py
   ```

## Development

### Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Code Structure

- **`main.py`**: FastAPI application, routes, and request/response models
- **`models.py`**: Database operations using asyncpg
- **`worker.py`**: Background job processing with mock AI models
- **`job_queue.py`**: Redis-based job queue implementation
- **`s3.py`**: S3/MinIO storage operations using boto3
- **`settings.py`**: Configuration management with pydantic-settings

### Adding New AI Models

1. Add a new handler function in `worker.py`
2. Register it in the handler map
3. Update the job queueing logic in the upload endpoints
4. Add corresponding database fields if needed

### File Types Supported

- **Images**: X-rays, CT scans, MRIs, ultrasound images
- **Documents**: PDFs, lab reports, medical records
- **Vitals**: CSV files with patient vital signs
- **FHIR**: JSON/XML files with healthcare data

## Production Deployment

### Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:pass@prod-db:5432/medlens
REDIS_URL=redis://prod-redis:6379/0
S3_ENDPOINT=https://your-s3-endpoint.com
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
S3_BUCKET=medlens-prod
CORS_ORIGINS=https://your-frontend-domain.com
```

## API Documentation

Once the server is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## License

MIT License
