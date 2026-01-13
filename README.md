# 🍳 SmartKitchen OS: Technical Product Requirement Document (PRD)

### **Product Overview**

SmartKitchen OS is an AI-native ecosystem designed for high-precision meal planning and health optimization. Unlike generic recipe apps, it treats culinary data as a structured logistics problem—transforming raw text into actionable, visually-enriched data points for automated shopping and calorie tracking.

---

## **1. Core Functional Modules**

### **A. AI Recipe Rover (Extraction Engine)**

* **Mechanism:** Uses `gpt-4o-mini` with strict JSON-schema enforcement (via Pydantic) to parse unstructured text/URLs.
* **Enrichment:** Every extraction triggers a dual-stream OpenAI DALL-E 3 request to generate professional-grade imagery for both the **Dish** and individual **Ingredients**.
* **Aisle Tagging:** Automatically maps ingredients to categories (e.g., *Produce, Dairy, Pantry*) for a "Blinkit-style" sorted shopping experience.

### **B. Logistics & Aggregate Planning**

* **7-Day Grid:** A dynamic calendar allowing users to "Schedule" meals into Breakfast, Lunch, or Dinner slots.
* **Ingredient Aggregator:** A backend SQL logic that performs a `SUM()` on all required ingredients for the planned week, consolidating quantities (e.g., 250g + 100g = 350g) to streamline procurement.

### **C. Health Intelligence Layer**

* **Date-Specific Tracking:** A multi-date calorie tracker that calculates nutritional "Actual vs. Goal" based on the user's focus date in the UI.
* **Smart Gap-Filler (Recommendation Engine):** A context-aware engine that analyzes:
1. **Remaining Calorie Budget** (Actual vs. Goal).
2. **Current Ingredient Inventory** (Items already in the Shopping List).
3. **Meal Slot Constraint** (Breakfast vs. Lunch vs. Dinner).



---

## **2. Technical Specifications**

### **Database Schema (ERD Logic)**

| Table | Primary Responsibility |
| --- | --- |
| `dishes` | Stores recipe metadata, DALL-E image URLs, and nutritional JSON. |
| `ingredients` | Unique master list of items with Blinkit-style category tags. |
| `meal_plans` | The "Intent" table linking `dish_id` to a `planned_date` and `meal_slot`. |
| `user_profiles` | Stores personalized health targets (Default: 2000 kcal). |

### **API Endpoints**

* `POST /extract-recipe`: The AI data-parsing and image-generation entry point.
* `GET /health-stats/{date}`: Returns nutritional totals for a specific date.
* `GET /recommend-me`: Triggers the LLM "Gap-Filling" logic using current inventory context.
* `DELETE /meal-planner/{id}`: Safely removes a scheduled meal and updates the health bar.

---

## **3. Developer Setup Guide**

### **Prerequisites**

* Python 3.10+ & Node.js 18+
* Docker (for PostgreSQL)
* OpenAI API Key (with DALL-E 3 access)

### **Installation Sequence**

**1. Infrastructure**

```bash
# Spin up the PostgreSQL Database
docker-compose up -d

```

**2. Backend (FastAPI)**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary openai pydantic-settings python-dotenv
# Create .env with OPENAI_API_KEY=your_key_here
uvicorn main:app --reload

```

**3. Frontend (Next.js)**

```bash
cd frontend
npm install
npm run dev

```

---

## **4. Implementation Status (V1 - V4)**

* ✅ **Phase 1: Foundation** (Postgres + FastAPI + Next.js setup).
* ✅ **Phase 2: Data** (AI Extraction + DALL-E Image Generation).
* ✅ **Phase 3: Logistics** (7-Day Planner + Shopping List Aggregation).
* ✅ **Phase 4: Intelligence** (Health Tracker + Smart Recommendation Loop).
* 🚧 **Phase 5: Vision AI** (Reverse-engineering recipes from photos - *In Progress*).
