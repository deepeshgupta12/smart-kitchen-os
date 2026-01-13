import axios from 'axios';

const api = axios.create({
  // Use 127.0.0.1 specifically for Mac M1 stability
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  }
});

export const extractRecipe = async (input: string) => {
  console.log("Sending extraction request for:", input);
  try {
    const response = await api.post(`/extract-recipe?text_input=${encodeURIComponent(input)}`);
    console.log("Backend Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Axios Extraction Error:", error);
    throw error;
  }
};

export default api;