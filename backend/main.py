from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database
import models
import schemas
import ai_service

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - V2.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/recipes")
def get_all_recipes(db: Session = Depends(database.get_db)):
    # Returns a list of all dishes for the dashboard
    return db.query(models.Dish).all()

@app.get("/recipes/{recipe_id}")
def get_recipe(recipe_id: int, db: Session = Depends(database.get_db)):
    # Joins the ingredients for the detail view
    recipe = db.query(models.Dish).filter(models.Dish.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Manually building the response to include ingredients
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

@app.post("/extract-recipe")
def extract_recipe(text_input: str, db: Session = Depends(database.get_db)):
    try:
        data = ai_service.extract_recipe_logic(text_input)
        new_dish = models.Dish(
            name=data.name,
            description=data.description,
            cuisine=data.cuisine,
            meal_type=", ".join(data.suitable_for),
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
            
            dish_ing = models.DishIngredient(
                dish_id=new_dish.id,
                ingredient_id=db_ing.id,
                quantity=ing.quantity,
                unit=ing.unit
            )
            db.add(dish_ing)
        
        db.commit()
        return new_dish
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))