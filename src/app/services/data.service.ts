import { computed, Injectable, signal } from "@angular/core";
import {
  SAMPLE_ALERTS,
  SAMPLE_CLIENTS,
  SAMPLE_DASHBOARD_STATS,
  SAMPLE_EMAILS,
  SAMPLE_POLICIES,
  SAMPLE_TASKS,
} from "../data/sample-data";
import {
  AIAlert,
  Client,
  DashboardStats,
  Email,
  EmailStatus,
  Policy,
  SearchResult,
  Task,
  TaskPriority,
  TaskStatus,
} from "../models";

@Injectable({
  providedIn: "root",
})
export class DataService {
  // Signals for reactive state
  private clientsSignal = signal<Client[]>(SAMPLE_CLIENTS);
  private policiesSignal = signal<Policy[]>(SAMPLE_POLICIES);
  private alertsSignal = signal<AIAlert[]>(SAMPLE_ALERTS);
  private tasksSignal = signal<Task[]>(SAMPLE_TASKS);
  private emailsSignal = signal<Email[]>(SAMPLE_EMAILS);
  private statsSignal = signal<DashboardStats>(SAMPLE_DASHBOARD_STATS);

  // Public readonly signals
  readonly clients = this.clientsSignal.asReadonly();
  readonly policies = this.policiesSignal.asReadonly();
  readonly alerts = this.alertsSignal.asReadonly();
  readonly tasks = this.tasksSignal.asReadonly();
  readonly emails = this.emailsSignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();

  // Computed values
  readonly activeAlerts = computed(() =>
    this.alertsSignal().filter((a) => !a.isDismissed),
  );

  readonly unreadAlerts = computed(() =>
    this.alertsSignal().filter((a) => !a.isRead && !a.isDismissed),
  );

  readonly pendingTasks = computed(() =>
    this.tasksSignal().filter(
      (t) =>
        t.status === TaskStatus.Pending || t.status === TaskStatus.InProgress,
    ),
  );

  readonly urgentTasks = computed(() =>
    this.tasksSignal().filter(
      (t) =>
        t.priority === TaskPriority.Urgent && t.status !== TaskStatus.Completed,
    ),
  );

  // Client methods
  getClient(id: string): Client | undefined {
    return this.clientsSignal().find((c) => c.id === id);
  }

  addClient(client: Client): void {
    this.clientsSignal.update((clients) => [...clients, client]);
  }

  updateClient(id: string, updates: Partial<Client>): void {
    this.clientsSignal.update((clients) =>
      clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }

  // Policy methods
  getPolicy(id: string): Policy | undefined {
    return this.policiesSignal().find((p) => p.id === id);
  }

  getPoliciesForClient(clientId: string): Policy[] {
    return this.policiesSignal().filter((p) => p.clientId === clientId);
  }

  addPolicy(policy: Policy): void {
    this.policiesSignal.update((policies) => [...policies, policy]);
  }

  updatePolicy(id: string, updates: Partial<Policy>): void {
    this.policiesSignal.update((policies) =>
      policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }

  // Alert methods
  getAlert(id: string): AIAlert | undefined {
    return this.alertsSignal().find((a) => a.id === id);
  }

  markAlertAsRead(id: string): void {
    this.alertsSignal.update((alerts) =>
      alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    );
  }

  dismissAlert(id: string): void {
    this.alertsSignal.update((alerts) =>
      alerts.map((a) => (a.id === id ? { ...a, isDismissed: true } : a)),
    );
  }

  addAlert(alert: AIAlert): void {
    this.alertsSignal.update((alerts) => [alert, ...alerts]);
  }

  // Task methods
  getTask(id: string): Task | undefined {
    return this.tasksSignal().find((t) => t.id === id);
  }

  getTasksForClient(clientId: string): Task[] {
    return this.tasksSignal().filter((t) => t.clientId === clientId);
  }

  addTask(task: Task): void {
    this.tasksSignal.update((tasks) => [...tasks, task]);
  }

  updateTask(id: string, updates: Partial<Task>): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }

  completeTask(id: string): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: TaskStatus.Completed,
              completedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
  }

  // Email methods
  getEmail(id: string): Email | undefined {
    return this.emailsSignal().find((e) => e.id === id);
  }

  addEmail(email: Email): void {
    this.emailsSignal.update((emails) => [...emails, email]);
  }

  updateEmail(id: string, updates: Partial<Email>): void {
    this.emailsSignal.update((emails) =>
      emails.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }

  sendEmail(id: string): void {
    this.emailsSignal.update((emails) =>
      emails.map((e) =>
        e.id === id
          ? {
              ...e,
              status: EmailStatus.Sent,
              sentAt: new Date().toISOString(),
            }
          : e,
      ),
    );
  }

  // Search
  search(query: string): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search clients
    this.clientsSignal()
      .filter(
        (c) =>
          c.firstName.toLowerCase().includes(lowerQuery) ||
          c.lastName.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery),
      )
      .forEach((c) =>
        results.push({
          type: "client",
          id: c.id,
          title: `${c.firstName} ${c.lastName}`,
          subtitle: c.email,
          metadata: {
            phone: c.phone,
            policies: c.totalPolicies.toString(),
          },
        }),
      );

    // Search policies
    this.policiesSignal()
      .filter(
        (p) =>
          p.policyNumber.toLowerCase().includes(lowerQuery) ||
          p.clientName.toLowerCase().includes(lowerQuery) ||
          p.type.toLowerCase().includes(lowerQuery),
      )
      .forEach((p) =>
        results.push({
          type: "policy",
          id: p.id,
          title: p.policyNumber,
          subtitle: `${p.clientName} - ${p.type}`,
          metadata: {
            status: p.status,
            premium: `$${p.premium}`,
          },
        }),
      );

    // Search tasks
    this.tasksSignal()
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          (t.clientName?.toLowerCase().includes(lowerQuery) ?? false),
      )
      .forEach((t) =>
        results.push({
          type: "task",
          id: t.id,
          title: t.title,
          subtitle: t.clientName || "No client assigned",
          metadata: {
            status: t.status,
            priority: t.priority,
          },
        }),
      );

    // Search alerts
    this.alertsSignal()
      .filter(
        (a) =>
          a.title.toLowerCase().includes(lowerQuery) ||
          a.message.toLowerCase().includes(lowerQuery) ||
          (a.clientName?.toLowerCase().includes(lowerQuery) ?? false),
      )
      .forEach((a) =>
        results.push({
          type: "alert",
          id: a.id,
          title: a.title,
          subtitle: a.clientName || "General alert",
          metadata: {
            priority: a.priority,
            type: a.type,
          },
        }),
      );

    return results;
  }

  // Bulk import (for Excel)
  importClients(clients: Client[]): void {
    this.clientsSignal.update((existing) => [...existing, ...clients]);
  }

  importPolicies(policies: Policy[]): void {
    this.policiesSignal.update((existing) => [...existing, ...policies]);
  }

  // Update stats
  updateStats(updates: Partial<DashboardStats>): void {
    this.statsSignal.update((stats) => ({ ...stats, ...updates }));
  }
}
