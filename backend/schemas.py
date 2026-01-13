from pydantic import BaseModel
from typing import List, Optional

class IngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    category: Optional[str] = "Pantry" # Blinkit-style aisle tagging

class NutritionSchema(BaseModel):
    calories: int
    protein: str
    carbs: str
    fats: str

class RecipeSchema(BaseModel):
    name: str
    description: str
    thumbnail_url: Optional[str] = None
    cuisine: str
    suitable_for: List[str] # ["Breakfast", "Lunch"]
    ingredients: List[IngredientSchema]
    prep_steps: List[str]
    nutrition: NutritionSchema
    suggested_pairings: List[str] # Dishes this goes well with