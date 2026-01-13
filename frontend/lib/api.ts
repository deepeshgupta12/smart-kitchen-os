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

export default api;