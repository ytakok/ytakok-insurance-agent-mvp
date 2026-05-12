# Insurance Agent MVP - Development Guide

## Project Overview

This is an **Angular 19+ standalone application** for insurance agents to manage clients, policies, tasks, alerts, and emails with AI-powered insights.

---

## Architecture Principles

### 1. Standalone Components (No NgModules)

All components are standalone with inline or external templates:

```typescript
@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./example.component.html",
  styleUrl: "./example.component.less",
})
export class ExampleComponent {}
```

### 2. Signals for State Management

Use Angular signals instead of RxJS BehaviorSubjects for reactive state:

```typescript
// In services
private dataSignal = signal<Data[]>([]);
readonly data = this.dataSignal.asReadonly();

// Update state
this.dataSignal.update(items => [...items, newItem]);
this.dataSignal.set(newItems);

// In components
readonly items = computed(() => this.service.data().filter(x => x.active));
```

### 3. Dependency Injection with `inject()`

Use the `inject()` function instead of constructor injection:

```typescript
export class MyComponent {
  private dataService = inject(DataService);
  private router = inject(Router);
}
```

### 4. Control Flow Syntax

Use the new `@if`, `@for`, `@switch` syntax instead of `*ngIf`, `*ngFor`:

```html
@if (loading()) {
<div class="spinner">Loading...</div>
} @else if (error()) {
<div class="error">{{ error() }}</div>
} @else { @for (item of items(); track item.id) {
<div class="item">{{ item.name }}</div>
} @empty {
<div class="empty">No items found</div>
} }
```

---

## Enums & Type Safety

### Always Use Enums Instead of String Literals

**Models location:** `src/app/models/index.ts`

```typescript
// ❌ BAD - String literals
status: "pending" | "completed" | "in-progress";
if (task.status === "completed") {
}

// ✅ GOOD - Enums
export enum TaskStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

status: TaskStatus;
if (task.status === TaskStatus.Completed) {
}
```

### Available Enums

| Enum            | Values                                                     |
| --------------- | ---------------------------------------------------------- |
| `TaskStatus`    | Pending, InProgress, Completed, Cancelled                  |
| `TaskPriority`  | Low, Medium, High, Urgent                                  |
| `PolicyStatus`  | Active, Pending, Expired, Cancelled, RenewalPending        |
| `PolicyType`    | Auto, Home, Life, Health, Business, Umbrella               |
| `AlertPriority` | Low, Medium, High, Critical                                |
| `AlertType`     | Renewal, Payment, Claim, Coverage, Compliance, Opportunity |
| `EmailStatus`   | Draft, Sent, Failed, Scheduled                             |

### Exposing Enums to Templates

```typescript
export class TasksComponent {
  // Expose enums for template use
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;
}
```

```html
<!-- In template -->
<option [value]="TaskStatus.Pending">Pending</option>
@if (task.status === TaskStatus.Completed) {
<span class="completed">✓</span>
}
```

### Translation Key Mappings

```typescript
import {
  TASK_STATUS_TRANSLATION_KEYS,
  TASK_PRIORITY_TRANSLATION_KEYS,
} from "../models";

// Get translation key for enum value
const translationKey = TASK_STATUS_TRANSLATION_KEYS[task.status];
// Returns: "tasks.status.completed"
```

---

## Styling with LESS

### File Structure

```
src/
├── styles/
│   ├── _variables.less    # Design tokens
│   └── _mixins.less       # Reusable patterns
└── app/
    └── components/
        └── example/
            ├── example.component.ts
            ├── example.component.html
            └── example.component.less
```

### Variables (`_variables.less`)

```less
// Colors
@primary-50: #eff6ff;
@primary-500: #3b82f6;
@primary-600: #2563eb;
@primary-700: #1d4ed8;

@success-500: #22c55e;
@warning-500: #f59e0b;
@danger-500: #ef4444;

// Spacing
@spacing-1: 0.25rem;
@spacing-2: 0.5rem;
@spacing-4: 1rem;
@spacing-6: 1.5rem;

// Typography
@font-size-sm: 0.875rem;
@font-size-base: 1rem;
@font-size-lg: 1.125rem;

// Borders & Shadows
@border-radius: 0.5rem;
@shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
@shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
```

### Mixins (`_mixins.less`)

```less
.flex-center() {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary() {
  background: @primary-600;
  color: white;
  padding: @spacing-2 @spacing-4;
  border-radius: @border-radius;
  &:hover {
    background: @primary-700;
  }
}

.card() {
  background: white;
  border-radius: @border-radius;
  box-shadow: @shadow-md;
  padding: @spacing-4;
}
```

