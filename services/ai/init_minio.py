#!/usr/bin/env python3
"""
Initialize MinIO bucket and test S3 connectivity
"""
import boto3
from botocore.exceptions import ClientError
from settings import settings

def init_minio():
    """Initialize MinIO bucket"""
    try:
        # Create S3 client
        s3 = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY
        )
        
        # List existing buckets
        print("Existing buckets:")
        response = s3.list_buckets()
        for bucket in response['Buckets']:
            print(f"  - {bucket['Name']}")
        
        # Check if our bucket exists
        bucket_name = settings.S3_BUCKET
        try:
            s3.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' already exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                # Bucket doesn't exist, create it
                print(f"Creating bucket '{bucket_name}'...")
                s3.create_bucket(Bucket=bucket_name)
                print(f"✅ Bucket '{bucket_name}' created successfully")
            else:
                print(f"❌ Error checking bucket: {e}")
                return False
        
        # Test upload
        print("Testing upload...")
        test_key = "test/hello.txt"
        test_content = b"Hello, MinIO!"
        s3.put_object(Bucket=bucket_name, Key=test_key, Body=test_content)
        print(f"✅ Upload test successful: s3://{bucket_name}/{test_key}")
        
        # Test download
        response = s3.get_object(Bucket=bucket_name, Key=test_key)
        downloaded_content = response['Body'].read()
        print(f"✅ Download test successful: {downloaded_content}")
        
        # Clean up test file
        s3.delete_object(Bucket=bucket_name, Key=test_key)
        print(f"✅ Cleanup successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing MinIO: {e}")
        return False

if __name__ == "__main__":
    print("Initializing MinIO...")
    success = init_minio()
    if success:
        print("🎉 MinIO initialization completed successfully!")
    else:
        print("💥 MinIO initialization failed!")
        exit(1)
