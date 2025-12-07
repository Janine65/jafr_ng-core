# @syrius/core

Core library for Syrius Angular applications.

## Features

- 🔐 **Authentication & Authorization** - Keycloak integration with role-based access control
- 🎨 **Layout Components** - Reusable header, menu, footer, and loading components
- 🔄 **HTTP Interceptors** - Auth, error handling, logging, and mock interceptors
- 📊 **Services** - API, environment, preferences, and more
- 🛡️ **Guards** - Route guards for authentication and role-based access

## Installation

### For Development (Local Link)

```bash
# Clone the core library
git clone ssh://git@git.suvanet.ch:7999/scsyrius-tools/syr-ui-core.git

# Install dependencies
pnpm install

# Link globally
pnpm link --global

# In your app
cd /home/<USER>/repos/<ANGULAR APP>
pnpm link --global @syrius/core
```

### For Production (NPM Package)

```bash
pnpm install @syrius/core
```

## Usage

```typescript
// Import services
import { AuthService, RolesService, AppMessageService } from '@syrius/core';

// Import components
import { AppLayout, BackendErrorBannerComponent } from '@syrius/core';

// Import interceptors
import { errorInterceptor, authInterceptor } from '@syrius/core';
```

## Project Structure

```plaintext
src/
├── config/              # Configuration files (menu, etc.)
├── factories/           # Factory classes (logger)
├── guards/              # Route guards
├── interceptors/        # HTTP interceptors
├── interfaces/          # TypeScript interfaces
├── layout/              # Layout components
├── pipes/               # Angular pipes
├── services/            # Core services
└── index.ts             # Public API
```

## Development

```bash
# Install dependencies
pnpm install

# Build library
pnpm build

# Watch mode
pnpm build:watch

# Format code
pnpm format

# Lint code
pnpm lint
```

## Dependencies

This library requires the following peer dependencies:

- Angular 20+
- PrimeNG 20+
- ngx-translate 17+
- Keycloak Angular 19+
- RxJS 7+
- Tailwind CSS 3+
