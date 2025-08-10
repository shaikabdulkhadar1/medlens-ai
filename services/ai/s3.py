import boto3
import datetime
import hashlib
from .settings import settings

_session = boto3.session.Session()
_s3 = _session.client(
    "s3",
    endpoint_url=settings.S3_ENDPOINT,
    aws_access_key_id=settings.S3_ACCESS_KEY,
    aws_secret_access_key=settings.S3_SECRET_KEY,
)

def presign_put(key: str, content_type: str) -> dict:
    """
    Return a presigned PUT URL for direct-to-MinIO upload.
    """
    params = {"Bucket": settings.S3_BUCKET, "Key": key}
    url = _s3.generate_presigned_url(
        "put_object",
        Params={**params, "ContentType": content_type},
        ExpiresIn=60 * 10,
    )
    return {"url": url, "key": key, "s3_uri": f"s3://{settings.S3_BUCKET}/{key}"}

def object_url(key: str) -> str:
    # Helpful when you want to read the object back over HTTP in dev
    return f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET}/{key}"

def key_for(case_id: str, filename: str) -> str:
    stamp = datetime.datetime.utcnow().strftime("%Y%m%dT%H%M%S")
    h = hashlib.sha1(filename.encode()).hexdigest()[:8]
    return f"cases/{case_id}/{stamp}-{h}-{filename}"