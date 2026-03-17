# Task Type Components

Interactive task components for different question types in the Stride learning platform.

## Components

### 1. MultipleChoiceTaskComponent

**Purpose:** Display multiple choice questions with 4 options.

**Features:**
- Single selection radio buttons
- Keyboard navigation (keys 1-4)
- Visual feedback for selection
- Optional hints (toggle with 'H' key)

**Usage:**
```typescript
<app-multiple-choice-task
  [task]="multipleChoiceTask"
  (answerSelected)="onAnswerSelected($event)"
/>
```

**Output:** Emits the index (0-3) of the selected option.

---

### 2. FillBlankTaskComponent

**Purpose:** Display questions with fillable blank inputs.

**Features:**
- Parses `{{blank}}` placeholders in question text
- Inline input fields for each blank
- Validation for required fields
- Supports multiple blanks in one question

**Usage:**
```typescript
<app-fill-blank-task
  [task]="fillBlankTask"
  (answersChanged)="onAnswersChanged($event)"
/>
```

**Output:** Emits an array of strings (one for each blank).

---

### 3. TrueFalseTaskComponent

**Purpose:** Display true/false questions with two buttons.

**Features:**
- Large, accessible true/false buttons
- Keyboard shortcuts (T for true, F for false)
- Visual icons (check/cancel)
- Ukrainian keyboard support (Е for T, А for F)

**Usage:**
```typescript
<app-true-false-task
  [task]="trueFalseTask"
  (answerSelected)="onAnswerSelected($event)"
/>
```

**Output:** Emits a boolean (true or false).

---

### 4. MatchingTaskComponent

**Purpose:** Match items from two columns (questions and answers).

**Features:**
- Click to select from both columns
- Visual feedback for matches
- Progress counter
- Clear all functionality
- Disabled state for matched items

**Usage:**
```typescript
<app-matching-task
  [task]="matchingTask"
  (matchesChanged)="onMatchesChanged($event)"
/>
```

**Output:** Emits an array of `MatchingPair` objects `{ leftId, rightId }`.

---

### 5. OrderingTaskComponent

**Purpose:** Reorder items to the correct sequence using drag-and-drop.

**Features:**
- Drag-and-drop with Angular CDK
- Keyboard alternative (arrow keys)
- Visual drag handles
- Reset to original order
- Numbered items
- Initial random shuffle

**Usage:**
```typescript
<app-ordering-task
  [task]="orderingTask"
  (orderChanged)="onOrderChanged($event)"
/>
```

**Output:** Emits an array of strings in the current order.

---

## Common Features

All task components support:

- **Ukrainian text** via innerHTML rendering
- **Optional hints** that can be toggled
- **Responsive design** with mobile optimization
- **Keyboard navigation** for accessibility
- **Material Design** styling via Angular Material

## Task Models

All components use strongly-typed task models from `@app/core/models/task.models.ts`:

- `MultipleChoiceTask`
- `FillBlankTask`
- `TrueFalseTask`
- `MatchingTask`
- `OrderingTask`

## Accessibility

- Keyboard navigation support for all components
- Semantic HTML with proper ARIA labels
- Focus management for drag-and-drop alternatives
- High contrast color schemes
- Screen reader friendly

## Styling

Components use:
- **Tailwind-inspired utility colors**
- **Material Design elevation and spacing**
- **Responsive breakpoints** (640px, 768px)
- **Smooth transitions** for interactions

## Integration

Import from shared module:

```typescript
import {
  MultipleChoiceTaskComponent,
  FillBlankTaskComponent,
  TrueFalseTaskComponent,
  MatchingTaskComponent,
  OrderingTaskComponent
} from '@app/shared';
```

All components are standalone and can be used directly in any Angular component.
