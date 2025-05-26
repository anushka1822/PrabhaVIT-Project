# src/database.py
from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

# Create MongoDB client
client = MongoClient(MONGODB_URI)

# Get the database


def get_database():
    return client.get_database(DATABASE_NAME)
