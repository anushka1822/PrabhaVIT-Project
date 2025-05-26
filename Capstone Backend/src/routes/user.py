from fastapi import APIRouter, HTTPException, status, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from src.auth import hash_password, verify_password, create_jwt_token, decode_jwt_token
from src.schemas import UserCreate, UserLogin, UserResponse
from src.models import User
from datetime import datetime
from src.database import get_database
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database
db = get_database()
users_collection = db.users
posts_collection = db.posts
comments_collection = db.comments
clubs_collection = db.clubs


# Dummy database for demonstration
users_db = {
    "21BAI10019": {
        "username": "21BAI10019",
        "email": "pranav.pratyush2021@vitbhopal.ac.in",
        "created_at": datetime(2025, 7, 20),
        "posts_count": 5,
        "faculty": "Computer Science",
        "interests": ["AI", "Web Development", "Data Science"],
        "recentComments": 3,
        "lastLogin": datetime.now()
    }
}


def get_current_user(token: str = Depends(oauth2_scheme)):
    # In a real app, decode token to get username
    username = "21BAI10019"  # dummy value for testing
    user = users_db.get(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate):
    """
    Registers a new user.

    Args:
        user (UserCreate): The user data for registration.

    Returns:
        UserResponse: The registered user data.

    Raises:
        HTTPException: 400 if user with email or regno already exists.
    """
    existing_user = users_collection.find_one(
        {"$or": [{"email": user.email}, {"regno": user.regno}]})
    if (existing_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with that email or registration number already exists",
        )

    password_hash = hash_password(user.password)

    user_data = user.dict()
    user_data["password_hash"] = password_hash
    user_data["created_at"] = datetime.utcnow()

    # Initialize fields BEFORE inserting into MongoDB
    user_data["posts"] = []
    user_data["comments"] = []
    user_data["clubs_participated"] = []  # Added before insertion
    user_data["clubs_administered"] = []
    user_data["uploaded_files"] = []

    # Insert user into MongoDB
    result = users_collection.insert_one(user_data)

    # Convert ObjectId to string for response
    user_data["_id"] = result.inserted_id
    user_data["id"] = str(result.inserted_id)

    return UserResponse(**user_data)


@router.post("/login")
def login_user(user: UserLogin):
    """
    Logs in a user.

    Args:
        user (UserLogin): The user login credentials.

    Returns:
        JSONResponse: Contains a success message, JWT token, and user data.

    Raises:
        HTTPException: 404 if user not found, 401 if password invalid.
    """
    existing_user = users_collection.find_one({"regno": user.regno})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not verify_password(user.password, existing_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    token_data = {"regno": user.regno, "email": existing_user["email"]}
    token = create_jwt_token(token_data)

    print("Token created successfully")

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Logged in successfully",
                 "token": token},
    )

    response.headers["Authorization"] = f"Bearer {token}"

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=False,
        secure=False,
        samesite="none",
        max_age=3600,
        path="/"
    )

    return response


@router.get("/me", response_model=UserResponse)
def get_current_user(request: Request):
    try:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found")

        token_data = decode_jwt_token(token)
        current_user = users_collection.find_one(
            {"regno": token_data["regno"]})

        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        current_user["id"] = str(current_user["_id"])
        current_user["created_at"] = current_user["created_at"].isoformat()

        # Convert ObjectId values in clubs_participated to strings
        if "clubs_participated" in current_user:
            current_user["clubs_participated"] = [str(club_id) if isinstance(
                club_id, ObjectId) else club_id for club_id in current_user["clubs_participated"]]
        if "clubs_administered" in current_user:
            current_user["clubs_administered"] = [str(club_id) if isinstance(
                club_id, ObjectId) else club_id for club_id in current_user["clubs_administered"]]

        return UserResponse(**current_user)

    except Exception as e:
        print(f"Error decoding token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not found")


@router.get("/logout")
def logout_user():
    """
    Logs out the user by deleting the access token cookie.

    Returns:
        JSONResponse: A success message.
    """
    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"message": "Logged out successfully"},
    )
    response.delete_cookie("access_token")
    return response


