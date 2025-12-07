import { Routes } from '@angular/router';
import { AccessDenied } from './status-page.access-denied';
import { Error } from './status-page.error';
import { Notfound } from './status-page.notfound';

export default [
    { path: '403', component: AccessDenied },
    { path: '404', component: Notfound },
    { path: '500', component: Error }
] as Routes;
