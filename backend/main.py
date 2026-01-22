from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.orm import joinedload #
from datetime import date, timedelta
import database
import models
import schemas
import ai_service

# Initialize Database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - V5.3 Final Pantry Intelligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- RECIPE MANAGEMENT ---

@app.get("/recipes", response_model=list[schemas.RecipeResponse])
def get_all_recipes(db: Session = Depends(database.get_db)):
    dishes = db.query(models.Dish).options(
        joinedload(models.Dish.ingredients).joinedload(models.DishIngredient.ingredient)
    ).all()

    # Manually flattening for the response model
    return [
        {
            **dish.__dict__,
            "ingredients": [
                {
                    "name": ing.ingredient.name,
                    "quantity": ing.quantity,
                    "unit": ing.unit,
                    "category": ing.ingredient.category,
                    "thumbnail_url": ing.ingredient.thumbnail_url
                } for ing in dish.ingredients
            ]
        } for dish in dishes
    ]

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
        "thumbnail_url": recipe.thumbnail_url,
        "prep_steps": recipe.prep_steps,
        "nutrition": recipe.nutrition,
        "ingredients": [
            {
                "name": ing.ingredient.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "category": ing.ingredient.category,
                "thumbnail_url": ing.ingredient.thumbnail_url
            } for ing in recipe.ingredients
        ]
    }

@app.post("/extract-recipe", response_model=schemas.RecipeResponse)
def extract_recipe(text_input: str, db: Session = Depends(database.get_db)):
    """
    V6.5 CMS Logic: Local Persistence and API Cost Mitigation.
    """
    # 1. Look for the dish in the local CMS first
    existing_dish = db.query(models.Dish).filter(models.Dish.name.ilike(f"%{text_input}%")).first()
    
    if existing_dish:
        # Returns the cached version immediately
        return existing_dish

    # 2. Cache Miss: Execute AI Pipeline only for new discoveries
    try:
        data = ai_service.extract_recipe_logic(text_input)
        dish_image = ai_service.generate_professional_image(f"{data.cuisine} {data.name}")
        
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

        # 3. Persistent Mapping of Ingredients
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
        return new_dish
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/cms/recipes", response_model=list[schemas.RecipeResponse])
def get_cms_recipes(db: Session = Depends(database.get_db)):
    """
    V6.5 Enhancement: Returns flattened data for the CMS dashboard table.
    """
    dishes = db.query(models.Dish).options(
        joinedload(models.Dish.ingredients).joinedload(models.DishIngredient.ingredient)
    ).all()
    
    return [
        {
            **dish.__dict__,
            "ingredients": [
                {
                    "name": ing.ingredient.name,
                    "quantity": ing.quantity,
                    "unit": ing.unit,
                    "category": ing.ingredient.category,
                    "thumbnail_url": ing.ingredient.thumbnail_url
                } for ing in dish.ingredients
            ]
        } for dish in dishes
    ]