@router.get("/posts/user/{user_id}")
async def get_user_posts(user_id: str):
    try:
        # Changed: Now using regno directly instead of converting to ObjectId
        posts = posts_collection.find({"user_id": user_id}).sort(
            "created_at", -1).to_list(length=None)  # Sort by newest first

        formatted_posts = []
        # print(posts)
        for post in posts:
            # Get comment count for this post
            comment_count = comments_collection.count_documents(
                {"post_id": post["_id"]})

            formatted_post = {
                "id": str(post["_id"]),
                "title": post["title"],
                "content": post["content"],
                "created_at": post["created_at"].isoformat(),
                "comments_count": comment_count,
                # Changed: No need to convert to string
                "user_id": post["user_id"]
            }
            formatted_posts.append(formatted_post)

        return formatted_posts
    except Exception as e:
        raise HTTPException(
            status_code=404, detail=f"Error fetching posts: {str(e)}")


@router.get("/comments/user/{user_id}")
async def get_user_comments(user_id: str):
    """Get all comments by a specific user with post titles"""
    try:
        comments = comments_collection.find({"user_id": user_id}).sort(
            "created_at", -1).to_list(length=None)
        print(comments)
        formatted_comments = []
        for comment in comments:
            # Convert ObjectId to string where needed
            formatted_comment = {
                "id": str(comment["_id"]),
                "user_id": comment["user_id"],
                "post_id": str(comment["post_id"]) if isinstance(comment["post_id"], ObjectId) else comment["post_id"],
                "content": comment["content"],
                "created_at": comment["created_at"].isoformat(),
                "post_title": "Unknown Post"  # Default value
            }

            # Try to get the post title
            try:
                if isinstance(comment["post_id"], ObjectId):
                    post = posts_collection.find_one(
                        {"_id": comment["post_id"]})
                else:
                    post = posts_collection.find_one(
                        {"_id": ObjectId(comment["post_id"])})
                if post:
                    formatted_comment["post_title"] = post["title"]
            except Exception as e:
                print(f"Error getting post title: {e}")
                formatted_comment["post_title"] = "Deleted Post"

            formatted_comments.append(formatted_comment)

        print("Formatted comments:", formatted_comments)
        return formatted_comments
    except Exception as e:
        print(f"Error in get_user_comments: {str(e)}")
        raise HTTPException(
            status_code=404, detail=f"Error fetching comments: {str(e)}")


@router.get("/{user_id}")
def get_user_by_id(user_id: str):
    try:
        # Convert string user_id to ObjectId
        user_id_obj = ObjectId(user_id)

        # Get user data
        user = users_collection.find_one({"_id": user_id_obj})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Changed: Use regno instead of ObjectId for counting posts and comments
        posts_count = db.posts.count_documents({"user_id": user["regno"]})
        comments_count = db.comments.count_documents({"user_id": user_id})

        print("Posts count:", posts_count)
        print("Comments count:", comments_count)
        # Format the response data
        user_data = {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "regno": user.get("regno", ""),
            "created_at": user["created_at"].isoformat() if "created_at" in user else datetime.utcnow().isoformat(),
            "posts": [str(post_id) for post_id in user.get("posts", [])],
            "comments": [str(comment_id) for comment_id in user.get("comments", [])],
            "clubs_participated": [str(club_id) for club_id in user.get("clubs_participated", [])],
            "clubs_administered": [str(club_id) for club_id in user.get("clubs_administered", [])],
            "uploaded_files": [str(file_id) for file_id in user.get("uploaded_files", [])],
            "posts_count": posts_count,
            "comments_count": comments_count
        }

        return user_data
    except Exception as e:
        print(f"Error in get_user_by_id: {str(e)}")  # Added debug print
        raise HTTPException(
            status_code=404, detail=f"Error fetching user: {str(e)}")


@router.get("/users/me")
def read_current_user(current_user: dict = Depends(get_current_user)):
    # Return realtime information for the current user.
    user = current_user.copy()
    user["created_at"] = user["created_at"].isoformat()
    user["lastLogin"] = user["lastLogin"].isoformat()
    return user


@router.get("/users/{user_id}")
def read_user(user_id: str):
    user = users_db.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_copy = user.copy()
    user_copy["created_at"] = user_copy["created_at"].isoformat()
    user_copy["lastLogin"] = user_copy["lastLogin"].isoformat()
    return user_copy
