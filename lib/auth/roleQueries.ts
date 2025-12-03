// Database operations for user roles
// Based on: docs/roles/rolesImplementation.md

import { createClient } from '@/utils/supabase/server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import type { UserRole } from './roles';

interface Role {
  id: number;
  name: UserRole;
  created_at: string;
}

interface UserRoleMapping {
  user_id: string;
  role_id: number;
  roles: Role;
}

/**
 * Get all roles assigned to a user (Server Component)
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  if (!data) return [];

  return data
    .map((item: any) => item.roles?.name)
    .filter((name): name is UserRole => Boolean(name));
}

/**
 * Get all roles assigned to a user (Client Component)
 */
export async function getUserRolesClient(userId: string): Promise<UserRole[]> {
  const supabase = createBrowserClient();
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  if (!data) return [];

  return data
    .map((item: any) => item.roles?.name)
    .filter((name): name is UserRole => Boolean(name));
}

/**
 * Assign a role to a user (Admin only)
 */
export async function assignRoleToUser(userId: string, roleName: UserRole): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First, get the role ID
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleError || !roleData) {
    return { success: false, error: 'Role not found' };
  }

  // Assign the role to the user
  const { error: assignError } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleData.id,
    });

  if (assignError) {
    return { success: false, error: assignError.message };
  }

  return { success: true };
}

/**
 * Remove a role from a user (Admin only)
 */
export async function removeRoleFromUser(userId: string, roleName: UserRole): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // First, get the role ID
  const { data: roleData, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('name', roleName)
    .single();

  if (roleError || !roleData) {
    return { success: false, error: 'Role not found' };
  }

  // Remove the role from the user
  const { error: removeError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleData.id);

  if (removeError) {
    return { success: false, error: removeError.message };
  }

  return { success: true };
}

/**
 * Get all available roles in the system
 */
export async function getAllRoles(): Promise<Role[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if user has a specific role
 */
export async function userHasRole(userId: string, roleName: UserRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

/**
 * Check if user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  return userHasRole(userId, 'admin');
}

/**
 * Create a new role (Admin only)
 */
export async function createRole(roleName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('roles')
    .insert({ name: roleName });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
