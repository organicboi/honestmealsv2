// Role-based access control utilities for future use

export type UserRole = 'user' | 'admin' | 'trainer' | 'gymFranchise' | 'influencer';

export interface UserWithRole {
  id: string;
  email: string;
  role?: UserRole;
  permissions?: string[];
}

// Check if user has required role
export function hasRole(user: UserWithRole | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  return user.role === requiredRole || user.role === 'admin'; // Admin has access to everything
}

// Check if user has any of the required roles
export function hasAnyRole(user: UserWithRole | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role as UserRole) || user.role === 'admin';
}

// Check if user has specific permission
export function hasPermission(user: UserWithRole | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions?.includes(permission) || user.role === 'admin';
}

// Route protection configuration
export const roleRoutes: Record<UserRole, string[]> = {
  user: ['/meals', '/cart', '/orders', '/profile'],
  admin: ['/admin', '/admin/users', '/admin/meals', '/admin/orders', '/admin/analytics'],
  trainer: ['/trainer', '/trainer/clients', '/trainer/plans', '/trainer/schedule'],
  gymFranchise: ['/gym', '/gym/members', '/gym/trainers', '/gym/billing'],
  influencer: ['/influencer', '/influencer/campaigns', '/influencer/analytics', '/influencer/content'],
};

// Get allowed routes for a role
export function getAllowedRoutes(role: UserRole): string[] {
  return roleRoutes[role] || roleRoutes.user;
}

// Check if route is allowed for user
export function canAccessRoute(user: UserWithRole | null, pathname: string): boolean {
  if (!user) return false;
  
  const userRole = user.role || 'user';
  const allowedRoutes = getAllowedRoutes(userRole);
  
  // Admin can access everything
  if (userRole === 'admin') return true;
  
  // Check if the pathname starts with any allowed route
  return allowedRoutes.some(route => pathname.startsWith(route));
}
