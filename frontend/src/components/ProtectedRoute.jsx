import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Enhanced ProtectedRoute component with permission checking
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children to render if authorized
 * @param {Array<string>|string} props.allowedRoles - Array of allowed role names or single role
 * @param {Array<number>|number} props.allowedGroups - Array of allowed group IDs or single group ID
 * @param {boolean} props.requiresInstructor - Whether route requires instructor privileges
 * @param {boolean} props.requiresAdmin - Whether route requires admin privileges
 * @param {string} props.fallbackPath - Path to redirect to if access denied (default: '/dashboard')
 */
function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  allowedGroups = [], 
  requiresInstructor = false,
  requiresAdmin = false,
  fallbackPath = '/dashboard'
}) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login with return path
  if (!isAuthenticated) {
    const returnPath = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${returnPath}`} replace />;
  }

  // If authenticated but no additional checks needed, allow access
  if (!allowedRoles.length && !allowedGroups.length && !requiresInstructor && !requiresAdmin) {
    return children;
  }

  // Helper function to check if user has required role
  const hasRole = (roles) => {
    if (!roles || !user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has any of the required roles
    const userRoles = user.roles || [];
    return roleArray.some(role => userRoles.includes(role));
  };

  // Helper function to check if user belongs to required group
  const hasGroup = (groups) => {
    if (!groups || !user) return false;
    const groupArray = Array.isArray(groups) ? groups : [groups];
    
    // Check user groups (assuming groups come as array of objects or IDs)
    const userGroups = user.groups || [];
    const userGroupIds = userGroups.map(group => 
      typeof group === 'object' ? group.id : group
    );
    
    return groupArray.some(groupId => userGroupIds.includes(groupId));
  };

  // Helper function to check instructor privileges
  const isInstructor = () => {
    if (!user) return false;
    
    // Check if user belongs to instructor group (ID 3 based on your request)
    if (hasGroup([3])) return true;
    
    // Check if user has instructor-related role
    if (hasRole(['instructor', 'teacher', 'professor'])) return true;
    
    // Check if user is staff (fallback)
    return user.is_staff || false;
  };

  // Helper function to check admin privileges
  const isAdmin = () => {
    if (!user) return false;
    return user.is_superuser || user.is_staff || false;
  };

  // Perform authorization checks
  let hasAccess = true;

  // Check role-based access
  if (allowedRoles.length > 0) {
    hasAccess = hasAccess && hasRole(allowedRoles);
  }

  // Check group-based access
  if (allowedGroups.length > 0) {
    hasAccess = hasAccess && hasGroup(allowedGroups);
  }

  // Check instructor requirement
  if (requiresInstructor) {
    hasAccess = hasAccess && isInstructor();
  }

  // Check admin requirement
  if (requiresAdmin) {
    hasAccess = hasAccess && isAdmin();
  }

  // If access denied, show unauthorized message or redirect
  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح بالوصول</h2>
          <p className="text-gray-600 mb-6">
            عذراً، لا تملك الصلاحيات المطلوبة للوصول إلى هذه الصفحة.
            <br />
            هذه الصفحة مخصصة لمجموعة أذونات معينة.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              العودة للصفحة السابقة
            </button>
            <Navigate to={fallbackPath} replace />
          </div>
          
          {/* Debug info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-left">
              <p><strong>Debug Info:</strong></p>
              <p>User Groups: {JSON.stringify(user?.groups || [])}</p>
              <p>Required Groups: {JSON.stringify(allowedGroups)}</p>
              <p>Is Staff: {String(user?.is_staff || false)}</p>
              <p>Is Superuser: {String(user?.is_superuser || false)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute; 