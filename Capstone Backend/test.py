import openai
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client
MODERATION_API_KEY = os.getenv("MODERATION_API_KEY")
openai.api_key = MODERATION_API_KEY

ai = openai.OpenAI(
    api_key=MODERATION_API_KEY
)

res = ai.moderations.create(
    model='text-moderation-latest',
    input="this is a test"
)

print(res)

# response = openai.Moderation.create(
#     input="Your post content here"
# )

# # Inspect the response to see which categories are flagged.
# print(response)
