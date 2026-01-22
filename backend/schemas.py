from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class IngredientSchema(BaseModel):
    name: str
    quantity: float
    unit: str
    category: Optional[str] = "Pantry"
    thumbnail_url: Optional[str] = None # Added here

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
    suitable_for: List[str]
    ingredients: List[IngredientSchema]
    prep_steps: List[str]
    nutrition: NutritionSchema
    suggested_pairings: List[str]

class RecipeResponse(BaseModel):
    id: int
    name: str
    description: str
    cuisine: Optional[str] = "Global"
    meal_type: Optional[str] = "Meal"
    nutrition: Optional[dict] = None
    thumbnail_url: Optional[str] = None # CRITICAL: Ensure this exists
    prep_steps: List[str] = []  # Ensure this is included
    ingredients: List[IngredientSchema] = [] # Ensure this is included
    
    class Config:
        from_attributes = True

class VisionIngredient(BaseModel):
    name: str
    quantity: float
    unit: str

class VisionAnalysisResponse(BaseModel):
    status: str
    items: Optional[List[VisionIngredient]] = None
    dish: Optional[RecipeResponse] = None # For CMS matches

# NEW: Schemas for Meal Planning
class MealPlanCreate(BaseModel):
    dish_id: int
    planned_date: date
    meal_slot: str

class MealPlanResponse(BaseModel):
    id: int
    dish: RecipeResponse
    planned_date: date
    meal_slot: str

    class Config:
        from_attributes = True