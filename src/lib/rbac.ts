import { UserRole } from '@/types/auth'

export const PERMISSIONS = {
  // Lead permissions
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_UPDATE: 'leads.update',
  LEADS_DELETE: 'leads.delete',
  LEADS_ASSIGN: 'leads.assign',
  LEADS_EXPORT: 'leads.export',

  // User permissions
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Task permissions
  TASKS_VIEW: 'tasks.view',
  TASKS_CREATE: 'tasks.create',
  TASKS_UPDATE: 'tasks.update',
  TASKS_DELETE: 'tasks.delete',
  TASKS_ASSIGN: 'tasks.assign',

  // Opportunity permissions
  OPPORTUNITIES_VIEW: 'opportunities.view',
  OPPORTUNITIES_CREATE: 'opportunities.create',
  OPPORTUNITIES_EDIT: 'opportunities.edit',
  OPPORTUNITIES_DELETE: 'opportunities.delete',
  OPPORTUNITIES_ASSIGN: 'opportunities.assign',

  // Analytics permissions
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  ANALYTICS_MANAGE: 'analytics.manage',

  // System permissions
  SYSTEM_ADMIN: 'system.admin',
  AUDIT_VIEW: 'audit.view',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // Admin has all permissions
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_UPDATE,
    PERMISSIONS.LEADS_DELETE,
    PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.OPPORTUNITIES_VIEW,
    PERMISSIONS.OPPORTUNITIES_CREATE,
    PERMISSIONS.OPPORTUNITIES_EDIT,
    PERMISSIONS.OPPORTUNITIES_DELETE,
    PERMISSIONS.OPPORTUNITIES_ASSIGN,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_MANAGE,
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.AUDIT_VIEW,
  ],
  MANAGER: [
    // Manager can do most things except user management and system admin
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_UPDATE,
    PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.USERS_VIEW, // Can view users but not manage them
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.TASKS_DELETE,
    PERMISSIONS.TASKS_ASSIGN,
    PERMISSIONS.OPPORTUNITIES_VIEW,
    PERMISSIONS.OPPORTUNITIES_CREATE,
    PERMISSIONS.OPPORTUNITIES_EDIT,
    PERMISSIONS.OPPORTUNITIES_ASSIGN,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.ANALYTICS_MANAGE,
  ],
  SALES: [
    // Sales can view and update leads, manage their own tasks and opportunities
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_UPDATE, // Can update leads assigned to them
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_CREATE,
    PERMISSIONS.TASKS_UPDATE,
    PERMISSIONS.OPPORTUNITIES_VIEW,
    PERMISSIONS.OPPORTUNITIES_CREATE,
    PERMISSIONS.OPPORTUNITIES_EDIT,
    PERMISSIONS.ANALYTICS_VIEW, // Can view basic analytics
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission))
}

export function getUserPermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole]
}

export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Define route permissions
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [PERMISSIONS.LEADS_VIEW],
    '/admin/leads': [PERMISSIONS.LEADS_VIEW],
    '/admin/leads/create': [PERMISSIONS.LEADS_CREATE],
    '/admin/leads/kanban': [PERMISSIONS.LEADS_VIEW],
    '/admin/tasks': [PERMISSIONS.TASKS_VIEW],
    '/admin/users': [PERMISSIONS.USERS_VIEW],
    '/admin/analytics': [PERMISSIONS.ANALYTICS_VIEW],
    '/admin/bi': [PERMISSIONS.ANALYTICS_VIEW],
    '/admin/audit': [PERMISSIONS.AUDIT_VIEW],
    '/admin/settings': [PERMISSIONS.SYSTEM_ADMIN],
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) {
    // If route is not defined, allow access by default
    return true
  }

  return hasAnyPermission(userRole, requiredPermissions)
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  SALES: 'Vendas',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Acesso completo ao sistema, incluindo gestão de usuários e configurações',
  MANAGER: 'Acesso à gestão de leads, tarefas e relatórios. Pode atribuir leads e visualizar analytics',
  SALES: 'Acesso aos leads atribuídos, tarefas próprias e relatórios básicos',
}