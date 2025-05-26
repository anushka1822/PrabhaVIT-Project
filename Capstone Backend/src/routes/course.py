# Create a router to manage the courses
# Create a router to manage the courses
# Create a router to manage the courses
# Create a router to manage the courses
from fastapi import APIRouter, Request
# Import json response
from fastapi.responses import JSONResponse
from fastapi import HTTPException, status
from src.models import Course
from src.auth import decode_jwt_token
from src.schemas import CourseCreate, CourseResponse
from typing import List
from datetime import datetime
from bson import ObjectId  # Import ObjectId
from fastapi import Cookie, HTTPException

from src.database import get_database


db = get_database()
courses_collection = db.courses
user_collection = db.users

router = APIRouter(prefix="/courses", tags=["Courses"])


# Updated response_model
@router.get("/all", response_model=List[CourseResponse])
async def get_courses():
    try:
        courses_cursor = courses_collection.find()  # Get the cursor
        courses_list = []
        # Iterate through the cursor
        for course_doc in courses_cursor.to_list(length=None):
            # Convert ObjectId to string
            course_doc["id"] = str(course_doc["_id"])
            courses_list.append(course_doc)  # Add to list
        return courses_list  # Return the list of CourseResponse objects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/register/{course_id}")
async def register_course(course_id: str, access_token: str = Cookie(None)):
    try:
        token_data = decode_jwt_token(access_token)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        regno = token_data.get("regno")
        user = user_collection.find_one({"regno": regno})
        user_id = user.get("_id")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="User ID not found in token")

        # Validate course existence
        course = courses_collection.find_one({"_id": ObjectId(course_id)})
        if not course:
            raise HTTPException(
                status_code=400, detail="Course with this course id does not exist")

        # Add user to the course's students array if not already registered
        if str(user_id) not in course.get("students", []):
            result = courses_collection.update_one(
                {"_id": ObjectId(course_id)},
                {"$push": {"students": str(user_id)}}
            )
            if result.modified_count == 0:
                raise HTTPException(
                    status_code=500, detail="Failed to register for course")
            return JSONResponse({"message": "Successfully registered for course"})
        else:
            return JSONResponse({"message": "User already registered for course"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# Create a router to manage the courses


@router.get("/registered", response_model=List[CourseResponse])
async def get_registered_courses(access_token: str = Cookie(None)):
    try:
        token_data = decode_jwt_token(access_token)
        if not token_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        regno = token_data.get("regno")
        user = user_collection.find_one({"regno": regno})
        user_id = user.get("_id")
        if not user_id:
            raise HTTPException(
                status_code=400, detail="User ID not found in token")

        # Fetch courses where the user is registered
        courses_cursor = courses_collection.find({"students": str(user_id)})
        courses_list = []
        print(f"User ID: {user_id}")
        for course_doc in courses_cursor.to_list(length=None):
            print(f"Course: {course_doc}")
            course_doc["id"] = str(course_doc["_id"])
            courses_list.append(course_doc)
        return courses_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create", response_model=CourseResponse)
def create_course(course: CourseCreate):
    try:
        name, course_code = course.name, course.course_code
        existing_course = courses_collection.find_one(
            {"course_code": course_code})
        if existing_course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course with that course code already exists",
            )
        course_data = {
            "name": name,
            "course_code": course_code,
            "created_at": datetime.utcnow()  # Explicitly add created_at here
        }
        result = courses_collection.insert_one(course_data)
        created_course = courses_collection.find_one(
            {"_id": result.inserted_id})
        # Convert ObjectId to string for 'id'
        created_course["id"] = str(created_course["_id"])
        return created_course  # Return the fetched course document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Updated response_model
@router.delete("/delete/{course_id}", response_model=CourseResponse)
def delete_course(course_id: str):
    try:
        deleted_course = courses_collection.find_one(
            {"_id": ObjectId(course_id)})  # Fetch course to be deleted
        if deleted_course:  # Check if course exists
            courses_collection.delete_one(
                {"_id": ObjectId(course_id)})  # Delete the course
            # Convert ObjectId to string
            deleted_course["id"] = str(deleted_course["_id"])
            return deleted_course  # Return the deleted CourseResponse object
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Course not found")  # Raise 404 if not found
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
