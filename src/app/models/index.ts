// Insurance Agent MVP - Data Models

export type UiState = "idle" | "loading" | "success" | "error" | "empty";

// ============================================================================
// Enums
// ============================================================================

export enum AlertPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export enum AlertType {
  Renewal = "renewal",
  Payment = "payment",
  Claim = "claim",
  Coverage = "coverage",
  Compliance = "compliance",
  Opportunity = "opportunity",
}

export enum TaskStatus {
  Pending = "pending",
  InProgress = "in-progress",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum TaskPriority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Urgent = "urgent",
}

export enum PolicyStatus {
  Active = "active",
  Pending = "pending",
  Expired = "expired",
  Cancelled = "cancelled",
  RenewalPending = "renewal-pending",
}

export enum PolicyType {
  Auto = "auto",
  Home = "home",
  Life = "life",
  Health = "health",
  Business = "business",
  Umbrella = "umbrella",
}

export enum EmailStatus {
  Draft = "draft",
  Sent = "sent",
  Failed = "failed",
  Scheduled = "scheduled",
}

// ============================================================================
// Translation Key Mappings
// ============================================================================

export const TASK_STATUS_TRANSLATION_KEYS: Record<TaskStatus, string> = {
  [TaskStatus.Pending]: "tasks.status.pending",
  [TaskStatus.InProgress]: "tasks.status.inProgress",
  [TaskStatus.Completed]: "tasks.status.completed",
  [TaskStatus.Cancelled]: "tasks.status.cancelled",
};

export const TASK_PRIORITY_TRANSLATION_KEYS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "tasks.priority.low",
  [TaskPriority.Medium]: "tasks.priority.medium",
  [TaskPriority.High]: "tasks.priority.high",
  [TaskPriority.Urgent]: "tasks.priority.urgent",
};

export const ALERT_PRIORITY_TRANSLATION_KEYS: Record<AlertPriority, string> = {
  [AlertPriority.Low]: "alerts.priority.low",
  [AlertPriority.Medium]: "alerts.priority.medium",
  [AlertPriority.High]: "alerts.priority.high",
  [AlertPriority.Critical]: "alerts.priority.critical",
};

export const ALERT_TYPE_TRANSLATION_KEYS: Record<AlertType, string> = {
  [AlertType.Renewal]: "alerts.types.renewal",
  [AlertType.Payment]: "alerts.types.payment",
  [AlertType.Claim]: "alerts.types.claim",
  [AlertType.Coverage]: "alerts.types.coverage",
  [AlertType.Compliance]: "alerts.types.compliance",
  [AlertType.Opportunity]: "alerts.types.opportunity",
};

export const POLICY_STATUS_TRANSLATION_KEYS: Record<PolicyStatus, string> = {
  [PolicyStatus.Active]: "policies.status.active",
  [PolicyStatus.Pending]: "policies.status.pending",
  [PolicyStatus.Expired]: "policies.status.expired",
  [PolicyStatus.Cancelled]: "policies.status.cancelled",
  [PolicyStatus.RenewalPending]: "policies.status.renewalPending",
};

export const POLICY_TYPE_TRANSLATION_KEYS: Record<PolicyType, string> = {
  [PolicyType.Auto]: "policies.types.auto",
  [PolicyType.Home]: "policies.types.home",
  [PolicyType.Life]: "policies.types.life",
  [PolicyType.Health]: "policies.types.health",
  [PolicyType.Business]: "policies.types.business",
  [PolicyType.Umbrella]: "policies.types.umbrella",
};

// ============================================================================
// Interfaces
// ============================================================================

// Client Model
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
  riskScore: number; // AI-generated 1-100
}

// Policy Model
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
  notes: string;
}

// AI Alert Model
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
  aiConfidence: number; // 0-100
  aiInsight: string;
  createdAt: string;
  isRead: boolean;
  isDismissed: boolean;
}

// Task Model
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

// Email Model
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

// Excel Upload Result
export interface ExcelUploadResult {
  success: boolean;
  fileName: string;
  rowsProcessed: number;
  clientsImported: number;
  policiesImported: number;
  errors: ExcelParseError[];
  aiInsights: AIInsight[];
}

export interface ExcelParseError {
  row: number;
  column: string;
  message: string;
  value: string;
}

export interface AIInsight {
  type: "opportunity" | "risk" | "action" | "trend";
  title: string;
  description: string;
  confidence: number;
  affectedClients: number;
  potentialValue?: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalClients: number;
  totalPolicies: number;
  totalPremium: number;
  activeAlerts: number;
  pendingTasks: number;
  renewalsThisMonth: number;
  averageClientRisk: number;
  policyDistribution: PolicyDistribution[];
  monthlyTrends: MonthlyTrend[];
}

export interface PolicyDistribution {
  type: PolicyType;
  count: number;
  percentage: number;
  totalPremium: number;
}

export interface MonthlyTrend {
  month: string;
  newClients: number;
  renewals: number;
  claims: number;
  premium: number;
}

// Search Result
export interface SearchResult {
  type: "client" | "policy" | "task" | "alert";
  id: string;
  title: string;
  subtitle: string;
  metadata: Record<string, string>;
}
