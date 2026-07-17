/**
 * useAuth — lightweight hook to access the current user's role.
 * Role is stored in localStorage alongside the JWT token.
 */
export function useAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'viewer';

  const isAdmin = role === 'admin';
  const isManager = role === 'manager' || role === 'analyst';
  const isViewer = role === 'viewer';

  /** Can the user create / edit operational records like Orders, Customers, Inventory? (admin + manager) */
  const canWriteOperations = isAdmin || isManager;

  /** Can the user create / edit products? (admin only) */
  const canWriteProducts = isAdmin;

  /** Can the user delete records? (admin only) */
  const canDelete = isAdmin;

  /** Can the user manage users & system settings? (admin only) */
  const canManageSystem = isAdmin;

  return { 
    token, role, isAdmin, isManager, isViewer, 
    canWriteOperations, canWriteProducts, canDelete, canManageSystem 
  };
}
