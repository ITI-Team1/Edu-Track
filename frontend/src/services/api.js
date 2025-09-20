const API_BASE_URL = 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Initiate password reset
  async requestPasswordReset(email) {
    const resp = await fetch(`${this.baseURL}/auth/users/reset_password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(this.translateError(data?.detail || data?.email || 'فشل إرسال رابط الاستعادة'));
    }
    return true;
  }

  // Activate account (Djoser)
  async activateAccount({ uid, token }) {
    const resp = await fetch(`${this.baseURL}/auth/users/activation/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(this.translateError(data?.detail || data?.token || 'تعذر تفعيل الحساب'));
    }
    return true;
  }

  // Confirm password reset
  async confirmPasswordReset({ uid, token, new_password, re_new_password }) {
    const resp = await fetch(`${this.baseURL}/auth/users/reset_password_confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, new_password, re_new_password })
    });
    if (!resp.ok) {
      const data = await resp.json().catch(() => ({}));
      throw new Error(this.translateError(data?.detail || data?.token || data?.new_password || 'تعذر إعادة التعيين'));
    }
    return true;
  }

  // Helper method to get auth headers
  // getAuthHeaders() {
  //   const token = localStorage.getItem('access_token');
  //   return {
  //     'Content-Type': 'application/json',
  //     ...(token && { 'Authorization': `Bearer ${token}` })
  //   };
  // }
// Helper method to get auth headers
getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('access_token');
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}





  // Login user
  async login(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/jwt/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = this.translateError(errorData.detail || errorData.non_field_errors || 'Login failed');
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('خطأ في الاتصال بالسيرفر. تأكد من تشغيل السيرفر');
      }
      throw error;
    }
  }

  // Register user
  async register(userData) {
  try {
      const response = await fetch(`${this.baseURL}/auth/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'فشل إنشاء الحساب';
        
        // Handle field-specific errors
        if (errorData.username) {
          errorMessage = this.translateError(errorData.username[0]);
        } else if (errorData.email) {
          errorMessage = this.translateError(errorData.email[0]);
        } else if (errorData.password) {
          errorMessage = this.translateError(errorData.password[0]);
        } else if (errorData.non_field_errors) {
          errorMessage = this.translateError(errorData.non_field_errors[0]);
        } else if (errorData.detail) {
          errorMessage = this.translateError(errorData.detail);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('خطأ في الاتصال بالسيرفر. تأكد من تشغيل السيرفر');
      }
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/users/me/?t=${Date.now()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('فشل في الحصول على بيانات المستخدم');
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('خطأ في الاتصال بالسيرفر. تأكد من تشغيل السيرفر');
      }
      throw error;
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }

  // Translate error messages to Arabic
  translateError(errorMessage) {
    const errorTranslations = {
      'No active account found with the given credentials': 'لم يتم العثور على حساب نشط بالبيانات المقدمة',
      'Unable to log in with provided credentials': 'لا يمكن تسجيل الدخول بالبيانات المقدمة',
      'This field is required': 'هذا الحقل مطلوب',
      'A user with that username already exists': 'يوجد مستخدم بهذا الاسم بالفعل',
      'This password is too short. It must contain at least 8 characters': 'كلمة المرور قصيرة جداً. يجب أن تحتوي على 8 أحرف على الأقل',
      'This password is too common': 'كلمة المرور شائعة جداً',
      'This password is entirely numeric': 'كلمة المرور رقمية بالكامل',
      'The two password fields didn\'t match': 'حقول كلمة المرور غير متطابقة',
      'Enter a valid email address': 'أدخل عنوان بريد إلكتروني صحيح',
      'This email address is already in use': 'عنوان البريد الإلكتروني مستخدم بالفعل',
      'Login failed': 'فشل تسجيل الدخول',
      'Registration failed': 'فشل إنشاء الحساب',
      'Network error': 'خطأ في الشبكة',
      'Server error': 'خطأ في السيرفر',
      'username': 'اسم المستخدم',
      'password': 'كلمة المرور',
      'email': 'البريد الإلكتروني',
      'first_name': 'الاسم الأول',
      'last_name': 'اسم العائلة',
      're_password': 'تأكيد كلمة المرور',
      'This password is too short. It must contain at least 8 characters.': 'كلمة المرور قصيرة جداً. يجب أن تحتوي على 8 أحرف على الأقل',
      'This password is too common.': 'كلمة المرور شائعة جداً',
      'This password is entirely numeric.': 'كلمة المرور رقمية بالكامل',
      'The two password fields didn\'t match.': 'حقول كلمة المرور غير متطابقة',
      'Enter a valid email address.': 'أدخل عنوان بريد إلكتروني صحيح',
      'This email address is already in use.': 'عنوان البريد الإلكتروني مستخدم بالفعل',
      'A user with that username already exists.': 'يوجد مستخدم بهذا الاسم بالفعل',
      'This field may not be blank.': 'هذا الحقل لا يمكن أن يكون فارغاً',
      'This field is required.': 'هذا الحقل مطلوب'
    };

    // Check for exact match first
    if (errorTranslations[errorMessage]) {
      return errorTranslations[errorMessage];
    }

    // Check for partial matches
    for (const [english, arabic] of Object.entries(errorTranslations)) {
      if (errorMessage.includes(english)) {
        return arabic;
      }
    }

    // If no translation found, return the original message
    return errorMessage;
  }
}

export default new ApiService(); 