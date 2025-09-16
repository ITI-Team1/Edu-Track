import api from './api';

export const fetchUsers = async () => {
  const res = await fetch(`${api.baseURL}/auth/users/`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل في جلب المستخدمين');
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.results ?? []);
};
/**
 * Get all permissions of a specific user by their groups
 */
export const fetchUserPermissions = async (user) => {
  if (!user?.groups?.length) return [];

  const res = await fetch(`${api.baseURL}/groups`, {
    headers: api.getAuthHeaders(),
  });
  if (!res.ok) throw new Error('فشل في جلب المجموعات');

  const allGroups = await res.json();

  // Filter groups the user belongs to
  const userGroups = allGroups.filter(group => user.groups.includes(group.id));

  // Combine all permissions from those groups
  const permissions = userGroups.flatMap(group => group.permissions);

  // Return just the permission names (or use p.codename if your API returns that)
  const permissionNames = permissions.map(p => p.name);

  return permissionNames;
};