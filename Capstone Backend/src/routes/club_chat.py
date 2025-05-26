from pymongo import MongoClient
from fastapi import APIRouter, HTTPException, status, Request, Depends, UploadFile, File
from fastapi import Form
from datetime import datetime
from typing import List
from pydantic import BaseModel
from bson import ObjectId
# Import ClubPostCreate and ClubPostResponse
from src.schemas import ClubCreate, ClubResponse, ClubPostCreate, ClubPostResponse
from src.auth import decode_jwt_token
from src.database import get_database
# Import Club model and PyObjectId
from src.models import Club, PyObjectId, ClubPost
import uuid
import boto3
import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

router = APIRouter(prefix=("/club-chat"), tags=["club-chat"])

db = get_database()
clubs_collection = db["clubs"]
user_collection = db['users']
club_posts_collection = db["club_posts"]


@router.post("/createclub", response_model=ClubResponse)
def create_club(
    request: Request,
    name: str = Form(...),
    description: str = Form(...),
    image: UploadFile = File(None)
):
    try:
        existing_club = clubs_collection.find_one({"name": name})
        access_token = request.cookies.get("access_token")
        if access_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token"
            )

        current_user = decode_jwt_token(access_token)
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token"
            )

        user = user_collection.find_one({"regno": current_user["regno"]})

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        created_by = str(user["_id"])

        if existing_club:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Club with that name already exists",
            )

        # Upload image to Cloudinary if provided
        image_url = None
        if image:
            try:
                upload_result = cloudinary.uploader.upload(
                    image.file, folder="club_images", resource_type="auto"
                )
                image_url = upload_result.get("secure_url")
            except Exception as upload_error:
                raise HTTPException(
                    status_code=500, detail="Image upload failed "+str(upload_error)
                )

        club_data = Club(
            name=name,
            description=description,
            created_by=created_by,
            admins=[created_by],
            image_url=image_url,
            members = [created_by],
        )

        club_data_dict = club_data.dict(by_alias=True)
        club_data_dict["created_at"] = datetime.utcnow()

        result = clubs_collection.insert_one(club_data_dict)
        created_club = clubs_collection.find_one({"_id": result.inserted_id})
        user['clubs_participated'] = user['clubs_participated'].append(created_club['_id'])
        user_collection.update_one(
        {"_id": user["_id"]},
        {"$push": {"clubs_participated": created_club["_id"]}})

        if created_club:
            res = {
                "id": str(created_club["_id"]),
                "name": created_club["name"],
                "description": created_club["description"],
                "created_at": created_club["created_at"],
                "created_by": str(created_club["created_by"]),
                "members": [],
                "faculty_advisor": [],
                "admins": [str(admin_id) for admin_id in created_club["admins"]],
                "image_url": created_club["image_url"],
            }
            return res
        else:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve created club from database."
            )

    except HTTPException as http_exception:
        raise http_exception
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/{club_id}/createpost", response_model=ClubPostResponse)
def create_club_post(club_id: str, post: ClubPostCreate, request: Request):
    try:
        access_token = request.cookies.get("access_token")
        if access_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")

        current_user = decode_jwt_token(access_token)
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")

        user = user_collection.find_one({"regno": current_user["regno"]})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        club = clubs_collection.find_one({"_id": ObjectId(club_id)})
        if club is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Club not found")

        # Verify if the user is an admin of the club
        if str(user["_id"]) not in [str(admin_id) for admin_id in club["admins"]]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="User is not an admin of this club")

        # Create the club post
        club_post_data = ClubPost(
            club_id=club_id,
            user_id=str(user["_id"]),  # Use ObjectId for user_id
            title=post.title,
            content=post.content,
        )
        club_post_data_dict = club_post_data.dict(by_alias=True)
        club_post_data_dict["created_at"] = datetime.utcnow()
        club_post_data_dict["updated_at"] = datetime.utcnow()

        result = club_posts_collection.insert_one(club_post_data_dict)
        created_club_post = club_posts_collection.find_one(
            {"_id": result.inserted_id})

        if created_club_post:
            res = {
                "id": str(created_club_post["_id"]),
                "club_id": str(created_club_post["club_id"]),
                "user_id": str(created_club_post["user_id"]),
                "title": created_club_post["title"],
                "content": created_club_post["content"],
                "created_at": created_club_post["created_at"],
                "updated_at": created_club_post["updated_at"],
            }
            return res
        else:
            raise HTTPException(
                status_code=500, detail="Failed to retrieve created club post from database.")

    except HTTPException as http_exception:
        raise http_exception
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from bson.errors import InvalidId

