# src/routes/post.py
from fastapi import APIRouter, HTTPException, status, Request
from fastapi.responses import JSONResponse
from src.auth import hash_password, verify_password, create_jwt_token, decode_jwt_token
# Import PostResponse and PostCreate
from src.schemas import PostResponse, PostCreate
from src.database import get_database
from bson import ObjectId
from datetime import datetime
from src.gemini import is_NSFW

router = APIRouter(prefix="/posts", tags=["Posts"])

# Database
db = get_database()
posts_collection = db.posts  # Assuming you have a posts_collection
comments_collection = db.comments
users_collection = db.users


@router.post("/create", response_model=PostResponse)  # Add PostResponse
def create_post(post: PostCreate, request: Request):
    # Get the user ID from the token
    try:
        token = request.cookies["access_token"]
        token_data = decode_jwt_token(token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        user_id = token_data["regno"]

        # Create the post
        post_d = post.model_dump()
        if is_NSFW(post_d['title']).strip() == 'Yes' or is_NSFW(post_d['content']).strip() == 'Yes':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Post contains NSFW content",
            )
        post_data = post.dict()
        post_data["user_id"] = user_id
        post_data["created_at"] = datetime.utcnow()
        post_data["updated_at"] = datetime.utcnow()

        # Insert into the database
        result = posts_collection.insert_one(post_data)
        post_data["_id"] = result.inserted_id  # get inserted id
        post_data["id"] = str(result.inserted_id)

        # Convert the response to a Pydantic model
        return PostResponse(**post_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Exception occurred : " + str(e),
        )


@router.get("/all", response_model=list[PostResponse])
def get_all_user_posts(request: Request):
    try:
        # Get all posts from the user
        token = request.cookies["access_token"]
        decoded_token = decode_jwt_token(token)
        print("Decoded token:", decoded_token)
        regno = decoded_token["regno"]
        # No need to find user here, we only need regno
        user = users_collection.find_one({"regno": regno})
        if not user:
            print("User not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        all_posts = list(posts_collection.find().sort("created_at",-1))  # Convert cursor to list

        # Convert the response to a Pydantic model and include _id
        posts = []

        for post in all_posts:
            post["id"] = str(post["_id"])  # Rename _id to id
            posts.append(PostResponse(**post))  # Use PostResponse

        return posts

    except Exception as e:
        print(f"Exception occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Exception occurred: {e}",
        )


@router.get("/delete/{post_id}")
def delete_post(post_id: str, request: Request):
    try:
        # Get the user ID from the token
        # Use .get() to avoid KeyError
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not found",
            )

        user_id = decode_jwt_token(token)["regno"]

        # Convert post_id to ObjectId
        try:
            post_obj_id = ObjectId(post_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid post ID format",
            )

        # Check if the post exists
        post = posts_collection.find_one({"_id": post_obj_id})
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        # Check if the user is the owner of the post
        if post["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,  # Use 403 for permission issues
                detail="Unauthorized to delete this post",
            )

        # Delete the post's comments first
        comments_collection.delete_many({"post_id": post_id})

        # Delete the post
        posts_collection.delete_one({"_id": post_obj_id})

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "Post and associated comments deleted successfully"},
        )

    except HTTPException as http_exc:
        raise http_exc  # Rethrow HTTP exceptions directly

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected Error: {str(e)}",
        )


# Creating a route to show all comments in a post
@router.get("/comments/{post_id}")
def show_comments(post_id: str, request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token not found",
            )

        regno = decode_jwt_token(token)["regno"]
        user = users_collection.find_one({"regno": regno})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Convert post_id to ObjectId
        try:
            post_obj_id = ObjectId(post_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid post ID format",
            )

        # Check if the post exists
        post = posts_collection.find_one({"_id": post_obj_id})
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Post not found",
            )

        # # Check if the user is the owner of the post
        # print(post["user_id"], str(user["regno"]))
        # if post["user_id"] != str(user["regno"]):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Unauthorized to view comments",
        #     )

        # Get all comments for the post
        comments = comments_collection.find({"post_id": post_id})

        # Convert the response to a Pydantic model and include _id
        comments_list = []

        for comment in comments:
            comment["_id"] = str(comment["_id"])  # Convert ObjectId to string
            comments_list.append(comment)

        return comments_list

    except HTTPException as http_exc:
        raise http_exc

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected Error: {str(e)}",
        )
