import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import RecipeSchema

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_recipe_logic(input_text: str) -> RecipeSchema:
    """
    Parses raw text into our Locked Scope schema using LLM.
    """
    system_instruction = (
        "You are an AI Culinary Expert. Extract recipe data into the provided JSON schema. "
        "Categorize ingredients into aisles like Produce, Dairy, Meat, or Pantry. "
        "If nutritional values are missing, provide accurate culinary estimates."
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Extract the full dish details from: {input_text}"},
        ],
        response_format=RecipeSchema,
    )

    return response.choices[0].message.parsed