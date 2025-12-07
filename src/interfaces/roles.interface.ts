export interface RoleMapping {
    role: string;
    routes: string[]; // e.g., ['/dashboard', '/admin/users']
    displayName?: string; // Human readable name for the role
    description?: string; // Description of what this role grants access to
}

export interface CachedRoleMappings {
    mappings: RoleMapping[];
    expiry: number; // Timestamp for when the cache expires
    cacheValidThru?: string; // Optional ISO timestamp from API meta for server-side invalidation
}

export interface EntitlementItem {
    id: number;
    application: string; // The application this entitlement is for
    role: string; // Keycloak role(s) - can contain 'or' separated roles
    operations: string; // CRUD operations
    bereich: string; // Specific area/module
    isActive: boolean;
}

export interface InternalRole {
    name: string; // e.g., 'aktenentscheid', 'fuv_offerte', 'kpm_tool', etc.
    displayName: string; // Human readable name
    description: string;
    keycloakRoles: string[]; // List of Keycloak roles that grant access to this app
}

export interface MenuItemRole {
    requiredRoles?: string[]; // Any of these roles grants access
    requiredAllRoles?: string[]; // All of these roles are required
    excludeRoles?: string[]; // These roles are explicitly denied access
}

export interface UserRole {
    name: string;
    displayName: string;
    description?: string;
    isActive: boolean;
    source: 'keycloak' | 'mock' | 'simulated';
}
