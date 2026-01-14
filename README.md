# 🍳 SmartKitchen OS: V6.1 Personalized Intelligence

**SmartKitchen OS** is an advanced, AI-powered culinary operating system designed to bridge the gap between nutritional goals, inventory management, and automated meal planning. By leveraging Large Language Models (LLMs) and a proactive data-driven backend, the system transforms the kitchen from a passive space into an intelligent health assistant.

## 📝 Problem Statement

In a fast-paced world, individuals struggle with three primary kitchen challenges: **Health Management** (tracking macros and calories manually is tedious), **Inventory Waste** (ingredients expire or are forgotten), and **Decision Fatigue** (deciding what to cook based on what is actually in the fridge). SmartKitchen OS solves these by automating inventory tracking, calculating nutritional needs based on physical metrics, and providing AI-driven meal recommendations.

---

## 🚀 Product Scope & Roadmap

### **Core Scope**

* **AI Recipe Extraction**: Converting raw text/images into structured, Michelin-star quality culinary data.
* **Proactive Pantry**: Real-time stock tracking with autonomous deduction upon meal completion.
* **Health Intelligence**: Dynamic BMR-based goal calculation and real-time consumption tracking.
* **Autonomous Replenishment**: Unified shopping lists that merge recipe requirements with safety stock buffers.

### **Version History**

| Version | Focus | Status |
| --- | --- | --- |
| **V1 - V3** | **Foundation** | ✅ Implemented |
| **V4** | **AI Core** | ✅ Implemented |
| **V5.3** | **Autonomous Pantry** | ✅ Implemented |
| **V6.1** | **Health Intelligence** | ✅ Implemented |
| **V7** | **Vision AI: "Scan the Dish"** | ⏳ Planned |
| **V8** | **Social & Collaborative** | ⏳ Planned |
| **V9** | **Polish & Persistence** | ⏳ Planned |

---

## 🛠 Implemented Features & Process Descriptions

### **1. AI-Driven Recipe Lifecycle (V4)**

The system uses **GPT-4o-mini** to parse unstructured text into high-fidelity JSON objects. This process includes generating professional preparation steps and realistic nutritional estimates. Each dish is then paired with a professional 4K image generated via **DALL-E 3**.

### **2. Autonomous Pantry Cycle (V5.3)**

Unlike traditional inventory apps, SmartKitchen OS features an **Autonomous Kitchen Cycle**. When a user marks a meal as "Complete" in the Frontend, the Backend iterates through the recipe's ingredients, performs AI-assisted unit conversion (e.g., pieces to grams), and deducts the exact amount from the `pantry_inventory` table.

### **3. Personalized Health Profiles (V6.1)**

V6 introduces the **Harris-Benedict Calculator**. The system no longer relies on static goals. Instead, it calculates Total Daily Energy Expenditure (TDEE) based on user-provided weight, height, age, and activity level. These goals are then dynamically compared against the day's planned meals in a visual dashboard.

---

## 💻 Core Code Snippets

### **The "Smart" Shopping List Logic**

This endpoint bridges three tables to ensure you never run out of essentials while planning for specific recipes.

```python
# main.py snippet
@app.get("/shopping-list")
def get_shopping_list(db: Session = Depends(database.get_db)):
    # Join Ingredient -> DishIngredient -> MealPlan
    recipe_needs = db.query(...).select_from(models.Ingredient).join(...).all()
    
    # Merge with Safety Buffers
    for name, item in pantry_map.items():
        if item.current_quantity < item.min_threshold:
            # Logic to add shortfall to the final list

```

### **Dynamic Goal Calculation**

```python
# main.py snippet
def calculate_nutritional_goals(user: models.UserProfile):
    bmr = 88.36 + (13.4 * user.weight_kg) + (4.8 * user.height_cm) - (5.7 * user.age)
    tdee = bmr * multipliers.get(user.activity_level, 1.2)
    return int(tdee), protein_g, carbs_g, fats_g

```

---

## ⚙️ Installation & Implementation Process

### **Prerequisites**

* **Python 3.10+** (Backend)
* **Next.js 14** (Frontend)
* **PostgreSQL** (Database)
* **OpenAI API Key** (Vision & Language services)

### **Backend Setup**

1. **Environment**: Create a `.env` file with your `DATABASE_URL` and `OPENAI_API_KEY`.
2. **Database Sync**: Run the provided migration scripts (`migrate_v5.py`, `migrate_v6.py`) to update the PostgreSQL schema with new columns like `min_threshold` and `activity_level`.
3. **Run**: Execute `uvicorn main:app --reload`.

### **Frontend Setup**

1. **Install Dependencies**: `npm install lucide-react axios`.
2. **Navigation**: Ensure `Navbar.tsx` is integrated into the primary layout to access the `/profile` route.
3. **Run**: Execute `npm run dev`.

---

## 📡 Terminal Command History

```bash
# Migration
python migrate_v5.py && python migrate_v6.py

# Launch
uvicorn main:app --reload

# Git Versioning
git add .
git commit -m "feat(v6.1): finalize health profiles and pantry auto-deduction"
git push origin main

```

---

**Would you like me to create the initial `vision_service.py` skeleton to begin our work on V7 - Vision AI?**
