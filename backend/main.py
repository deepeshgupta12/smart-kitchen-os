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
        data = ai_service.extract_recipe_logic(text_input)
        new_dish = models.Dish(
            name=data.name,
            description=data.description,
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
                db_ing = models.Ingredient(name=ing.name, category=ing.category)
                db.add(db_ing)
                db.commit()
                db.refresh(db_ing)
            dish_ing = models.DishIngredient(dish_id=new_dish.id, ingredient_id=db_ing.id, quantity=ing.quantity, unit=ing.unit)
            db.add(dish_ing)
        db.commit()
        db.refresh(new_dish)
        return new_dish
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