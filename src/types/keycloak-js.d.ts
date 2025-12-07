declare module 'keycloak-js' {
    // Minimal type shims to allow library compilation without pulling full types
    const Keycloak: any;
    export default Keycloak;
    export type KeycloakProfile = any;
    export type KeycloakTokenParsed = any;
    export type KeycloakConfig = any;
    export type KeycloakLoginOptions = any;
    export type KeycloakError = any;
}
