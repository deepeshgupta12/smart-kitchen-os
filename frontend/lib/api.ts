import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

// Recipe & Extraction
export const extractRecipe = async (input: string) => {
  const response = await api.post(`/extract-recipe?text_input=${encodeURIComponent(input)}`);
  return response.data;
};

export const getAllRecipes = async () => {
  const response = await api.get('/recipes');
  return response.data;
};

export const getRecipeById = async (id: string) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data;
};

// Meal Planner
export const getMealPlan = async () => {
  const response = await api.get('/meal-planner');
  return response.data;
};

export const addToPlan = async (dishId: number, date: string, slot: string) => {
  const response = await api.post('/meal-planner', {
    dish_id: dishId,
    planned_date: date,
    meal_slot: slot
  });
  return response.data;
};

export const deleteMealPlanEntry = async (planId: number) => {
  const response = await api.delete(`/meal-planner/${planId}`);
  return response.data;
};

// Health & Recommendations
export const getHealthStats = async (dateStr: string) => {
  const response = await api.get(`/health-stats/${dateStr}`);
  return response.data;
};

export const getSmartRecommendation = async (slot: string) => {
   const response = await api.get(`/recommend-me?slot=${slot}`);
   return response.data;
};

// --- NEW: PANTRY ENDPOINTS (V5.2) ---

export const getPantryInventory = async () => {
  const response = await api.get('/pantry');
  return response.data;
};

export const addToPantry = async (itemName: string, quantity: number, unit: string) => {
  const response = await api.post(`/pantry/purchase?item_name=${encodeURIComponent(itemName)}&quantity=${quantity}&unit=${unit}`);
  return response.data;
};

// Shopping List (Now Smart)
export const getShoppingList = async () => {
  const response = await api.get('/shopping-list');
  return response.data;
};

export default api;