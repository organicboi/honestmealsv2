// Role-based access control utilities
// Based on: docs/roles/rolesImplementation.md
// Uses table-based RBAC with JWT claims

export type UserRole = 'standard_user' | 'admin' | 'moderator' | 'trainer' | 'influencer';

export interface UserWithRoles {
  id: string;
  email: string;
  roles?: UserRole[];
  app_metadata?: {
    roles?: UserRole[];
  };
}

// Get user roles from JWT claims or app_metadata
export function getUserRoles(user: UserWithRoles | null): UserRole[] {
  if (!user) return [];
  
  // Prefer roles from app_metadata (JWT claims)
  if (user.app_metadata?.roles) {
    return user.app_metadata.roles;
  }
  
  // Fallback to direct roles property
  return user.roles || [];
}

// Check if user has required role
export function hasRole(user: UserWithRoles | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  const userRoles = getUserRoles(user);
  return userRoles.includes(requiredRole);
}

// Check if user has any of the required roles
export function hasAnyRole(user: UserWithRoles | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  const userRoles = getUserRoles(user);
  return requiredRoles.some(role => userRoles.includes(role));
}

// Check if user is admin
export function isAdmin(user: UserWithRoles | null): boolean {
  return hasRole(user, 'admin');
}

// Check if user is moderator or admin
export function isModerator(user: UserWithRoles | null): boolean {
  return hasAnyRole(user, ['moderator', 'admin']);
}

// Route protection configuration
export const roleRoutes: Record<UserRole, string[]> = {
  standard_user: ['/meals', '/orders', '/profile', '/health', '/workout'],
  admin: ['/admin', '/admin/users', '/admin/meals', '/admin/orders', '/admin/analytics'],
  moderator: ['/moderator', '/moderator/reviews', '/moderator/content'],
  trainer: ['/trainer', '/trainer/clients', '/trainer/plans', '/trainer/schedule'],
  influencer: ['/influencer', '/influencer/campaigns', '/influencer/analytics', '/influencer/content'],
};

// Get allowed routes for user (combines all their roles)
export function getAllowedRoutes(user: UserWithRoles | null): string[] {
  if (!user) return [];
  
  const userRoles = getUserRoles(user);
  const allowedRoutes = new Set<string>();
  
  // Add standard user routes by default
  roleRoutes.standard_user.forEach(route => allowedRoutes.add(route));
  
  // Add routes for each role the user has
  userRoles.forEach(role => {
    const routes = roleRoutes[role] || [];
    routes.forEach(route => allowedRoutes.add(route));
  });
  
  return Array.from(allowedRoutes);
}

// Check if route is allowed for user
export function canAccessRoute(user: UserWithRoles | null, pathname: string): boolean {
  if (!user) return false;
  
  // Admin can access everything
  if (isAdmin(user)) return true;
  
  const allowedRoutes = getAllowedRoutes(user);
  
  // Check if the pathname starts with any allowed route
  return allowedRoutes.some(route => pathname.startsWith(route));
}
