from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema
from typing import List, Optional


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler: GetCoreSchemaHandler):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.str_schema(),
            serialization=core_schema.to_string_ser_schema(),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema, handler):
        return {"type": "string", "format": "objectid"}


# User model
class User(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    email: str
    password_hash: str
    reg_no: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    posts: List[PyObjectId] = []  # List of Post IDs
    comments: List[PyObjectId] = []  # List of Comment IDs
    clubs_participated: List[PyObjectId] = []  # List of Club IDs
    # List of Club IDs where user is admin
    clubs_administered: List[PyObjectId] = []
    uploaded_files: List[PyObjectId] = []  # List of File IDs

    class Config:
        json_encoders = {ObjectId: str}


# File model
class FileMetadata(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId  # User who uploaded
    file_name: str
    file_url: str
    file_type: str = "pdf"  # Restrict to PDF only
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    course_id: Optional[PyObjectId] = None  # Related course (if any)
    subject: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}


# Course model
class Course(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    course_code: str  # Unique course code

    class Config:
        json_encoders = {ObjectId: str}


# Post model
class Post(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId  # Author of the post
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}


# Comment model
class Comment(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    post_id: PyObjectId  # Post being commented on
    user_id: PyObjectId  # Comment author
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}


# Club model
class Club(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    description: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    faculty_advisor: List[PyObjectId] = []  # Faculty advisor (if any)
    admins: List[PyObjectId] = []  # Club admins
    members: List[PyObjectId] = []  # Approved members
    pending_requests: List[PyObjectId] = []  # Users requesting to join
    created_by: PyObjectId  # Club admin (User ID)
    image_url: str  # cloudinary url for club image
    class Config:
        json_encoders = {ObjectId: str}


# Club Post model
class ClubPost(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    club_id: PyObjectId  # Club being posted in
    user_id: PyObjectId  # Author of the post
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}


# Club Event model
class ClubEvent(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    club_id: PyObjectId  # Club hosting the event
    title: str
    description: str
    banner_url: str  # cloudinary url
    registration_link: str
    event_time: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {ObjectId: str}
