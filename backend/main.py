from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import database
import models
import schemas
import ai_service

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - Version 1.3")

@app.post("/extract-recipe", response_model=schemas.RecipeSchema)
def extract_recipe(text_input: str, db: Session = Depends(database.get_db)):
    try:
        # 1. AI Extraction (Capturing all fields from Locked Scope)
        data = ai_service.extract_recipe_logic(text_input)
        
        # 2. Save Dish to Database
        new_dish = models.Dish(
            name=data.name,
            description=data.description,
            thumbnail_url=data.thumbnail_url,
            cuisine=data.cuisine,
            meal_type=", ".join(data.suitable_for),
            prep_steps=data.prep_steps,
            nutrition=data.nutrition.dict()
        )
        db.add(new_dish)
        db.commit()
        db.refresh(new_dish)

        # 3. Save & Map Ingredients (Blinkit-inspired mapping)
        for ing in data.ingredients:
            # Check if ingredient exists in master registry
            db_ing = db.query(models.Ingredient).filter(models.Ingredient.name == ing.name).first()
            if not db_ing:
                db_ing = models.Ingredient(name=ing.name, category=ing.category)
                db.add(db_ing)
                db.commit()
                db.refresh(db_ing)
            
            # Link ingredient to the dish with specific quantity/unit
            dish_ing = models.DishIngredient(
                dish_id=new_dish.id,
                ingredient_id=db_ing.id,
                quantity=ing.quantity,
                unit=ing.unit
            )
            db.add(dish_ing)
        
        db.commit()
        return data

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))