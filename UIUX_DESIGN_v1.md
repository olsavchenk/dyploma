# Stride UI/UX Design Specification (MVP)

Version: 1.0.0
Date: February 10, 2026
Scope: MVP (Phase 1) only
Design System: Angular Material-based
Audience: Product, Design, Engineering

---

## 1) Design Principles

1. Mobile-first PWA: prioritize touch, small screens, and offline behavior.
2. Ukrainian-first: default language is uk-UA; UI must be i18n-ready.
3. Gamification-driven engagement: surface streaks, XP, levels, and rewards constantly.
4. Flow-zone learning: keep tasks in the 70-80% success band for engagement.
5. Instant feedback: every answer or action gets immediate, clear response.
6. Low cognitive load: simple layouts, minimal steps, predictable navigation.
7. Accessibility first: WCAG 2.1 AA target, keyboard and screen reader friendly.

---

## 2) Design System (Angular Material)

### 2.1 Theme Foundations

- Color palette: define Material primary/accent/warn with brand tones.
  - Primary: deep blue (trust, education)
  - Accent: sunflower yellow (Ukrainian reference, highlights)
  - Warn: clean red (errors)
- Neutral background: light gray/white for content clarity.
- Semantic colors: success (green), warning (orange), info (blue).

### 2.2 Typography

- Use Material typography with Cyrillic-capable font.
- Recommended: Inter or Nunito (both support Ukrainian).
- Type scale: H1-H6, subtitle, body1, body2, caption, button.

### 2.3 Spacing and Layout

- 4px base grid, scale: 4, 8, 12, 16, 24, 32, 48.
- Layout rhythm: consistent margins and padding per screen type.

### 2.4 Elevation and Radius

- Use Material elevation levels 0-8.
- Corners: 12px for cards, 8px for buttons and inputs.

### 2.5 Breakpoints

- Mobile: <600px
- Tablet: 600-1024px
- Desktop: >1024px

### 2.6 Angular Material Components (Standard)

- mat-button, mat-icon-button, mat-fab
- mat-card
- mat-toolbar
- mat-sidenav
- mat-tabs
- mat-table
- mat-paginator
- mat-dialog
- mat-bottom-sheet
- mat-snackbar
- mat-form-field, mat-input, mat-select
- mat-checkbox, mat-radio-button
- mat-progress-bar, mat-progress-spinner
- mat-chip
- mat-menu
- mat-tooltip
- mat-stepper
- mat-expansion-panel
- mat-datepicker
- mat-badge

### 2.7 Custom Components (Built on Material)

- task-card
- xp-bar
- streak-counter
- badge-display
- leaderboard-row
- level-display
- difficulty-badge

---

## 3) Iconography and Illustration

- Icon set: Material Icons/Symbols.
- Gamification icons:
  - Streak: flame icon
  - XP: star or lightning
  - Level: shield or badge
  - Leaderboard: trophy
- Subject icons: custom SVGs for Math, Ukrainian, History, English.
- Empty states: friendly illustration style; minimal text and a clear CTA.

---

## 4) Global Layout and Navigation

### 4.1 App Shell

- Mobile:
  - Top bar (mat-toolbar): logo, streak fire, XP mini-bar, avatar, bell
  - Bottom nav: Home, Learn, Leaderboard, Profile
  - Teacher: add Classes tab
  - Admin: add Admin tab
- Desktop:
  - Left mat-sidenav with full navigation
  - Top bar for actions, notifications, user menu

### 4.2 Global Elements

- Header: streak counter, XP bar, notification bell, avatar menu
- Notification center: dropdown panel with recent events
- Skeleton loading: shimmer placeholders for all list and card views

---

## 5) Auth Flows

### 5.1 Welcome / Entry Screen

- Value prop, CTA buttons: Create account, Sign in
- Google sign-in button visible

### 5.2 Registration (Email)

- Fields: email, password, confirm password, display name
- GDPR consent checkbox with privacy policy link
- Inline validation errors under each field
- Primary CTA: Create account

### 5.3 Registration (Google OAuth)

- Button: Continue with Google
- OAuth redirect and callback
- If new user, proceed to role selection

### 5.4 Login (Email)

- Fields: email, password
- Forgot password link
- Google sign-in button

### 5.5 Role Selection (Post-Registration)

- Student or Teacher cards
- Admin role is assigned manually

### 5.6 Forgot Password (UI Spec)

- Form to request reset by email
- Confirmation screen: email sent

### 5.7 Reset Password (UI Spec)

- Fields: new password, confirm password
- Success confirmation and link back to login

### 5.8 Session Expired

- Modal dialog: re-auth prompt

---

## 6) Student Dashboard

### 6.1 Home

- Daily streak widget
- XP and level progress
- Continue learning cards
- First-task-of-day bonus indicator
- Weekly leaderboard preview
- Empty state for new users

### 6.2 Streak Heatmap

