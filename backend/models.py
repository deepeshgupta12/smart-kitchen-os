from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Table, JSON
from sqlalchemy.orm import relationship
from database import Base  # Absolute import: No dot before 'database'

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
    thumbnail_url = Column(String)
    description = Column(Text)
    cuisine = Column(String)
    meal_type = Column(String) # Breakfast, Lunch, Dinner
    
    # JSON list for flexibility (Blinkit style: handles variable step counts)
    prep_steps = Column(JSON) 
    
    # Nutrition Breakup (calories, protein, carbs, fats)
    nutrition = Column(JSON) 

    # Relationships
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
    category = Column(String) # Produce, Dairy, Pantry

class DishIngredient(Base):
    __tablename__ = "dish_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    quantity = Column(Float)
    unit = Column(String)

    dish = relationship("Dish", back_populates="ingredients")
    ingredient = relationship("Ingredient")