@router.get("/{club_id}/posts", response_model=List[ClubPostResponse])
def get_club_posts(club_id: str):
    try:
        # First validate the club exists
        club = clubs_collection.find_one({"_id": ObjectId(club_id)})
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
            
        # Query posts from club_posts_collection instead of posts_collection
        posts = list(club_posts_collection.find({"club_id": ObjectId(club_id)}))
        
        # Format the response
        formatted_posts = []
        for post in posts:
            formatted_post = {
                "id": str(post["_id"]),
                "club_id": str(post["club_id"]),
                "user_id": str(post["user_id"]),
                "title": post["title"],
                "content": post["content"],
                "created_at": post["created_at"],
                "updated_at": post.get("updated_at", post["created_at"])
            }
            formatted_posts.append(formatted_post)
            
        return formatted_posts
        
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid club ID format")
    except Exception as e:
        print(f"Error in get_club_posts: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{user_id}/clubs", response_model=List[ClubResponse])
def get_user_clubs(user_id: str):
    from bson import ObjectId  # Ensure ObjectId is imported
    user = user_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    clubs_ids = list(set(user.get("clubs_participated", []) + user.get("clubs_administered", [])))
    clubs = list(clubs_collection.find({"_id": {"$in": clubs_ids}}))
    
    result = []
    for club in clubs:
        club["id"] = str(club["_id"])
        club["created_by"] = str(club["created_by"])  # Convert created_by to string
        club["members"] = [str(member) for member in club.get("members", [])]  # Convert members to string
        club["admins"] = [str(admin) for admin in club.get("admins", [])]  # Convert admins to string
        result.append(club)

    return result


# Create a Pydantic model for join actions (approve/decline)
class JoinAction(BaseModel):
    user_id: str

# Add this class with the other models at the top
class MakeAdminAction(BaseModel):
    user_id: str

