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

app = FastAPI(title="SmartKitchen OS - V5.1 Pantry Intelligence")

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

# --- MEAL PLANNING & REMOVAL ---

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

# --- NEW: DYNAMIC PANTRY & SMART SHOPPING (V5.3) ---

@app.get("/pantry")
def get_pantry(db: Session = Depends(database.get_db)):
    items = db.query(models.PantryItem).all()
    return [{
        "id": item.id, "name": item.ingredient.name, "category": item.ingredient.category,
        "quantity": item.current_quantity, "unit": item.unit, "thumbnail_url": item.ingredient.thumbnail_url
    } for item in items]

@app.post("/pantry/purchase")
def update_pantry(item_name: str, quantity: float, unit: str, db: Session = Depends(database.get_db)):
    # Partial matching to handle "Tomatoes" vs "Tomato"
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

@app.get("/shopping-list")
def get_shopping_list(db: Session = Depends(database.get_db)):
    """
    V5.3 ENHANCEMENT: AI-Driven Unit Normalization for Gap Analysis.
    """
    required = (
        db.query(
            models.Ingredient.name, models.Ingredient.category, models.Ingredient.thumbnail_url,
            func.sum(models.DishIngredient.quantity).label("gross_qty"), models.DishIngredient.unit
        )
        .join(models.DishIngredient).join(models.MealPlan).group_by(
            models.Ingredient.name, models.Ingredient.category, models.Ingredient.thumbnail_url, models.DishIngredient.unit
        ).all()
    )

    pantry_stock = db.query(models.PantryItem).all()
    stock_map = {item.ingredient.name: (item.current_quantity, item.unit) for item in pantry_stock}

    final_list = []
    for item in required:
        stock_data = stock_map.get(item.name)
        net_needed = item.gross_qty

        if stock_data:
            on_hand_qty, on_hand_unit = stock_data
            
            # Use AI for conversion if units mismatch
            if on_hand_unit.lower() != item.unit.lower():
                # Convert what we HAVE in pantry to the unit the RECIPE needs
                converted_stock = ai_service.get_unit_conversion(
                    item.name, on_hand_qty, on_hand_unit, item.unit
                )
                net_needed = max(0, item.gross_qty - converted_stock)
            else:
                net_needed = max(0, item.gross_qty - on_hand_qty)
        
        if net_needed > 0:
            final_list.append({
                "name": item.name, "category": item.category, "thumbnail_url": item.thumbnail_url,
                "quantity": round(net_needed, 2), "unit": item.unit
            })
    return final_list