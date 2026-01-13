import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import RecipeSchema

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def extract_recipe_logic(input_text: str) -> RecipeSchema:
    """
    Refined logic to ensure descriptive, easy-to-read, and professional recipe content.
    """
    system_instruction = (
        "You are an expert Michelin-star Chef and Culinary Instructor. "
        "Your goal is to provide high-quality, professional recipe data. "
        "\n\nSTRICT GUIDELINES:"
        "\n1. PREPARATION STEPS: Must be descriptive and helpful. Don't just say 'Cook onions'. "
        "Instead, say 'Sauté the finely diced onions in warm oil for 8-10 minutes until they reach a deep golden-brown caramelization'. "
        "Break complex tasks into logical, easy-to-follow steps."
        "\n2. INGREDIENTS: Always include precise measurements (e.g., 250g instead of 'some')."
        "\n3. CONSISTENCY: Use standard culinary data for common dishes like Butter Chicken or Palak Paneer."
        "\n4. NUTRITION: Provide accurate macro estimates (Protein, Carbs, Fats) based on the ingredients list."
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Extract a professional-grade recipe for: {input_text}"},
        ],
        response_format=RecipeSchema,
    )

    return response.choices[0].message.parsed