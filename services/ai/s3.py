import os
import requests
from pypdf import PdfReader
from PIL import Image
import io
import boto3
import pandas as pd
import datetime
import hashlib
from settings import settings

HF_TOKEN = os.getenv("HF_TOKEN")
HF_HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}
HF_API_URLS = {
    "image_classification": "https://api-inference.huggingface.co/models/microsoft/resnet-50",
    "summarization": "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
}

def handle_image(payload):
    url = object_url(payload["key"])
    response = requests.get(url)
    response.raise_for_status()
    image_bytes = response.content
    files = {"inputs": image_bytes}
    api_response = requests.post(
        HF_API_URLS["image_classification"],
        headers=HF_HEADERS,
        data=image_bytes,
    )
    api_response.raise_for_status()
    predictions = api_response.json()
    return {"case_id": payload["case_id"], "predictions": predictions}

def handle_document(payload):
    url = object_url(payload["key"])
    response = requests.get(url)
    response.raise_for_status()
    pdf_bytes = io.BytesIO(response.content)
    reader = PdfReader(pdf_bytes)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    api_response = requests.post(
        HF_API_URLS["summarization"],
        headers=HF_HEADERS,
        json={"inputs": text},
    )
    api_response.raise_for_status()
    summary = api_response.json()
    return {"case_id": payload["case_id"], "text": text, "summary": summary}

def handle_vitals(payload):
    url = object_url(payload["key"])
    response = requests.get(url)
    response.raise_for_status()
    csv_bytes = io.BytesIO(response.content)
    df = pd.read_csv(csv_bytes)
    alerts = []
    if (df["SpO2"] < 92).any():
        alerts.append("SpO2 below 92 detected")
    if (df["HR"] > 100).any():
        alerts.append("High heart rate detected")
    stats = df.describe().to_dict()
    return {"case_id": payload["case_id"], "stats": stats, "alerts": alerts}

def handle_fusion(payload):
    # Stub for fusion logic combining results from other handlers
    return {"case_id": payload["case_id"], "result": "fusion result"}

# S3 utility functions
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

def put_object_bytes(key: str, data: bytes, content_type: str = "application/octet-stream"):
    """Upload bytes directly to S3/MinIO"""
    _s3.put_object(
        Bucket=settings.S3_BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type
    )
    return f"s3://{settings.S3_BUCKET}/{key}"