### Component LESS File

```less
@import "../../styles/_variables.less";
@import "../../styles/_mixins.less";

.my-component {
  .card();

  .header {
    .flex-center();
    gap: @spacing-2;
  }

  .btn {
    .btn-primary();
  }
}
```

---

## Translation / i18n

### Translation Files Location

```
src/assets/i18n/
├── en.json
└── he.json
```

### Translation File Structure

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "tasks": {
    "title": "Tasks",
    "status": {
      "pending": "Pending",
      "inProgress": "In Progress",
      "completed": "Completed"
    },
    "priority": {
      "low": "Low",
      "medium": "Medium",
      "high": "High",
      "urgent": "Urgent"
    }
  }
}
```

### Using TranslateService

```typescript
import { TranslateService } from "../services/translate.service";

export class MyComponent {
  private translateService = inject(TranslateService);

  // Create shorthand method
  t = (key: string, params?: Record<string, string>) =>
    this.translateService.translate(key, params);
}
```

```html
<!-- In template -->
<h1>{{ t("tasks.title") }}</h1>
<button>{{ t("common.save") }}</button>

<!-- With parameters -->
<p>{{ t("tasks.updateStatus", { title: task.title }) }}</p>
```

---

## Data Models

### Location: `src/app/models/index.ts`

### Core Interfaces

```typescript
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  createdAt: string;
  totalPolicies: number;
  totalPremium: number;
  riskScore: number;
}

export interface Policy {
  id: string;
  clientId: string;
  clientName: string;
  policyNumber: string;
  type: PolicyType;
  status: PolicyStatus;
  premium: number;
  deductible: number;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  carrier: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  clientId?: string;
  clientName?: string;
  policyId?: string;
  alertId?: string;
  aiGenerated: boolean;
  aiSuggestion?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AIAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  clientId?: string;
  clientName?: string;
  policyId?: string;
  policyNumber?: string;
  actionRequired: string;
  aiConfidence: number;
  aiInsight: string;
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
}

export interface Email {
  id: string;
  to: string;
  toName: string;
  subject: string;
  body: string;
  status: EmailStatus;
  clientId?: string;
  policyId?: string;
  taskId?: string;
  aiGenerated: boolean;
  aiSuggestion?: string;
  createdAt: string;
  sentAt?: string;
  scheduledAt?: string;
}
```

---

## Services

### DataService (`src/app/services/data.service.ts`)

Central data store using signals:

```typescript
// Reading data
const clients = this.dataService.clients();
const tasks = this.dataService.tasks();

// Computed values
const pendingTasks = this.dataService.pendingTasks();
const urgentTasks = this.dataService.urgentTasks();

// Mutations
this.dataService.addTask(task);
this.dataService.updateTask(id, updates);
this.dataService.completeTask(id);
this.dataService.deleteTask(id);
```

### AIService (`src/app/services/ai.service.ts`)

AI-powered analysis and suggestions:

```typescript
// Analyze uploaded data
const result = await this.aiService.analyzeData(clients, policies);
// Returns: { alerts, insights, suggestedTasks, suggestedEmails }

// Generate task from alert
const taskSuggestion = await this.aiService.generateTaskFromAlert(alert);

// Analyze text sentiment
const analysis = await this.aiService.analyzeText(text);
```

### TranslateService (`src/app/services/translate.service.ts`)

i18n translations:

```typescript
// Get current locale
const locale = this.translateService.currentLocale();

// Change language
this.translateService.setLocale("he");

// Translate
const text = this.translateService.translate("tasks.title");
```

### LocaleService (`src/app/services/locale.service.ts`)

RTL and locale utilities:

```typescript
// Check RTL
const isRtl = this.localeService.isRtl();

// Get direction
const dir = this.localeService.direction(); // "ltr" | "rtl"
```

---

## Component Structure

### File Organization

```
src/app/components/
├── dashboard/
│   ├── dashboard.component.ts
│   ├── dashboard.component.html
│   └── dashboard.component.less
├── tasks/
│   ├── tasks.component.ts
│   ├── tasks.component.html
│   └── tasks.component.less
├── alerts/
├── clients/
├── policies/
├── email/
├── search/
└── excel-upload/
```

### Component Template

```typescript
// tasks.component.ts
import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  Task,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_TRANSLATION_KEYS,
  TASK_PRIORITY_TRANSLATION_KEYS,
} from "../../models";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-tasks",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./tasks.component.html",
  styleUrl: "./tasks.component.less",
})
export class TasksComponent {
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  // Expose enums to template
  readonly TaskStatus = TaskStatus;
  readonly TaskPriority = TaskPriority;

  // Translation shorthand
  t = (key: string, params?: Record<string, string>) =>
    this.translateService.translate(key, params);

  // State
  selectedStatus = signal<string>("all");
  showModal = signal(false);

  // Data from service
  tasks = this.dataService.tasks;
  clients = this.dataService.clients;

  // Computed values
  filteredTasks = computed(() => {
    const status = this.selectedStatus();
    if (status === "all") return this.tasks();
    return this.tasks().filter((t) => t.status === status);
  });

  // Methods
  getStatusLabel(status: TaskStatus): string {
    return this.t(TASK_STATUS_TRANSLATION_KEYS[status]);
  }

  completeTask(task: Task): void {
    this.dataService.updateTask(task.id, {
      status: TaskStatus.Completed,
      completedAt: new Date().toISOString(),
    });
  }
}
```

---

## Routing

### Location: `src/app/app.routes.ts`

```typescript
import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "dashboard",
    pathMatch: "full",
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./components/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    title: "Dashboard - Insurance Agent MVP",
  },
  {
    path: "tasks",
    loadComponent: () =>
      import("./components/tasks/tasks.component").then(
        (m) => m.TasksComponent,
      ),
    title: "Tasks - Insurance Agent MVP",
  },
  // ... other routes
  {
    path: "**",
    redirectTo: "dashboard",
  },
];
```

---

## Sample Data

### Location: `src/app/data/sample-data.ts`

```typescript
import {
  Client,
  Policy,
  Task,
  TaskStatus,
  TaskPriority,
  PolicyStatus,
  PolicyType,
  // ... other imports
} from "../models";

export const SAMPLE_TASKS: Task[] = [
  {
    id: "t1",
    title: "Call client about renewal",
    description: "Policy expires in 30 days",
    status: TaskStatus.Pending,
    priority: TaskPriority.High,
    dueDate: "2024-01-20",
    clientId: "c1",
    clientName: "John Smith",
    aiGenerated: true,
    aiSuggestion: "Best time to call: 10 AM - 12 PM",
    createdAt: "2024-01-15T09:00:00Z",
  },
  // ... more sample data
];
```

---

## Adding a New Feature

### 1. Create the Model (if needed)

Add interfaces and enums to `src/app/models/index.ts`

### 2. Create the Component

```bash
# Create component folder and files
src/app/components/my-feature/
├── my-feature.component.ts
├── my-feature.component.html
└── my-feature.component.less
```

### 3. Add Route

```typescript
// In app.routes.ts
{
  path: "my-feature",
  loadComponent: () =>
    import("./components/my-feature/my-feature.component").then(
      (m) => m.MyFeatureComponent,
    ),
  title: "My Feature - Insurance Agent MVP",
},
```

### 4. Add Translations

```json
// In en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

### 5. Add Navigation Link

Update `app.component.html` or navigation component

---

## Running the Application

```bash
# Navigate to project
cd insurance-agent-mvp

# Install dependencies
npm install

# Start dev server (port 4201)
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

---

## Key Files Reference

| File                                    | Purpose                                         |
| --------------------------------------- | ----------------------------------------------- |
| `src/main.ts`                           | Application bootstrap (includes zone.js import) |
| `src/app/app.config.ts`                 | App configuration (providers, routing)          |
| `src/app/app.routes.ts`                 | Route definitions                               |
| `src/app/app.component.ts`              | Root component with navigation                  |
| `src/app/models/index.ts`               | All interfaces, enums, type definitions         |
| `src/app/data/sample-data.ts`           | Mock data for development                       |
| `src/app/services/data.service.ts`      | Central data store                              |
| `src/app/services/translate.service.ts` | i18n translations                               |
| `src/styles/_variables.less`            | Design tokens                                   |
| `src/styles/_mixins.less`               | Reusable LESS patterns                          |
| `src/assets/i18n/en.json`               | English translations                            |
| `src/assets/i18n/he.json`               | Hebrew translations                             |

---

## Best Practices Checklist

- [ ] Use standalone components (no NgModules)
- [ ] Use signals for reactive state
- [ ] Use `inject()` for dependency injection
- [ ] Use `@if`, `@for`, `@switch` control flow
- [ ] Use enums instead of string literals
- [ ] Expose enums to templates with `readonly EnumName = EnumName`
- [ ] Use LESS with variables and mixins
- [ ] Add translations for all user-facing text
- [ ] Use `track` in `@for` loops for performance
- [ ] Use `computed()` for derived state
- [ ] Keep components focused and single-responsibility
- [ ] Use lazy loading for routes
