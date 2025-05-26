from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Cookie, Depends
from fastapi.responses import JSONResponse
import os
import boto3
from botocore.exceptions import ClientError
import logging
from io import BytesIO
from datetime import datetime
from dotenv import load_dotenv
from typing import Optional, List
from src.models import FileMetadata, PyObjectId
from src.database import get_database
from src.auth import decode_jwt_token
from fastapi import HTTPException

load_dotenv()

router = APIRouter(prefix="/files", tags=["files"])

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)

db = get_database()
file_metadata_collection = db.file_metadata
user_collection = db.users
course_collection = db.courses

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    file_name: str = Form(...),
    course_id: str = Form(...),
    access_token: str = Cookie(None),
    description: Optional[str] = Form(None),
):
    try:
        logger.info(f"Starting file upload: {file_name} for course {course_id}")
        
        # Basic validation
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        if not file_name or not file_name.strip():
            raise HTTPException(status_code=400, detail="File name is required")

        # Ensure file is PDF
        if not file.content_type == "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Get file content
        try:
            file_content = await file.read()
            if not file_content:
                raise HTTPException(status_code=400, detail="Empty file")
        except Exception as e:
            logger.error(f"File read error: {str(e)}")
            raise HTTPException(status_code=400, detail="Could not read file content")

        # Auth and user check
        try:
            token_data = decode_jwt_token(access_token)
            if not token_data:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            regno = token_data.get("regno")
            user = user_collection.find_one({"regno": regno})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_id = user.get("_id")
        except Exception as e:
            logger.error(f"Auth error: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication failed")

        # Course check
        try:
            course = course_collection.find_one({"_id": PyObjectId(course_id)})
            if not course:
                raise HTTPException(status_code=404, detail="Course not found")
            course_name = course.get('name', 'unknown').replace('/', '-')
        except Exception as e:
            logger.error(f"Course error: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid course ID")

        # Create safe filename
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{timestamp}_{file_name.replace('/', '_')}"
        key = f"{course_name}/{safe_filename}"

        # Upload to S3
        try:
            s3.upload_fileobj(
                BytesIO(file_content),
                S3_BUCKET_NAME,
                key,
                ExtraArgs={
                    "ContentType": "application/pdf",
                    "Metadata": {
                        "filename": file_name,
                        "description": description or ""
                    }
                }
            )
        except ClientError as e:
            logger.error(f"S3 upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload to storage")

        # Save metadata
        try:
            file_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"
            file_metadata = {
                "user_id": user_id,
                "file_name": file_name,
                "file_url": file_url,
                "file_type": "application/pdf",
                "uploaded_at": datetime.utcnow(),
                "course_id": course["_id"],
                "description": description or "",
                "subject": course_name
            }

            result = file_metadata_collection.insert_one(file_metadata)
            logger.info(f"File uploaded successfully: {file_name}")
            
            return {
                "message": "File uploaded successfully",
                "file_url": file_url,
                "file_id": str(result.inserted_id)
            }

        except Exception as e:
            logger.error(f"Database error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to save file metadata")

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.get("/course/{course_id}", response_model=List[FileMetadata])
async def get_files_by_course(course_id: str):
    try:
        # Fetch files for the given course ID
        # print(course_id)
        files_cursor = file_metadata_collection.find({"course_id": PyObjectId(course_id)})

        files_list = []
        for file in files_cursor.to_list(length=None):
            file["_id"] = str(file["_id"])
            file["user_id"] = str(file["user_id"])
            file["uploaded_at"] = file["uploaded_at"].isoformat()
            file["course_id"] = str(file["course_id"])
            files_list.append(file)
        print(files_list)
        return files_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete/{file_id}")
def delete_file(file_id: str):
    try:
        file_metadata = file_metadata_collection.find_one(
            {"_id": PyObjectId(file_id)})
        if not file_metadata:
            raise HTTPException(
                status_code=404, detail="File metadata not found")

        filename = file_metadata["file_name"]
        subject = file_metadata["subject"]
        key = f"{subject}/{filename}"
        s3.delete_object(Bucket=S3_BUCKET_NAME, Key=key)
        # Delete file metadata from the database
        result = file_metadata_collection.delete_one(
            {"_id": PyObjectId(file_id)})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404, detail="File metadata not found")
        return JSONResponse({"message": f"File {filename} deleted successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
def list_files():
    try:
        files = file_metadata_collection.find().to_list(length=None)
        files_list = []
        for file in files:
            file["_id"] = str(file["_id"])
            file["user_id"] = str(file["user_id"])
            file["uploaded_at"] = file["uploaded_at"].isoformat()
            file["course_id"] = str(file["course_id"])
            files_list.append(file)
        return JSONResponse({"files": files_list})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
