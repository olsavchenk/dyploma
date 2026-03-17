# Shared Module

This module contains reusable components, directives, pipes, and utilities that are used across multiple features.

## Structure

```
shared/
├── components/     # Reusable UI components
├── directives/     # Custom directives
├── pipes/          # Custom pipes
├── utils/          # Utility functions
└── index.ts        # Public API
```

## Usage

Import shared components and utilities from the shared module barrel export:

```typescript
import { SomeSharedComponent } from '@app/shared';
```
