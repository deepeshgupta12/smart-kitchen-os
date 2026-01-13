from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database
import models
import schemas
import ai_service

# Initialize Database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="SmartKitchen OS - AI Extractor")

# UPDATED: Explicit CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Healthy", "db_connected": True}

@app.post("/extract-recipe", response_model=schemas.RecipeSchema)
def extract_recipe(text_input: str, db: Session = Depends(database.get_db)):
    try:
        # 1. AI Extraction
        data = ai_service.extract_recipe_logic(text_input)
        
        # 2. Save Dish
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

        # 3. Save Ingredients
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
        return data

    except Exception as e:
        db.rollback()
        print(f"BACKEND ERROR: {str(e)}") # Critical for debugging
        raise HTTPException(status_code=500, detail=str(e))