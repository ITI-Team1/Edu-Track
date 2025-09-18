import api from '../../services/api';

export const surveyApi = {
  // Submit survey data
  submitSurvey: async (surveyData) => {
    try {
      const response = await api.post('/surveys/', surveyData);
      return response.data;
    } catch (error) {
      console.error('Error submitting survey:', error);
      throw error;
    }
  },

  // Get survey questions (if needed for dynamic loading)
  getSurveyQuestions: async () => {
    try {
      const response = await api.get('/surveys/questions/');
      return response.data;
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  },

  // Get survey statistics (for admin dashboard)
  getSurveyStats: async () => {
    try {
      const response = await api.get('/surveys/stats/');
      return response.data;
    } catch (error) {
      console.error('Error fetching survey stats:', error);
      throw error;
    }
  },

  // Get survey responses (for admin dashboard)
  getSurveyResponses: async (params = {}) => {
    try {
      const response = await api.get('/surveys/responses/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      throw error;
    }
  }
};

export default surveyApi;
