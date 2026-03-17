# Authentication Pages - US-028 Implementation

## Overview
This folder contains all authentication-related UI components for the Stride application, implementing US-028 acceptance criteria.

## Components

### 1. Login Component (`/auth/login`)
**Location:** `login/login.component.ts`

**Features:**
- Email and password fields with validation
- Password visibility toggle
- "Forgot password?" link to `/auth/forgot-password`
- Google login button (placeholder for future implementation)
- Loading states during authentication
- Error handling with user-friendly messages
- Redirect to appropriate dashboard based on user role

**Validation Rules:**
- Email: Required, valid email format
- Password: Required, minimum 8 characters

### 2. Register Component (`/auth/register`)
**Location:** `register/register.component.ts`

**Features:**
- Display name, email, password, and confirm password fields
- Password strength requirements (8+ chars, uppercase, lowercase, digits)
- Password visibility toggles
- GDPR consent checkbox (required)
- Links to Privacy Policy and Terms of Use
- Google registration button (placeholder)
- Loading states during registration
- Error handling with server validation messages
- Auto-navigation to role selection after successful registration

**Validation Rules:**
- Display Name: Required, 2-50 characters
- Email: Required, valid email format
- Password: Required, min 8 chars, pattern: uppercase + lowercase + digits
- Confirm Password: Required, must match password
- GDPR Consent: Required (must be checked)

### 3. Select Role Component (`/auth/select-role`)
**Location:** `select-role/select-role.component.ts`

**Features:**
- Two interactive cards: Student and Teacher
- Visual selection indicator
- Role-specific icons and descriptions
- Confirmation button (disabled until role selected)
- Loading state during role submission
- Auto-navigation to appropriate dashboard after selection

**Role Options:**
- **Student** (Учень): For learners who want to develop skills
- **Teacher** (Вчитель): For educators managing classes

### 4. Forgot Password Component (`/auth/forgot-password`)
**Location:** `forgot-password/forgot-password.component.ts`

**Features:**
- Email input for password reset request
- Success message (shown for security even if email doesn't exist)
- Loading state during submission
- Back to login link
- Form reset after submission

## Routing

**File:** `auth.routes.ts`

```typescript
/auth/login           -> LoginComponent
/auth/register        -> RegisterComponent
/auth/select-role     -> SelectRoleComponent
/auth/forgot-password -> ForgotPasswordComponent
/auth                 -> Redirects to /auth/login
```

## Design & Styling

### Theme
- Gradient background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- Primary color: `#667eea`
- Accent color: `#764ba2`

### Components Used
- Angular Material Cards
- Angular Material Form Fields (Outline appearance)
- Angular Material Buttons (Raised for primary actions, Stroked for secondary)
- Angular Material Icons
- Angular Material Checkbox
- Angular Material Progress Spinner

### Responsive Design
- Mobile-first approach
- Breakpoints at 480px and 768px
- Centered card layouts
- Touch-friendly button sizes (48px height)

## Authentication Flow

### Registration Flow
1. User fills registration form on `/auth/register`
2. On submit → `AuthService.register()`
3. If successful → Navigate to `/auth/select-role`
4. User selects Student or Teacher role
5. On confirm → `AuthService.selectRole()`
6. Navigate to appropriate dashboard

### Login Flow
1. User fills login form on `/auth/login`
2. On submit → `AuthService.login()`
3. If successful → Navigate based on user role:
   - Student → `/dashboard`
   - Teacher → `/teacher`
   - Admin → `/admin`

### Forgot Password Flow
1. User clicks "Forgot password?" on login page
2. Navigates to `/auth/forgot-password`
3. User enters email
4. On submit → `AuthService.forgotPassword()`
5. Success message displayed (security best practice)
6. Form resets automatically

## Integration with AuthService

All components use the `AuthService` from `@app/core`:

```typescript
import { AuthService } from '@app/core';
```

### Methods Used:
- `login(request: LoginRequest): Observable<AuthResponse>`
- `register(request: RegisterRequest): Observable<AuthResponse>`
- `selectRole(request: SelectRoleRequest): Observable<AuthResponse>`
- `forgotPassword(request: ForgotPasswordRequest): Observable<void>`
- `googleLogin(request: GoogleLoginRequest): Observable<AuthResponse>`

### Signals Used:
- `loading()` - Loading state indicator
- `userRole()` - Current user role

## Localization

All UI text is in Ukrainian (UK):
- Form labels and placeholders
- Error messages
- Success messages
- Button text
- Links and helper text

## Future Enhancements

### Google OAuth Integration
Currently, Google login buttons are placeholders. To implement:

1. Add Google Identity Services library to `index.html`
2. Configure Google Client ID in environment files
3. Implement Google credential retrieval in components
4. Call `AuthService.googleLogin()` with ID token

### Password Reset Completion
Create `/auth/reset-password` component to handle:
- Token validation from email link
- New password and confirmation fields
- Submit to `AuthService.resetPassword()`

## Acceptance Criteria ✅

- [x] `/auth/login`: email, password, forgot link, Google button, validation
- [x] `/auth/register`: email, password, confirm, displayName, GDPR checkbox, Google button
- [x] `/auth/select-role`: Student/Teacher cards (shown after registration)
- [x] Loading states, error handling
- [x] Redirect to dashboard after auth
- [x] Angular Reactive Forms validation
- [x] Responsive design with Angular Material + Tailwind

## Testing

To test the auth flow:

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Navigate to registration:**
   - Go to `http://localhost:4200/auth/register`
   - Fill in all fields with valid data
   - Check GDPR consent
   - Submit form

3. **Select role:**
   - Click on Student or Teacher card
   - Click "Продовжити" button

4. **Test login:**
   - Navigate to `http://localhost:4200/auth/login`
   - Enter credentials
   - Verify redirect to correct dashboard

5. **Test forgot password:**
   - Click "Забули пароль?" on login page
   - Enter email
   - Verify success message displayed

## Files Created

```
features/auth/
├── auth.routes.ts
├── login/
│   ├── login.component.ts
│   ├── login.component.html
│   └── login.component.scss
├── register/
│   ├── register.component.ts
│   ├── register.component.html
│   └── register.component.scss
├── select-role/
│   ├── select-role.component.ts
│   ├── select-role.component.html
│   └── select-role.component.scss
└── forgot-password/
    ├── forgot-password.component.ts
    ├── forgot-password.component.html
    └── forgot-password.component.scss
```

---

**Implementation Date:** February 12, 2026  
**User Story:** US-028  
**Status:** ✅ Complete