- Calendar grid of active days
- Frozen days indicated with snowflake
- Missed days muted

---

## 7) Subject and Topic Browsing

### 7.1 Subject Catalog

- Grid of subject cards with icon, name, progress
- Search bar for subjects

### 7.2 Topic List / Tree

- Hierarchical list with expand/collapse
- Per-topic mastery percent
- Locked state for future topics

### 7.3 Topic Detail

- Topic overview
- Current mastery and difficulty
- Start learning CTA

---

## 8) Learning Paths

### 8.1 Path List

- Cards with name, grade, progress

### 8.2 Path Detail

- Step list with status
- Progress bar and next step CTA

---

## 9) Task Session (Core Learning Loop)

### 9.1 Session Shell

- Task progress indicator
- Topic label
- Streak multiplier indicator
- Timer (optional, disabled by default)

### 9.2 Task Types (Each Requires Its Own Component)

1. Multiple Choice
   - Four selectable options
   - Submit/Check button
2. Fill-in-the-Blank
   - Inline input fields
3. Matching
   - Two columns, connect pairs
4. Ordering
   - Drag-to-reorder list
5. Short Answer
   - Text input
6. Drag-and-Drop
   - Drag items into target zones
7. True/False
   - Two large buttons

### 9.3 Answer Feedback

- Correct: green border, checkmark, short feedback
- Incorrect: red border, hint or explanation
- Explanation expandable panel

### 9.4 XP Earned Breakdown

- Popup with base XP, difficulty multiplier, streak multiplier, bonuses

### 9.5 Session Summary

- Tasks completed, accuracy, XP earned, mastery change
- Continue or return to topic list

### 9.6 Task History

- Table of attempts: date, correctness, difficulty, time
- Pagination

---

## 10) Gamification

### 10.1 Stats Overview

- Total XP, current level, streak count
- Streak freezes held
- League badge

### 10.2 Achievements Gallery

- Earned vs locked badges
- Badge detail dialog

### 10.3 Leaderboard

- Weekly leaderboard
- Tabs for leagues
- Highlight current user

### 10.4 League Movement

- Promotion/demotion banner at week end

### 10.5 Streak Freeze Purchase

- Confirmation dialog with XP cost

### 10.6 Streak Repair

- Available within 24 hours of break

---

## 11) Student Class Features

### 11.1 Join Class

- Join code input
- Confirmation with class name

### 11.2 My Classes List

- List of classes with teacher name

### 11.3 Assignments

- List of assignments with due dates and status

---

## 12) Teacher Features

### 12.1 Teacher Dashboard

- Class overview
- Recent completion stats

### 12.2 Class Management

- Create class
- Class list with join code copy
- Class detail with roster
- Class analytics dashboard
- Student detail analytics

### 12.3 Assignments

- Create assignment
- Assignment list
- Assignment results

### 12.4 Teacher Profile

- Additional fields: school, department

---

## 13) Admin Panel

### 13.1 Admin Analytics

- System-wide KPIs
- AI generation metrics

### 13.2 User Management

- User list and search
- User detail and role change

### 13.3 AI Review Queue

- Pending AI tasks list
- Task template detail review
- Approve/reject actions
- Bulk actions

### 13.4 Content Management

- Subject CRUD
- Topic tree editor
- Learning path editor
- Achievement editor

### 13.5 AI Monitoring

- AI generation logs
- Provider health
- Task pool status

---

## 14) Profile and Settings

- View profile
- Edit profile
- Avatar upload
- Data export
- Account deletion
- Push notification toggle
- Language selector (uk-UA only in MVP)

---

## 15) PWA and Offline

- Offline fallback page
- Install prompt banner
- Update available snackbar
- Offline-available indicator on cached lessons

---

## 16) Error and Feedback

- Inline validation errors
- RFC 7807 error display
- Toasts/snackbars for success and error
- 404, 403, 500 pages
- Network error retry dialog

---

## 17) Real-Time Notifications

- Achievement unlocked toast
- Streak reminder push and in-app toast
- Leaderboard update toast
- Rank changed notification
- Notification center dropdown

---

## 18) Micro-Interactions and Motion

- XP counter increment animation
- Level-up celebration (confetti)
- Streak flame pulse on increment
- Correct answer: green flash and checkmark
- Incorrect answer: shake and red border
- Badge unlock: scale-in and glow
- Leaderboard rank change: slide up/down
- Page transitions between routes
- Reduced-motion support

---

## 19) Accessibility

- Keyboard navigation for all inputs and menus
- ARIA labels for custom components
- Drag-and-drop alternative for keyboard users
- Focus outline visible and consistent
- Contrast ratio minimum 4.5:1
- Screen reader announcements for dynamic updates

---

## 20) Screen Inventory Table (MVP)

This section must include a master table with:
- Screen ID
- Screen Name
- Route Path
- Role Access
- Feature Module
- Primary Angular Material Components

Populate the table with all MVP screens described in Sections 5-17.
