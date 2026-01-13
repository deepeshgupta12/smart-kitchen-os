import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

export const extractRecipe = async (input: string) => {
  // We use params because the backend expects a query string 'text_input'
  const response = await api.post(`/extract-recipe?text_input=${encodeURIComponent(input)}`);
  return response.data;
};

export default api;