import os
from openai import OpenAI
from dotenv import load_dotenv
from schemas import RecipeSchema
import base64

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_professional_image(prompt: str):
    """
    Generates imagery following OpenAI Official DALL-E 3 Documentation.
    """
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"Professional high-end food photography of {prompt}, cinematic lighting, 4k, appetizing, neutral background.",
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return response.data[0].url
    except Exception as e:
        print(f"OpenAI Image Error: {e}")
        return None
    
def analyze_image_vision(image_bytes: bytes, mode: str = "pantry") -> dict:
    """
    V7 Vision Logic: Analyzes images of ingredients or prepared dishes.
    """
    base64_image = base64.b64encode(image_bytes).decode('utf-8')
    
    prompts = {
        "pantry": "Identify all raw food ingredients in this image. For each, suggest a likely quantity and unit. Return a JSON list of objects with 'name', 'quantity', and 'unit'.",
        "dish": "Identify the prepared cooked dish in this image. Return a single JSON object with 'name' and 'cuisine'."
    }

    response = client.chat.completions.create(
        model="gpt-4o", # Using full gpt-4o for high-fidelity vision
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompts.get(mode, prompts["pantry"])},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ],
            }
        ],
        response_format={"type": "json_object"} # Forcing structured vision output
    )
    
    import json
    return json.loads(response.choices[0].message.content)

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

# NEW: The Smart Recommendation Logic
def get_smart_recommendation(remaining_cal: int, existing_ingredients: list, slot: str):
    """
    AI-driven gap-filling logic based on nutritional needs, inventory, and specific meal slot.
    """
    prompt = (
        f"The user has {remaining_cal} calories remaining today and wants a {slot} recommendation. "
        f"Their current shopping list includes: {', '.join(existing_ingredients)}. "
        f"Recommend a single dish name suitable for {slot} that fits within the calorie limit. "
        "Format the response exactly as 'Dish Name: 1-sentence culinary reason why'."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a health-focused culinary advisor."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"AI Recommendation Error: {e}")
        return f"Light {slot} Salad: To keep you refreshed and within your calorie goals."
    
def get_unit_conversion(ingredient_name: str, quantity: float, from_unit: str, to_unit: str) -> float:
    """
    Uses AI to dynamically convert non-standard units (pcs, bunches) to standard ones (grams/ml).
    Example: "3 pieces of tomatoes" -> "300 grams"
    """
    prompt = (
        f"In the context of cooking, convert {quantity} {from_unit} of {ingredient_name} to {to_unit}. "
        f"Return ONLY the numerical value as a float. If you cannot convert, return the original quantity."
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        # Extract only the number from the response
        result = response.choices[0].message.content.strip()
        return float(''.join(c for c in result if c.isdigit() or c == '.'))
    except Exception:
        return quantity # Fallback to original if AI fails