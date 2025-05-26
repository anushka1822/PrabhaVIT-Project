# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
from dotenv import load_dotenv
import os
from fastapi.responses import JSONResponse

from src.routes.user import router as users_router
from src.routes.post import router as posts_router
from src.routes.comment import router as comment_router
from src.routes.file import router as file_router
from src.routes.course import router as course_router
from src.routes.club_chat import router as club_chat_router


# Load environment variables
load_dotenv()

# Get the PORT from the environment
PORT = int(os.getenv("PORT", 8000))

# Create the FastAPI app
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include routers
app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(comment_router, prefix="/api/v1")
app.include_router(file_router, prefix="/api/v1")
app.include_router(course_router, prefix="/api/v1")
app.include_router(club_chat_router, prefix="/api/v1")

# Add a global exception handler to log internal errors (for diagnostic purposes)
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Unhandled error: {exc}")  # Log error details to the console
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# Root endpoint
@app.get("/")
def root():
    return {"message": "Welcome to College Social Media!"}


# Run the server
if __name__ == "__main__":
    print(f"⚙️ Server is running on PORT: {PORT}")
    run(
        app="main:app",
        host="0.0.0.0",  # Allow external connections
        port=PORT,
        reload=True  # Enable auto-reload during development
    )
