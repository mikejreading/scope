import { useContext } from 'react';
import { TenantContext } from './tenant-context';

export const useTenant = () => {
  const context = useContext(TenantContext);
  
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

// Helper hook to check if user has specific permissions
export const useHasPermission = (requiredPermission: string): boolean => {
  const { permissions } = useTenant();
  return permissions.includes(requiredPermission);
};

// Helper hook to check if user has any of the specified permissions
export const useHasAnyPermission = (requiredPermissions: string[]): boolean => {
  const { permissions } = useTenant();
  return requiredPermissions.some(permission => permissions.includes(permission));
};

// Helper hook to check if user has all of the specified permissions
export const useHasAllPermissions = (requiredPermissions: string[]): boolean => {
  const { permissions } = useTenant();
  return requiredPermissions.every(permission => permissions.includes(permission));
};
