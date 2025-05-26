# src/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schema
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    regno: str

class UserLogin(BaseModel):
    regno: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    regno: str
    created_at: datetime
    posts: List[str] = []  # List of Post IDs
    comments: List[str] = []  # List of Comment IDs
    clubs_participated: List[str] = []  # List of Club IDs
    clubs_administered: List[str] = []  # List of Club IDs where user is admin
    uploaded_files: List[str] = []  # List of File IDs

# Post Schema
class PostCreate(BaseModel):
    title: str
    content: str

class PostResponse(BaseModel):
    id: str
    user_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
    comments: List[str] = []  # List of Comment IDs

# Comment Schema
class CommentCreate(BaseModel):
    content: str
    post_id: str

class CommentResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    content: str
    created_at: datetime

# Club Schema
class ClubCreate(BaseModel):
    name: str
    description: str

class ClubResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: datetime
    created_by: str  # Admin user ID
    members: List[str] = []  # List of user IDs
    faculty_advisor: List[str] = []
    admins: List[str] = []
    image_url: Optional[str] = None  # URL to club image

# File Schema
class FileMetadataCreate(BaseModel):
    user_id: str
    file_name: str
    file_url: str
    file_type: str  # Should only allow "pdf"
    uploaded_by: str
    course_code: str

class FileMetadataResponse(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_url: str
    file_type: str
    uploaded_at: datetime
    course_id: Optional[str] = None
    uploaded_by: str
    course_code: Optional[str] = None
    subject: Optional[str] = None

# Course Schema
class CourseCreate(BaseModel):
    name: str
    course_code: str

class CourseResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    course_code: str

# Club Post Schema
class ClubPostCreate(BaseModel):
    title: str
    content: str

class ClubPostResponse(BaseModel):
    id: str
    club_id: str
    user_id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime