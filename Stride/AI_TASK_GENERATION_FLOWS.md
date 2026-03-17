# AI Task Generation — Architecture & Flow Documentation

> **Purpose:** Reference document for redesigning the end-to-end AI-powered task generation pipeline.  
> **Status of current implementation:** Partially implemented. The AI generation layer exists and works in isolation, but is **not connected** to the assignment/topic lifecycle. This document maps the as-is state and identifies every gap.

---

## 1. Data Model Overview

### PostgreSQL (relational, `StrideDbContext`)

| Entity | Key Fields | Role |
|---|---|---|
| `Topic` | `Id`, `Name`, `SubjectId`, `IsActive` | Canonical topic definition |
| `Subject` | `Id`, `Name` | Groups topics |
| `Class` | `Id`, `TeacherId`, `GradeLevel`, `JoinCode` | Teacher's class |
| `ClassAssignment` | `Id`, `ClassId`, `TopicId?`, `TopicName`, `SubjectName`, `TaskCount`, `MinDifficulty`, `MaxDifficulty`, `DueDate` | Assignment created by teacher. `TopicId` resolved best-effort by name match — **can be null** |
| `ClassMembership` | `ClassId`, `StudentId` | Student ↔ class link |
| `StudentPerformance` | `StudentId`, `TopicId`, `CurrentDifficulty`, `RollingAccuracy`, `TopicMastery` | Per-student per-topic adaptive state |
| `TaskAttempt` | `StudentId`, `TopicId`, `TaskInstanceId`, `IsCorrect`, `DifficultyAtTime` | History of every answer |

### MongoDB (document, `MongoDbContext`)

| Collection | Document | Role |
|---|---|---|
| `task_templates` | `TaskTemplateDocument` | Master task definitions. Created by Gemini or seeded manually. Must be `IsApproved = true` to be used |
| `task_instances` | `TaskInstanceDocument` | Rendered, ready-to-serve copies. Spawned from templates. Have a `Difficulty` (1–100) and optional `ExpiresAt` |
| `ai_generation_logs` | `AIGenerationLogDocument` | Audit trail for every Gemini API call |

### Valkey / Redis

- **Pool key:** `taskpool:{topicId}:{difficultyBand}` — a list of `TaskInstanceDocument` IDs, ready to pop
- **Meta key:** `taskpool:meta:{topicId}:{difficultyBand}` — metadata (last refill time, etc.)
- **Difficulty bands:** 1–10, where band = `ceil(difficulty / 10)`, mapping the 1–100 precision difficulty to coarse buckets

---

## 2. Taxonomy of Task Types

Gemini is prompted to produce one of these structured types. Each has a different `TemplateContent` schema in MongoDB:

| `task_type` | Description | `options` field | `answer` field |
|---|---|---|---|
| `multiple_choice` | 4 options, 1 correct | `["a","b","c","d"]` | Correct text or index 0–3 |
| `fill_blank` | Text with `{{blank}}` placeholder | Not used | Array of correct strings per blank |
| `true_false` | Single statement | Not used | `true` or `false` |
| `matching` | Two columns to link | Array of pairs `[left, right]` | Array of correct index mappings |
| `ordering` | Items to sort | Array of elements in random order | Array of indices in correct order |

---

## 3. Gemini Integration — How It Works

### Entry point
`GeminiProvider : IAIProvider` in `Stride.Adaptive/Services/Implementations/GeminiProvider.cs`

### Input: `AITaskGenerationRequest`
```
TopicId        — Guid
TopicName      — string  (used in the prompt)
SubjectName    — string  (used in the prompt)
TaskType       — string  (one of the 5 types above)
DifficultyBand — int 1–10
GradeLevel     — int  (used in the prompt)
```

### What happens inside `GenerateTaskTemplateAsync()`
1. Builds a Ukrainian-language prompt instructing Gemini to act as a Ukrainian school teacher
2. Specifies subject, topic, grade, difficulty description, and task-type-specific formatting rules
3. Calls `{ApiUrl}/{Model}:generateContent?key={ApiKey}` with `responseMimeType: "application/json"`
4. Parses the response JSON into `{ question, options, answer, explanation, hints }`
5. Converts to a `BsonDocument` (`TemplateContent`) ready to save as a `TaskTemplateDocument`
6. Logs the full interaction to `ai_generation_logs` (prompt, raw response, token count, latency, success/failure)
7. Retries up to `MaxRetries` (default: 3) with exponential backoff on network errors

### Output: `AITaskGenerationResponse`
```
Success          — bool
Question         — string
Options          — List<string>?
Answer           — object?
Explanation      — string?
Hints            — List<string>?
TemplateContent  — BsonDocument  ← ready to store as TaskTemplateDocument
TokensUsed       — int?
GenerationTimeMs — int
ErrorMessage     — string?
```

### Model config (appsettings)
```json
"AIProvider": {
  "DefaultProvider": "gemini",
  "MaxRetries": 3,
  "RetryDelayMs": 1000,
  "TimeoutSeconds": 30,
  "Gemini": {
    "Model": "gemini-2.0-flash-exp",
    "Temperature": 0.7,
    "MaxOutputTokens": 2048
  }
}
```

---

## 4. Task Pool System — How It Works

### Pool lifecycle

```
TaskTemplateDocument (MongoDB, IsApproved=true)
        │
        │  TaskPoolService.RefillPoolAsync(topicId, band)
        ▼
TaskInstanceDocument (MongoDB)   ←── Rendered copy with precise Difficulty (1–100)
        │                             ExpiresAt = now + PoolTtlHours (default: 24h)
        │  ID pushed to Valkey
        ▼
Valkey list: taskpool:{topicId}:{band}
        │
        │  TaskPoolService.GetTaskAsync(topicId, targetDifficulty)
        │  → pops right from list
        ▼
AdaptiveAIService → TasksController → Student
```

### Pool settings (appsettings)
```json
"TaskPool": {
  "TargetPoolSize": 50,       // fill up to this many IDs per pool key
  "RefillThreshold": 20,      // trigger refill when below this
  "DifficultyRangeWindow": 10,// fallback query ±10 around target difficulty
  "PoolTtlHours": 24,         // instance expiry
  "MaxCachedTasks": 100
}
```

### Fallback chain on empty pool
1. Pop from Valkey → if empty →
2. Query MongoDB for instances with matching `TopicId` + `Difficulty` within ±`DifficultyRangeWindow` → if nothing →
3. Call `RefillPoolAsync` synchronously (from templates that are already in MongoDB) → retry query → if still nothing →
4. Widen query to full topic range (difficulty 1–100) → if still nothing →
5. Return `null` → `AdaptiveAIService` throws `InvalidOperationException("No tasks available")` → `400 Bad Request` to student

---

## 5. Current Flows End-to-End

### 5A. Teacher creates assignment

```
POST /api/v1/classes/{classId}/assignments
Requires: Teacher JWT (TeacherAccess policy)
Body: { title, subjectName, topicName, taskCount, minDifficulty, maxDifficulty, dueDate? }

ClassController
  → ClassService.CreateAssignmentAsync()
    → Best-effort: queries Topics table by (Name + Subject.Name) to resolve TopicId
    → If no match: TopicId = null  ← SILENT FAILURE, no error returned
    → Saves ClassAssignment to PostgreSQL
    → Returns AssignmentDto

RESULT: Assignment row in PostgreSQL. Zero tasks created. Zero Gemini calls.
```

### 5B. Background pool refill (every 5 minutes)

```
TaskPoolRefillService (BackgroundService, Stride.Adaptive.Api)
  → Scans Valkey for existing pool keys: taskpool:*
  → For each key below RefillThreshold (20):
      TaskPoolService.RefillPoolAsync(topicId, band)
        → Queries MongoDB task_templates where TopicId=X AND DifficultyBand=Y AND IsApproved=true
        → If templates found: creates TaskInstanceDocuments → pushes IDs to Valkey
        → If templates NOT found: logs error, returns 0, does nothing

CRITICAL GAP: Only scans EXISTING Valkey keys.
A brand-new topic with zero templates and no prior pool key is NEVER discovered by this service.
```

### 5C. Student opens assignment and requests a task

```
GET /api/v1/tasks/next?topicId={id}
Requires: Student JWT (StudentProfileId claim)

TasksController
  → TaskService.GetNextTaskAsync(studentId, topicId)
    → AdaptiveAIService.GetNextTaskAsync()
      → StudentPerformance.GetOrCreate(studentId, topicId)
      → DifficultyEngine.CalculateNextDifficulty(performance, lastAttempt)
          → Returns targetDifficulty (1–100) based on rolling accuracy + streak
      → TaskPoolService.GetTaskAsync(topicId, targetDifficulty)
          → [FALLBACK CHAIN — see Section 4]
          → If null → throws InvalidOperationException
    → Maps TaskInstanceDocument → TaskDto (answer stripped out)
    → Returns TaskDto to student

IF no templates exist for this topic:
→ Student receives 400 Bad Request: "No tasks available for topic X"
```

### 5D. Student submits an answer

```
POST /api/v1/tasks/{taskInstanceId}/submit
Body: { answer, responseTimeMs }

TasksController
  → TaskService.SubmitTaskAsync(studentId, taskInstanceId, request)
    → AdaptiveAIService.ProcessAnswerAsync()
      → Loads TaskInstanceDocument from MongoDB
      → Checks answer correctness
      → Updates StudentPerformance (EF transaction):
          - RollingAccuracy, CurrentDifficulty, TopicMastery, CurrentStreak
      → Records TaskAttempt in PostgreSQL
      → GamificationService.ProcessTaskCompletionAsync():
          - Awards XP, checks level-up, checks achievements
      → Returns: isCorrect, explanation, hints, xpEarned, newLevel?, achievements[]
```

### 5E. Admin manually triggers AI generation (only current path to Gemini)

```
POST /api/v1/pool-management/prefill-pool?topicId=X&difficultyBand=Y
Requires: Admin JWT (AdminAccess policy)

PoolManagementController
  → TaskPoolService.RefillPoolAsync(topicId, band)
    → Queries existing approved templates → creates instances → pushes to Valkey
    (Does NOT call Gemini — only uses existing templates)

POST /api/v1/pool-management/initialize-topic?topicId=X
  → Seeds templates (TaskTemplateSeeder — hardcoded static templates)
  → Then calls RefillPoolAsync for each band that has templates

NOTE: GeminiProvider.GenerateTaskTemplateAsync() is NEVER called automatically anywhere.
It is implemented and functional but has no caller in the production code path.
```

---

## 6. Gap Analysis

| # | Gap | Impact |
|---|---|---|
| G1 | **No Gemini→Template pipeline is wired up.** `GeminiProvider` exists but is never called automatically. | Any new topic = zero tasks until admin manually intervenes |
| G2 | **`ClassAssignment.TopicId` can be null.** If teacher types a topic name that doesn't exactly match a `Topic` row, the assignment has no `TopicId`, making it impossible to serve adaptive tasks | Student gets 400 or tasks from wrong topic |
| G3 | **Background refill ignores brand-new topics.** `TaskPoolRefillService.GetPoolsNeedingRefillAsync()` scans only existing Valkey keys. A topic with no pool key is invisible to it | Zero auto-bootstrap for new topics |
| G4 | **`ClassAssignment.MinDifficulty`/`MaxDifficulty` are stored but never used.** `AdaptiveAIService` always derives difficulty from `StudentPerformance`, ignoring teacher constraints | Teacher's difficulty range setting is a no-op |
| G5 | **`TaskTemplateDocument.IsApproved` must be `true`.** Gemini-generated templates require manual approval before serving. No approval UI exists. | Content blocked until admin reviews via DB or API |
| G6 | **`TaskTemplateSeeder` uses hardcoded static content.** Not scalable to new subjects/topics | Manually maintained, not AI-driven |
| G7 | **No event/trigger when an assignment is created for a topic with 0 templates.** No pub/sub, no outbox, no hook in `ClassService.CreateAssignmentAsync()` | New topics silently fail |

---

## 7. Intended Design (Target State for Redesign)

Based on the existing interfaces and data models, the intended end-to-end flow should be:

```
Teacher creates assignment (topicId resolved)
        │
        │ [Event / hook in ClassService]
        ▼
Topic-bootstrap job:
  For each task_type × difficulty_band combination:
    GeminiProvider.GenerateTaskTemplateAsync(AITaskGenerationRequest)
      → Returns AITaskGenerationResponse
      → Save as TaskTemplateDocument { IsApproved = false, AiProvider = "gemini" }
        │
        │ [Optional: auto-approve OR human review step]
        ▼
      TaskTemplateDocument { IsApproved = true }
        │
        │ TaskPoolService.RefillPoolAsync(topicId, band)
        ▼
      TaskInstanceDocument × N → pushed to Valkey pool
        │
        ▼
Student requests task → served immediately
```

### Key decisions needed for redesign

1. **Trigger:** On assignment creation? On first student request? Or scheduled discovery?
2. **Auto-approval:** Should Gemini outputs be auto-approved (`IsApproved = true` immediately) or require admin review?
3. **Coverage:** Which (task_type × difficulty_band) combinations to generate per topic? All 5×10 = 50? Or only the bands matching `ClassAssignment.MinDifficulty`/`MaxDifficulty`?
4. **Retry/fallback:** What to tell the student if they request a task while generation is still in progress (async generation case)?
5. **TopicId resolution:** Should assignment creation fail if `TopicId` can't be resolved? Or create the `Topic` automatically?
6. **Rate limiting:** Gemini API costs — generate eagerly for all bands or lazily on first demand per band?

---

## 8. Relevant Files Quick Reference

| Concern | File |
|---|---|
| Gemini API integration | `Stride.Adaptive/Services/Implementations/GeminiProvider.cs` |
| AI provider interface | `Stride.Adaptive/Services/Interfaces/IAIProvider.cs` |
| AI request/response DTOs | `Stride.Adaptive/Models/DTOs/AITaskGenerationRequest.cs`, `AITaskGenerationResponse.cs` |
| Template document (MongoDB) | `Stride.Core/Documents/TaskTemplateDocument.cs` |
| Instance document (MongoDB) | `Stride.Core/Documents/TaskInstanceDocument.cs` |
| AI generation log | `Stride.Core/Documents/AIGenerationLogDocument.cs` |
| Pool management (Redis) | `Stride.Adaptive/Services/Implementations/TaskPoolService.cs` |
| Background refill service | `Stride.Adaptive/BackgroundServices/TaskPoolRefillService.cs` |
| Adaptive task selection | `Stride.Adaptive/Services/Implementations/AdaptiveAIService.cs` |
| Assignment creation | `Stride.Services/Implementations/ClassService.cs` → `CreateAssignmentAsync()` |
| Admin pool API | `Stride.Adaptive.Api/Controllers/PoolManagementController.cs` |
| Task delivery API | `Stride.Api/Controllers/TasksController.cs` |
| Pool settings | `Stride.Adaptive/Configuration/TaskPoolSettings.cs` |
| AI provider settings | `Stride.Adaptive/Configuration/AIProviderSettings.cs` |
