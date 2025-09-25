import api from '../../services/api';

// Helper function to get auth headers - using the same pattern as main API service
const getAuthHeaders = () => {
  return api.getAuthHeaders();
};

export const surveyApi = {
  // List survey questions (GET /survey/)
  listQuestions: async () => {
    try {
      const response = await fetch(`${api.baseURL}/survey/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'فشل تحميل الأسئلة');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  },

  // Create a survey answer (POST /survey/answers/create/)
  createAnswer: async ({ lecture, question, student, rating }) => {
    try {
      const response = await fetch(`${api.baseURL}/survey/answers/create/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ lecture, question, student, rating })
      });
      
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        // Throw a structured error so toast.apiError can extract meaningful message
        const err = new Error(errorJson.detail || errorJson.error || 'فشل حفظ الإجابة');
        err.response = { data: errorJson };
        err.status = response.status;
        throw err;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating survey answer:', error);
      throw error;
    }
  },

  // List existing answers for a student and lecture
  listAnswers: async () => {
    try {
      const response = await fetch(`${api.baseURL}/survey/answers/`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'فشل تحميل الإجابات');
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : (data?.results || []);
    } catch (error) {
      console.error('Error fetching survey answers:', error);
      throw error;
    }
  }
};

export default surveyApi;
