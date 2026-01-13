from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import database
import models
import schemas
import ai_service

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - V3.1 Planning")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recipes", response_model=list[schemas.RecipeResponse])
def get_all_recipes(db: Session = Depends(database.get_db)):
    return db.query(models.Dish).all()

@app.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: int, db: Session = Depends(database.get_db)):
    recipe = db.query(models.Dish).filter(models.Dish.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {
        "id": recipe.id,
        "name": recipe.name,
        "description": recipe.description,
        "cuisine": recipe.cuisine,
        "meal_type": recipe.meal_type,
        "prep_steps": recipe.prep_steps,
        "nutrition": recipe.nutrition,
        "ingredients": [
            {
                "name": ing.ingredient.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "category": ing.ingredient.category
            } for ing in recipe.ingredients
        ]
    }

@app.post("/extract-recipe", response_model=schemas.RecipeResponse)
def extract_recipe(text_input: str, db: Session = Depends(database.get_db)):
    try:
        # 1. AI Text Extraction
        data = ai_service.extract_recipe_logic(text_input)
        
        # 2. Generate Dish Image (DALL-E 3)
        dish_image = ai_service.generate_professional_image(f"{data.cuisine} {data.name}")
        
        # 3. Create Dish
        new_dish = models.Dish(
            name=data.name,
            description=data.description,
            thumbnail_url=dish_image, 
            cuisine=data.cuisine,
            meal_type=", ".join(data.suitable_for) if data.suitable_for else "Meal",
            prep_steps=data.prep_steps,
            nutrition=data.nutrition.dict()
        )
        db.add(new_dish)
        db.commit()
        db.refresh(new_dish)

        # 4. Save Ingredients & Generate Images
        for ing in data.ingredients:
            db_ing = db.query(models.Ingredient).filter(models.Ingredient.name == ing.name).first()
            if not db_ing:
                ing_image = ai_service.generate_professional_image(f"fresh raw {ing.name}")
                db_ing = models.Ingredient(name=ing.name, category=ing.category, thumbnail_url=ing_image)
                db.add(db_ing)
                db.commit()
                db.refresh(db_ing)
            
            dish_ing = models.DishIngredient(
                dish_id=new_dish.id, 
                ingredient_id=db_ing.id, 
                quantity=ing.quantity, 
                unit=ing.unit
            )
            db.add(dish_ing)
        
        db.commit()
        db.refresh(new_dish)
        return new_dish # This now includes the thumbnail_url thanks to schemas.py
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# NEW: Meal Planning Endpoints
@app.post("/meal-planner", response_model=schemas.MealPlanResponse)
def add_to_planner(plan: schemas.MealPlanCreate, db: Session = Depends(database.get_db)):
    new_entry = models.MealPlan(
        dish_id=plan.dish_id,
        planned_date=plan.planned_date,
        meal_slot=plan.meal_slot
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@app.get("/meal-planner", response_model=list[schemas.MealPlanResponse])
def get_meal_plan(db: Session = Depends(database.get_db)):
    # Returns all planned meals
    return db.query(models.MealPlan).all()

@app.get("/shopping-list")
def get_shopping_list(db: Session = Depends(database.get_db)):
    """
    Aggregates all ingredients for all meals currently in the MealPlan.
    Groups by ingredient name and unit to sum up quantities.
    """
    # 1. Fetch current week's ingredients
    # We join DishIngredient to MealPlan via dish_id
    # Then join Ingredient to get the Name and Category
    items = (
        db.query(
            models.Ingredient.name,
            models.Ingredient.category,
            func.sum(models.DishIngredient.quantity).label("total_quantity"),
            models.DishIngredient.unit
        )
        .join(models.DishIngredient, models.Ingredient.id == models.DishIngredient.ingredient_id)
        .join(models.MealPlan, models.DishIngredient.dish_id == models.MealPlan.dish_id)
        .group_by(models.Ingredient.name, models.Ingredient.category, models.DishIngredient.unit)
        .all()
    )

    # Convert to list of dictionaries for frontend
    shopping_list = [
        {
            "name": item.name,
            "category": item.category,
            "quantity": round(item.total_quantity, 2),
            "unit": item.unit
        } for item in items
    ]
    
    return shopping_list

@app.get("/health-stats/{date_str}")
def get_health_stats(date_str: str, db: Session = Depends(database.get_db)):
    """
    Calculates total nutritional intake for a specific date 
    and returns a 'Goal vs. Actual' comparison.
    """
    # 1. Fetch all planned meals for the requested date
    planned_meals = db.query(models.MealPlan).filter(
        models.MealPlan.planned_date == date_str
    ).all()
    
    actual_stats = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    
    # 2. Sum up the nutrition from each dish
    for plan in planned_meals:
        nutr = plan.dish.nutrition
        if nutr:
            actual_stats["calories"] += nutr.get("calories", 0)
            # Helper to strip 'g' and convert to int for summing
            actual_stats["protein"] += int(nutr.get("protein", "0").replace('g', ''))
            actual_stats["carbs"] += int(nutr.get("carbs", "0").replace('g', ''))
            actual_stats["fats"] += int(nutr.get("fats", "0").replace('g', ''))
            
    # 3. Get User Goals (Assuming a single user profile for now)
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile()
        db.add(profile)
        db.commit()

    return {
        "date": date_str,
        "actual": actual_stats,
        "goals": {
            "calories": profile.daily_calorie_goal,
            "protein": profile.daily_protein_goal,
            "carbs": profile.daily_carbs_goal,
            "fats": profile.daily_fats_goal
        },
        "remaining_calories": max(0, profile.daily_calorie_goal - actual_stats["calories"])
    }

@app.get("/recommend-me")
def recommend_meal(db: Session = Depends(database.get_db)):
    # 1. Get Remaining Calories for today
    today_str = date.today().isoformat()
    health_data = get_health_stats(today_str, db)
    remaining = health_data["remaining_calories"]

    # 2. Get current ingredients in the shopping list
    ingredients = db.query(models.Ingredient.name).join(
        models.DishIngredient, models.Ingredient.id == models.DishIngredient.ingredient_id
    ).join(
        models.MealPlan, models.DishIngredient.dish_id == models.MealPlan.dish_id
    ).distinct().all()
    
    ing_list = [i.name for i in ingredients]

    # 3. Get AI Recommendation
    recommendation = ai_service.get_smart_recommendation(remaining, ing_list)
    
    return {"recommendation": recommendation}