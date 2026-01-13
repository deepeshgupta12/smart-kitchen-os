import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

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

// NEW: Meal Planner Endpoints
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

export const getShoppingList = async () => {
  const response = await api.get('/shopping-list');
  return response.data;
};

export default api;