@app.get("/cms/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def get_cms_recipe_detail(recipe_id: int, db: Session = Depends(database.get_db)):
    """
    Fetches the complete persistent entity mapping for the Detail View.
    """
    recipe = db.query(models.Dish).options(
        joinedload(models.Dish.ingredients).joinedload(models.DishIngredient.ingredient)
    ).filter(models.Dish.id == recipe_id).first()
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Explicitly constructing the response to ensure ingredients list is populated
    return {
        "id": recipe.id,
        "name": recipe.name,
        "description": recipe.description,
        "cuisine": recipe.cuisine,
        "meal_type": recipe.meal_type,
        "thumbnail_url": recipe.thumbnail_url,
        "prep_steps": recipe.prep_steps,
        "nutrition": recipe.nutrition,
        "ingredients": [
            {
                "name": ing.ingredient.name,
                "quantity": ing.quantity,
                "unit": ing.unit,
                "category": ing.ingredient.category,
                "thumbnail_url": ing.ingredient.thumbnail_url
            } for ing in recipe.ingredients
        ]
    }

@app.put("/cms/recipes/{recipe_id}", response_model=schemas.RecipeResponse)
def update_cms_recipe(recipe_id: int, data: dict, db: Session = Depends(database.get_db)):
    """
    Manually update persistent dish entities. Changes are stored in DB 
    and reflected across the OS.
    """
    dish = db.query(models.Dish).filter(models.Dish.id == recipe_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Update basic fields and JSON entities (Nutrition, Prep Steps)
    for key in ["name", "description", "cuisine", "prep_steps", "nutrition"]:
        if key in data:
            setattr(dish, key, data[key])

    # Update Ingredients if provided
    if "ingredients" in data:
        # Clear existing mappings for this dish
        db.query(models.DishIngredient).filter(models.DishIngredient.dish_id == recipe_id).delete()
        
        for ing in data["ingredients"]:
            # Find or create ingredient entity
            db_ing = db.query(models.Ingredient).filter(models.Ingredient.name == ing["name"]).first()
            if not db_ing:
                db_ing = models.Ingredient(name=ing["name"], category=ing.get("category", "Pantry"))
                db.add(db_ing); db.commit(); db.refresh(db_ing)
            
            db.add(models.DishIngredient(
                dish_id=dish.id, 
                ingredient_id=db_ing.id, 
                quantity=ing["quantity"], 
                unit=ing["unit"]
            ))

    db.commit()
    db.refresh(dish)
    return dish

@app.post("/cms/recipes/{recipe_id}/regenerate")
def regenerate_dish_content(recipe_id: int, db: Session = Depends(database.get_db)):
    """
    Force-clears local data and hits OpenAI API again for fresh content.
    """
    dish = db.query(models.Dish).filter(models.Dish.id == recipe_id).first()
    if not dish:
        raise HTTPException(status_code=404, detail="Dish not found")
    
    dish_name = dish.name
    # Delete existing dish to trigger the logic in /extract-recipe
    db.delete(dish)
    db.commit()
    
    # Re-trigger extraction
    return extract_recipe(text_input=dish_name, db=db)

@app.post("/vision/scan")
async def scan_item(file: UploadFile = File(...), mode: str = "pantry", db: Session = Depends(database.get_db)):
    """
    V7 Entry Point: Processes uploaded images through the Vision AI layer.
    """
    image_data = await file.read()
    analysis = ai_service.analyze_image_vision(image_data, mode)
    
    if mode == "dish":
        # CMS Entity Matching: Find if this dish already exists in our persistent library
        dish_name = analysis.get("name")
        existing = db.query(models.Dish).filter(models.Dish.name.ilike(f"%{dish_name}%")).first()
        if existing:
            return {"status": "match_found", "dish": existing}
        
        # If new, trigger the CMS extraction logic
        return extract_recipe(text_input=dish_name, db=db)

    return {"status": "success", "items": analysis.get("items", [])}

# --- MEAL PLANNING & AUTO-DEDUCTION ---

@app.get("/meal-planner", response_model=list[schemas.MealPlanResponse])
def get_meal_plan(db: Session = Depends(database.get_db)):
    """Fetch the current meal plan."""
    return db.query(models.MealPlan).all()

@app.post("/meal-planner", response_model=schemas.MealPlanResponse)
def add_to_planner(plan: schemas.MealPlanCreate, db: Session = Depends(database.get_db)):
    """Add a dish to the planner."""
    new_entry = models.MealPlan(
        dish_id=plan.dish_id,
        planned_date=plan.planned_date,
        meal_slot=plan.meal_slot
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@app.delete("/meal-planner/{plan_id}")
def remove_from_planner(plan_id: int, db: Session = Depends(database.get_db)):
    """RESTORED: Endpoint to remove items from the planner UI."""
    plan_entry = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not plan_entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")
    db.delete(plan_entry)
    db.commit()
    return {"status": "success", "message": "Meal removed from planner"}

@app.post("/meal-planner/{plan_id}/complete")
def complete_meal(plan_id: int, db: Session = Depends(database.get_db)):
    """Mark meal as cooked and deduct ingredients from pantry."""
    plan_entry = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not plan_entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")

    for dish_ing in plan_entry.dish.ingredients:
        pantry_item = db.query(models.PantryItem).filter(
            models.PantryItem.ingredient_id == dish_ing.ingredient_id
        ).first()
        
        if pantry_item:
            deduction = dish_ing.quantity
            if pantry_item.unit.lower() != dish_ing.unit.lower():
                deduction = ai_service.get_unit_conversion(
                    dish_ing.ingredient.name, dish_ing.quantity, dish_ing.unit, pantry_item.unit
                )
            pantry_item.current_quantity = max(0, pantry_item.current_quantity - deduction)
    
    db.delete(plan_entry)
    db.commit()
    return {"status": "success", "message": "Pantry inventory updated."}

# --- HEALTH INTELLIGENCE ---

@app.get("/health-stats/{date_str}")
def get_health_stats(date_str: str, db: Session = Depends(database.get_db)):
    planned_meals = db.query(models.MealPlan).filter(models.MealPlan.planned_date == date_str).all()
    actual_stats = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    
    for plan in planned_meals:
        nutr = plan.dish.nutrition
        if nutr:
            actual_stats["calories"] += int(nutr.get("calories", 0))
            # Handle the 'g' suffix for actual values
            actual_stats["protein"] += int(str(nutr.get("protein", "0")).replace('g', ''))
            actual_stats["carbs"] += int(str(nutr.get("carbs", "0")).replace('g', ''))
            actual_stats["fats"] += int(str(nutr.get("fats", "0")).replace('g', ''))
            
    profile = db.query(models.UserProfile).first() or models.UserProfile()
    
    return {
        "date": date_str,
        "actual": actual_stats,
        "goals": {
            "calories": profile.daily_calorie_goal,
            "protein": profile.daily_protein_goal,
            "carbs": profile.daily_carbs_goal,
            "fats": profile.daily_fats_goal
        }
    }

@app.get("/recommend-me")
def recommend_meal(slot: str = Query("Dinner"), db: Session = Depends(database.get_db)):
    """RESTORED: AI recommendation logic to fix 404 on UI."""
    today_str = date.today().isoformat()
    health_data = get_health_stats(today_str, db)
    # Extract integer from calorie goals
    remaining = health_data["goals"].get("daily_calorie_goal", 2000) - health_data["actual"]["calories"]

    ingredients = db.query(models.Ingredient.name).select_from(models.Ingredient).join(
        models.DishIngredient, models.Ingredient.id == models.DishIngredient.ingredient_id
    ).join(
        models.MealPlan, models.DishIngredient.dish_id == models.MealPlan.dish_id
    ).distinct().all()
    
    ing_list = [i.name for i in ingredients]
    recommendation = ai_service.get_smart_recommendation(max(0, remaining), ing_list, slot)
    
    return {"recommendation": recommendation}

# --- DYNAMIC PANTRY & UNIFIED SHOPPING ---

@app.get("/pantry")
def get_pantry(db: Session = Depends(database.get_db)):
    items = db.query(models.PantryItem).all()
    return [{
        "id": item.id, "name": item.ingredient.name, 
        "quantity": item.current_quantity, "unit": item.unit, 
        "threshold": item.min_threshold, "expiry": item.expiry_date
    } for item in items]

@app.get("/shopping-list")
def get_shopping_list(db: Session = Depends(database.get_db)):
    """Unified logic combining recipe needs and safety buffers."""
    recipe_needs = (
        db.query(
            models.Ingredient.name.label("name"),
            models.Ingredient.category.label("category"),
            func.sum(models.DishIngredient.quantity).label("gross_qty"),
            models.DishIngredient.unit.label("unit")
        )
        .select_from(models.Ingredient)
        .join(models.DishIngredient, models.Ingredient.id == models.DishIngredient.ingredient_id)
        .join(models.MealPlan, models.DishIngredient.dish_id == models.MealPlan.dish_id)
        .group_by(models.Ingredient.name, models.Ingredient.category, models.DishIngredient.unit)
        .all()
    )

    pantry_items = db.query(models.PantryItem).all()
    pantry_map = {item.ingredient.name: item for item in pantry_items}
    shopping_dict = {}

    for need in recipe_needs:
        p_item = pantry_map.get(need.name)
        on_hand = 0
        if p_item:
            on_hand = p_item.current_quantity
            if p_item.unit.lower() != need.unit.lower():
                on_hand = ai_service.get_unit_conversion(need.name, on_hand, p_item.unit, need.unit)
        
        gap = max(0, need.gross_qty - on_hand)
        if gap > 0:
            shopping_dict[need.name] = {"name": need.name, "quantity": round(gap, 2), "unit": need.unit, "reason": "Planned Meals"}

    for name, item in pantry_map.items():
        if item.current_quantity < item.min_threshold:
            shortfall = item.min_threshold - item.current_quantity
            if name in shopping_dict:
                shopping_dict[name]["quantity"] += round(shortfall, 2)
                shopping_dict[name]["reason"] += " + Safety Buffer"
            else:
                shopping_dict[name] = {"name": name, "quantity": round(shortfall, 2), "unit": item.unit, "reason": "Low Stock"}

    return list(shopping_dict.values())

@app.get("/pantry/expiry-alerts")
def get_expiry_alerts(db: Session = Depends(database.get_db)):
    upcoming = date.today() + timedelta(days=3)
    expiring = db.query(models.PantryItem).filter(models.PantryItem.expiry_date <= upcoming).all()
    return [{"item": i.ingredient.name, "expiry": i.expiry_date} for i in expiring]

# --- NEW V6: PROFILE MANAGEMENT & CALCULATION ---

def calculate_nutritional_goals(user: models.UserProfile):
    """
    Harris-Benedict Equation for BMR + Activity Multiplier.
    """
    # Base BMR calculation
    if user.gender.lower() == "male":
        bmr = 88.36 + (13.4 * user.weight_kg) + (4.8 * user.height_cm) - (5.7 * user.age)
    else:
        bmr = 447.6 + (9.2 * user.weight_kg) + (3.1 * user.height_cm) - (4.3 * user.age)
    
    # Activity Multipliers
    multipliers = {
        "sedentary": 1.2, "light": 1.375, "moderate": 1.55, 
        "active": 1.725, "very_active": 1.9
    }
    tdee = bmr * multipliers.get(user.activity_level, 1.2)
    
    # Simple 40/30/30 Carb/Protein/Fat Split
    protein_g = (tdee * 0.30) / 4
    carbs_g = (tdee * 0.40) / 4
    fats_g = (tdee * 0.30) / 9
    
    return int(tdee), f"{int(protein_g)}g", f"{int(carbs_g)}g", f"{int(fats_g)}g"

@app.get("/profile")
def get_profile(db: Session = Depends(database.get_db)):
    profile = db.query(models.UserProfile).first()
    if not profile:
        profile = models.UserProfile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@app.put("/profile")
def update_profile(data: dict, db: Session = Depends(database.get_db)):
    profile = db.query(models.UserProfile).first()
    for key, value in data.items():
        if hasattr(profile, key):
            setattr(profile, key, value)
    
    # Recalculate goals based on new metrics
    cals, protein, carbs, fats = calculate_nutritional_goals(profile)
    profile.daily_calorie_goal = cals
    profile.daily_protein_goal = protein
    profile.daily_carbs_goal = carbs
    profile.daily_fats_goal = fats
    
    db.commit()
    return profile