@router.post("/{club_id}/make-admin")
def make_club_admin(club_id: str, action: MakeAdminAction, request: Request):
    # Validate access token
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    
    # Get admin user making the request
    admin_user = user_collection.find_one({"regno": current_user["regno"]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get the club
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")

    # Verify the requesting user is an admin
    if str(admin_user["_id"]) not in [str(aid) for aid in club.get("admins", [])]:
        raise HTTPException(status_code=403, detail="Only administrators can make other users admin")

    target_user_id = action.user_id

    # Verify target user exists
    target_user = user_collection.find_one({"_id": ObjectId(target_user_id)})
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # Verify target user is a member of the club
    if str(target_user["_id"]) not in [str(mid) for mid in club.get("members", [])]:
        raise HTTPException(status_code=400, detail="User must be a club member to be made admin")

    # Check if user is already an admin
    if str(target_user["_id"]) in [str(aid) for aid in club.get("admins", [])]:
        raise HTTPException(status_code=400, detail="User is already an admin")

    # Add user to admins list
    clubs_collection.update_one(
        {"_id": club["_id"]}, 
        {"$push": {"admins": ObjectId(target_user_id)}}
    )

    # Add club to user's administered clubs
    user_collection.update_one(
        {"_id": ObjectId(target_user_id)}, 
        {"$push": {"clubs_administered": club["_id"]}}
    )

    return {"message": "User successfully made club admin"}

@router.post("/{club_id}/join")
def join_club(club_id: str, request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    user = user_collection.find_one({"regno": current_user["regno"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    user_id_str = str(user["_id"])
    if user_id_str in [str(mid) for mid in club.get("members", [])]:
        raise HTTPException(status_code=400, detail="Already a member of the club")
    if user_id_str in [str(pid) for pid in club.get("pending_requests", [])]:
        raise HTTPException(status_code=400, detail="Join request already pending")
    clubs_collection.update_one({"_id": club["_id"]}, {"$push": {"pending_requests": ObjectId(user_id_str)}})
    return {"message": "Join request submitted successfully"}

@router.get("/{club_id}/pending")
def get_pending_requests(club_id: str, request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    admin_user = user_collection.find_one({"regno": current_user["regno"]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="User not found")
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    print(admin_user["_id"])
    print(club.get("admins", []))
    if str(admin_user["_id"]) not in [str(aid) for aid in club.get("admins", [])]:
        raise HTTPException(status_code=403, detail="Only administrators can view pending requests")
    pending = club.get("pending_requests", [])
    pending_list = []
    for uid in pending:
        pending_user = user_collection.find_one({"_id": uid})
        if pending_user:
            pending_list.append({
                "id": str(pending_user["_id"]),
                "name": pending_user.get("name", ""),
                "regno": pending_user.get("regno", "")
            })
    return pending_list

@router.post("/{club_id}/approve")
def approve_request(club_id: str, action: JoinAction, request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    admin_user = user_collection.find_one({"regno": current_user["regno"]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="User not found")
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if str(admin_user["_id"]) not in [str(aid) for aid in club.get("admins", [])]:
        raise HTTPException(status_code=403, detail="Only administrators can approve join requests")
    join_user_id = action.user_id
    if join_user_id not in [str(pid) for pid in club.get("pending_requests", [])]:
        raise HTTPException(status_code=400, detail="User join request is not pending")
    join_user = user_collection.find_one({"_id": ObjectId(join_user_id)})
    clubs_collection.update_one({"_id": club["_id"]}, {"$pull": {"pending_requests": ObjectId(join_user_id)}})
    clubs_collection.update_one({"_id": club["_id"]}, {"$push": {"members": ObjectId(join_user_id)}})
    user_collection.update_one({"_id": ObjectId(join_user_id)}, {"$push": {"clubs_participated": club["_id"]}})
    return {"message": "User approved and added to club members"}

@router.post("/{club_id}/decline")
def decline_request(club_id: str, action: JoinAction, request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    admin_user = user_collection.find_one({"regno": current_user["regno"]})
    if not admin_user:
        raise HTTPException(status_code=404, detail="User not found")
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    if str(admin_user["_id"]) not in [str(aid) for aid in club.get("admins", [])]:
        raise HTTPException(status_code=403, detail="Only administrators can decline join requests")
    join_user_id = action.user_id
    if join_user_id not in [str(pid) for pid in club.get("pending_requests", [])]:
        raise HTTPException(status_code=400, detail="User join request is not pending")
    clubs_collection.update_one({"_id": club["_id"]}, {"$pull": {"pending_requests": ObjectId(join_user_id)}})
    return {"message": "User join request declined"}

@router.get("/clubs/all", response_model=List[ClubResponse])
def get_all_clubs():
    try:
        clubs = list(clubs_collection.find())
        result = []
        for club in clubs:
            club_data = {
                "id": str(club["_id"]),
                "name": club["name"],
                "description": club["description"],
                "created_at": club["created_at"],
                "created_by": str(club["created_by"]),
                "members": [str(m) for m in club.get("members", [])],
                "faculty_advisor": [str(f) for f in club.get("faculty_advisor", [])],
                "admins": [str(admin) for admin in club.get("admins", [])],
                "image_url": club.get("image_url")
            }
            result.append(club_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{club_id}/details", response_model=ClubResponse)
def get_club_details(club_id: str):
    from bson.errors import InvalidId
    try:
        club = clubs_collection.find_one({"_id": ObjectId(club_id)})
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        club["id"] = str(club["_id"])
        club["created_by"] = str(club["created_by"])
        club["members"] = [str(m) for m in club.get("members", [])]
        club["admins"] = [str(a) for a in club.get("admins", [])]
        club["faculty_advisor"] = [str(f) for f in club.get("faculty_advisor", [])]
        return club
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid club ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{club_id}/participants")
def get_participants(club_id: str, request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    current_user = decode_jwt_token(access_token)
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    club = clubs_collection.find_one({"_id": ObjectId(club_id)})
    if not club:
        raise HTTPException(status_code=404, detail="Club not found")
    participants = []
    for uid in club.get("members", []):
        # Exclude members who are already admins
        if str(uid) not in [str(a) for a in club.get("admins", [])]:
            pending_user = user_collection.find_one({"_id": ObjectId(uid)})
            if pending_user:
                participants.append({
                    "id": str(pending_user["_id"]),
                    "name": pending_user.get("name", ""),
                    "regno": pending_user.get("regno", "")
                })
    return participants
