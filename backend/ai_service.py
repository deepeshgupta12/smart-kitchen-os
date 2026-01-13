import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import RecipeSchema

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_professional_food_image(subject: str):
    """
    Generates imagery following OpenAI Official DALL-E 3 Documentation.
    """
    try:
        # Prompt engineering for professional culinary photography
        detailed_prompt = (
            f"Hyper-realistic professional food photography of {subject}. "
            "High-end restaurant plating, soft natural lighting, shallow depth of field, "
            "vibrant colors, 4k resolution, appetizing, neutral background."
        )

        response = client.images.generate(
            model="dall-e-3", # Official DALL-E 3 model
            prompt=detailed_prompt,
            size="1024x1024", # Standard square resolution
            quality="standard", # Options: standard or hd
            n=1,
        )
        
        # The URL is valid for 60 minutes per OpenAI docs
        return response.data[0].url
    except Exception as e:
        print(f"OpenAI Image Error: {str(e)}")
        return None

def extract_recipe_logic(input_text: str) -> RecipeSchema:
    """
    Expert-level prompt to ensure descriptive, high-quality recipe content.
    """
    system_instruction = (
        "You are an expert Michelin-star Chef and Culinary Instructor. "
        "Your goal is to provide high-quality, professional recipe data in a structured format."
        "\n\nSTRICT CONTENT REQUIREMENTS:"
        "\n1. PREPARATION STEPS: Do not provide short, one-sentence steps. "
        "Each step must be descriptive, including sensory details (smell, color, texture) and professional techniques. "
        "Example: Instead of 'Cook onions', use 'Sauté the finely diced onions over medium heat for 12-15 minutes, stirring occasionally until they achieve a deep mahogany caramelization and sweet aroma.'"
        "\n2. INGREDIENTS: Use precise measurements (grams, ml, or standard kitchen units like 'tablespoon')."
        "\n3. MEAL TYPE: Always specify if it is suitable for Breakfast, Lunch, or Dinner. Do not leave this empty."
        "\n4. NUTRITION: Provide realistic culinary estimates for calories and macros based on the ingredients."
    )

    response = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Create a professional, descriptive recipe for: {input_text}"},
        ],
        response_format=RecipeSchema,
    )

    return response.choices[0].message.parsed