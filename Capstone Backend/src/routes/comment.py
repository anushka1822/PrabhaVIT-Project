from src.models import Comment
from src.schemas import CommentCreate, CommentResponse  # Import CommentResponse
from src.database import get_database
from src.auth import decode_jwt_token

from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse
from datetime import datetime
from src.gemini import is_NSFW
from bson import ObjectId

router = APIRouter(prefix="/comment", tags=["Comments"])

# Database
db = get_database()
posts_collection = db.posts
users_collection = db.users
comments_collection = db.comments


# Change to CommentResponse
@router.post("/create", response_model=CommentResponse)
def create_comment(comment: CommentCreate, request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not found",
            )

        token_data = decode_jwt_token(token)
        user = users_collection.find_one({"regno": token_data["regno"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        post = posts_collection.find_one({"_id": ObjectId(comment.post_id)})
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )
        comment_d = comment.model_dump()
        if is_NSFW(comment_d['content']).strip() == 'Yes':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post contains NSFW content",
            )
        comment_data = comment.dict()
        comment_data["user_id"] = str(user["_id"])
        comment_data['post_id'] = str(post["_id"])
        comment_data["created_at"] = datetime.utcnow()

        result = comments_collection.insert_one(comment_data)
        comment_data["_id"] = result.inserted_id  # get inserted id
        comment_data["id"] = str(result.inserted_id)

        return CommentResponse(**comment_data)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"ERROR: {e}",
        )


@router.delete("/delete/{comment_id}")
def delete_comment(comment_id: str, request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not found",
            )

        token_data = decode_jwt_token(token)
        user = users_collection.find_one({"regno": token_data["regno"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        comment = comments_collection.find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found",
            )

        if comment["user_id"] != str(user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized",
            )

        comments_collection.delete_one({"_id": ObjectId(comment_id)})

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Comment deleted successfully"},
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"ERROR: {e}",
        )


@router.get("/all")
def get_all_comments(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not found",
            )

        token_data = decode_jwt_token(token)
        user = users_collection.find_one({"regno": token_data["regno"]})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        comments = comments_collection.find()
        comments_list = []
        for comment in comments:
            comment["id"] = str(comment["id"])
            comments_list.append(CommentResponse(
                **comment))  # Use CommentResponse

        return comments_list

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"ERROR: {e}",
        )
