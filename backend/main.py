from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import database
import models
import schemas
import ai_service

# Initialize Database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - V5.3 Final Pantry Intelligence")

# Explicit CORS Configuration for Mac M1 environment
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

# --- MEAL PLANNING & AUTO-DEDUCTION ---

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
    return db.query(models.MealPlan).all()

@app.delete("/meal-planner/{plan_id}")
def remove_from_planner(plan_id: int, db: Session = Depends(database.get_db)):
    plan_entry = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not plan_entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")
    db.delete(plan_entry)
    db.commit()
    return {"message": "Meal removed from planner"}

# NEW: Meal Completion Logic with Inventory Deduction
@app.post("/meal-planner/{plan_id}/complete")
def complete_meal(plan_id: int, db: Session = Depends(database.get_db)):
    """
    V5.3 Logic: Deduct ingredients from pantry and clear from planner.
    """
    plan_entry = db.query(models.MealPlan).filter(models.MealPlan.id == plan_id).first()
    if not plan_entry:
        raise HTTPException(status_code=404, detail="Plan entry not found")

    for dish_ing in plan_entry.dish.ingredients:
        pantry_item = db.query(models.PantryItem).filter(
            models.PantryItem.ingredient_id == dish_ing.ingredient_id
        ).first()
        
        if pantry_item:
            deduction = dish_ing.quantity
            # AI Unit Conversion if units don't match
            if pantry_item.unit.lower() != dish_ing.unit.lower():
                deduction = ai_service.get_unit_conversion(
                    dish_ing.ingredient.name, dish_ing.quantity, dish_ing.unit, pantry_item.unit
                )
            pantry_item.current_quantity = max(0, pantry_item.current_quantity - deduction)
    
    db.delete(plan_entry)
    db.commit()
    return {"status": "success", "message": "Pantry updated and meal marked as complete."}

# --- HEALTH INTELLIGENCE ---

@app.get("/health-stats/{date_str}")
def get_health_stats(date_str: str, db: Session = Depends(database.get_db)):
    planned_meals = db.query(models.MealPlan).filter(models.MealPlan.planned_date == date_str).all()
    actual_stats = {"calories": 0, "protein": 0, "carbs": 0, "fats": 0}
    
    for plan in planned_meals:
        nutr = plan.dish.nutrition
        if nutr:
            actual_stats["calories"] += int(nutr.get("calories", 0))
            actual_stats["protein"] += int(str(nutr.get("protein", "0")).replace('g', ''))
            actual_stats["carbs"] += int(str(nutr.get("carbs", "0")).replace('g', ''))
            actual_stats["fats"] += int(str(nutr.get("fats", "0")).replace('g', ''))
            
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
def recommend_meal(
    slot: str = Query("Dinner"), 
    db: Session = Depends(database.get_db)
):
    today_str = date.today().isoformat()
    health_data = get_health_stats(today_str, db)
    remaining = health_data["remaining_calories"]

    ingredients = db.query(models.Ingredient.name).join(
        models.DishIngredient, models.Ingredient.id == models.DishIngredient.ingredient_id
    ).join(
        models.MealPlan, models.DishIngredient.dish_id == models.MealPlan.dish_id
    ).distinct().all()
    
    ing_list = [i.name for i in ingredients]
    recommendation = ai_service.get_smart_recommendation(remaining, ing_list, slot)
    
    return {"recommendation": recommendation}

# --- DYNAMIC PANTRY & UNIFIED SHOPPING ---

@app.get("/pantry")
def get_pantry(db: Session = Depends(database.get_db)):
    items = db.query(models.PantryItem).all()
    return [{
        "id": item.id, 
        "name": item.ingredient.name, 
        "category": item.ingredient.category,
        "quantity": item.current_quantity, 
        "unit": item.unit, 
        "thumbnail_url": item.ingredient.thumbnail_url,
        "threshold": item.min_threshold,
        "expiry": item.expiry_date
    } for item in items]

@app.post("/pantry/purchase")
def update_pantry(item_name: str, quantity: float, unit: str, db: Session = Depends(database.get_db)):
    ing = db.query(models.Ingredient).filter(models.Ingredient.name.ilike(f"%{item_name}%")).first()
    if not ing: raise HTTPException(status_code=404, detail="Ingredient not found")
    
    pantry_item = db.query(models.PantryItem).filter(models.PantryItem.ingredient_id == ing.id).first()
    if pantry_item:
        pantry_item.current_quantity += quantity
    else:
        pantry_item = models.PantryItem(ingredient_id=ing.id, current_quantity=quantity, unit=unit)
        db.add(pantry_item)
    db.commit()
    return {"status": "Pantry Updated"}

# FIXED: Unified Shopping List (Gap Analysis + Safety Buffer)
@app.get("/shopping-list")
def get_shopping_list(db: Session = Depends(database.get_db)):
    """
    V5.3 ENHANCEMENT: AI-Driven Unified Shopping List.
    Resolves Join Error via explicit .select_from() and ON clauses.
    """
    # 1. Calculate Recipe-based requirements
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

    # 2. Get current pantry state
    pantry_items = db.query(models.PantryItem).all()
    pantry_map = {item.ingredient.name: item for item in pantry_items}
    
    shopping_dict = {}

    # Logic A: Recipe Gaps
    for need in recipe_needs:
        pantry_item = pantry_map.get(need.name)
        on_hand = 0
        if pantry_item:
            on_hand = pantry_item.current_quantity
            if pantry_item.unit.lower() != need.unit.lower():
                on_hand = ai_service.get_unit_conversion(
                    need.name, pantry_item.current_quantity, pantry_item.unit, need.unit
                )
        
        gap = max(0, need.gross_qty - on_hand)
        if gap > 0:
            shopping_dict[need.name] = {
                "name": need.name, 
                "quantity": round(gap, 2), 
                "unit": need.unit, 
                "reason": "Planned Meals"
            }

    # Logic B: Safety Buffers (Low Stock)
    for name, p_item in pantry_map.items():
        if p_item.current_quantity < p_item.min_threshold:
            shortfall = p_item.min_threshold - p_item.current_quantity
            if name in shopping_dict:
                shopping_dict[name]["quantity"] += round(shortfall, 2)
                shopping_dict[name]["reason"] += " + Safety Buffer"
            else:
                shopping_dict[name] = {
                    "name": name, 
                    "quantity": round(shortfall, 2), 
                    "unit": p_item.unit, 
                    "reason": "Low Stock Buffer"
                }

    return list(shopping_dict.values())

# --- EXPIRY ALERTS ---
@app.get("/pantry/expiry-alerts")
def get_expiry_alerts(db: Session = Depends(database.get_db)):
    today = date.today()
    upcoming = today + timedelta(days=3)
    expiring_soon = db.query(models.PantryItem).filter(models.PantryItem.expiry_date <= upcoming).all()
    return [{"item": i.ingredient.name, "expiry": i.expiry_date} for i in expiring_soon]