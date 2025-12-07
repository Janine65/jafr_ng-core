import { Observable } from 'rxjs';

import { InternalRole } from '../interfaces/roles.interface';

/**
 * Interface for providing processed role mapping data to the core RolesService.
 * This allows applications to implement their own API endpoints, data processing,
 * and business logic while keeping the core service focused on business needs.
 *
 * The application is responsible for:
 * - Making API calls to their specific endpoints
 * - Processing raw API responses (parsing delimited strings, filtering, etc.)
 * - Converting to the standard InternalRole format
 */
export interface RoleDataProvider {
    /**
     * Fetch and process role mapping data from the application-specific source.
     * Should return processed InternalRole objects ready for business logic use.
     *
     * @returns Observable<InternalRole[]> - Processed role mapping data
     */
    fetchRoleMappings(): Observable<InternalRole[]>;
}

/**
 * Default implementation that provides basic fallback roles.
 * Applications should provide their own implementation.
 */
export class DefaultRoleDataProvider implements RoleDataProvider {
    fetchRoleMappings(): Observable<InternalRole[]> {
        // Minimal fallback - applications should override this
        return new Observable((subscriber) => {
            subscriber.next([
                {
                    name: 'admin',
                    displayName: 'Administrator',
                    description: 'Default admin role',
                    keycloakRoles: []
                }
            ]);
            subscriber.complete();
        });
    }
}
