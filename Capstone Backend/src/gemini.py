# Test using GemininAPI
import google.generativeai as genai
import os
from dotenv import load_dotenv


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
os.environ["GRPC_VERBOSITY"] = "ERROR"
os.environ["GRPC_POLL_STRATEGY"] = "poll"

genai.configure(api_key=GEMINI_API_KEY)


def is_NSFW(message: str) -> str:
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
    )
    chat_session = model.start_chat()
    response = chat_session.send_message(f'''
                                        You are a moderation chatbot. Just reply in yes or no.
                                        You need to check the message:
                                        {message}

                                        No means it is okay and yes means it is NSFW.
                                        ''')
    # print(f"Messsage: {message} || Response: {response.text}")
    return response.text
