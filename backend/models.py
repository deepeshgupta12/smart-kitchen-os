from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Table, JSON, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base

# Many-to-Many Link for Pairing Dishes
pairing_table = Table(
    'dish_pairings', Base.metadata,
    Column('dish_id', Integer, ForeignKey('dishes.id'), primary_key=True),
    Column('paired_dish_id', Integer, ForeignKey('dishes.id'), primary_key=True)
)

class Dish(Base):
    __tablename__ = "dishes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    thumbnail_url = Column(String, nullable=True)
    description = Column(Text)
    thumbnail_url = Column(String, nullable=True) # Now used for DALL-E URL
    cuisine = Column(String)
    meal_type = Column(String) # Breakfast, Lunch, Dinner
    prep_steps = Column(JSON) 
    nutrition = Column(JSON) 
    ingredients = relationship("DishIngredient", back_populates="dish")
    paired_with = relationship(
        "Dish", 
        secondary=pairing_table,
        primaryjoin=id==pairing_table.c.dish_id,
        secondaryjoin=id==pairing_table.c.paired_dish_id
    )

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    thumbnail_url = Column(String, nullable=True) # NEW: Image for the specific item
    category = Column(String) # Produce, Dairy, Pantry (Blinkit-style Aisle tagging)

class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    quantity = Column(Float)
    unit = Column(String)
    dish = relationship("Dish", back_populates="ingredients")
    ingredient = relationship("Ingredient")

# NEW: Meal Plan table for the 7-day Calendar
class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    planned_date = Column(Date) 
    meal_slot = Column(String) # Breakfast, Lunch, Dinner
    dish = relationship("Dish")

# NEW: Shopping List table for automated aggregation
class ShoppingListItem(Base):
    __tablename__ = "shopping_list"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    total_quantity = Column(Float)
    unit = Column(String)
    is_purchased = Column(Boolean, default=False)
    ingredient = relationship("Ingredient")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    daily_calorie_goal = Column(Integer, default=2000)
    # Using String to allow for 'g' suffix (e.g., "150g")
    daily_protein_goal = Column(String, default="150g")
    daily_carbs_goal = Column(String, default="250g")
    daily_fats_goal = Column(String, default="70g")