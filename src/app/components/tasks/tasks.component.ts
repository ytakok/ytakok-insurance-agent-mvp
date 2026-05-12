import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  Task,
  TASK_PRIORITY_TRANSLATION_KEYS,
  TASK_STATUS_TRANSLATION_KEYS,
  TaskPriority,
  TaskStatus,
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

  // Reactive status tabs using translations
  statusTabs = computed(() => [
    { label: this.t("tasks.tabs.all"), value: "all" },
    { label: this.t("tasks.tabs.pending"), value: TaskStatus.Pending },
    { label: this.t("tasks.tabs.inProgress"), value: TaskStatus.InProgress },
    { label: this.t("tasks.tabs.completed"), value: TaskStatus.Completed },
  ]);

  selectedStatus = signal<string | TaskStatus>("all");
  showTaskModal = signal(false);
  editingTask = signal<Task | null>(null);
  selectedTask = signal<Task | null>(null);

  taskForm = {
    title: "",
    description: "",
    priority: TaskPriority.Medium,
    dueDate: new Date().toISOString().split("T")[0],
    clientId: "",
  };

  tasks = this.dataService.tasks;
  clients = this.dataService.clients;

  // Translation helper
  t(key: string, params?: Record<string, string | number>): string {
    return this.translateService.get(key, params);
  }

  // Get translated priority label using enum mapping
  getPriorityLabel(priority: TaskPriority): string {
    return this.t(TASK_PRIORITY_TRANSLATION_KEYS[priority]);
  }

  // Get translated status label using enum mapping
  getStatusLabel(status: TaskStatus): string {
    return this.t(TASK_STATUS_TRANSLATION_KEYS[status]);
  }

  // Get accessible toggle label
  getToggleLabel(task: Task): string {
    if (task.status === TaskStatus.Completed) {
      return this.t("tasks.markIncomplete", { title: task.title });
    }
    return this.t("tasks.markComplete", { title: task.title });
  }

  // Priority order for sorting (lower number = higher priority)
  private readonly PRIORITY_ORDER: Record<TaskPriority, number> = {
    [TaskPriority.Urgent]: 0,
    [TaskPriority.High]: 1,
    [TaskPriority.Medium]: 2,
    [TaskPriority.Low]: 3,
  };

  filteredTasks = computed(() => {
    const status = this.selectedStatus();
    const allTasks = this.tasks();

    const sortByPriority = (a: Task, b: Task) =>
      this.PRIORITY_ORDER[a.priority] - this.PRIORITY_ORDER[b.priority];

    if (status === "all") {
      return [...allTasks].sort(sortByPriority);
    }

    return allTasks.filter((t) => t.status === status).sort(sortByPriority);
  });

  getStatusCount(status: string | TaskStatus): number {
    if (status === "all") return this.tasks().length;
    return this.tasks().filter((t) => t.status === status).length;
  }

  isOverdue(task: Task): boolean {
    return (
      task.status !== TaskStatus.Completed &&
      new Date(task.dueDate) < new Date()
    );
  }

  toggleTaskStatus(task: Task): void {
    if (task.status === TaskStatus.Completed) {
      this.dataService.updateTask(task.id, {
        status: TaskStatus.Pending,
        completedAt: undefined,
      });
    } else {
      this.dataService.completeTask(task.id);
    }
  }

  updateTaskStatus(task: Task, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const status = select.value as TaskStatus;
    this.dataService.updateTask(task.id, { status });

    if (status === TaskStatus.Completed) {
      this.dataService.completeTask(task.id);
    }
  }

  openNewTaskModal(): void {
    this.editingTask.set(null);
    this.taskForm = {
      title: "",
      description: "",
      priority: TaskPriority.Medium,
      dueDate: new Date().toISOString().split("T")[0],
      clientId: "",
    };
    this.showTaskModal.set(true);
  }

  openTaskDetail(task: Task): void {
    this.selectedTask.set(task);
  }

  closeTaskDetail(): void {
    this.selectedTask.set(null);
  }

  editTask(task: Task): void {
    this.closeTaskDetail();
    this.editingTask.set(task);
    this.taskForm = {
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      clientId: task.clientId || "",
    };
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.editingTask.set(null);
  }

  saveTask(): void {
    const client = this.clients().find((c) => c.id === this.taskForm.clientId);

    if (this.editingTask()) {
      this.dataService.updateTask(this.editingTask()!.id, {
        title: this.taskForm.title,
        description: this.taskForm.description,
        priority: this.taskForm.priority,
        dueDate: this.taskForm.dueDate,
        clientId: this.taskForm.clientId || undefined,
        clientName: client
          ? `${client.firstName} ${client.lastName}`
          : undefined,
      });
    } else {
      this.dataService.addTask({
        id: `t-${Date.now()}`,
        title: this.taskForm.title,
        description: this.taskForm.description,
        status: TaskStatus.Pending,
        priority: this.taskForm.priority,
        dueDate: this.taskForm.dueDate,
        clientId: this.taskForm.clientId || undefined,
        clientName: client
          ? `${client.firstName} ${client.lastName}`
          : undefined,
        aiGenerated: false,
        createdAt: new Date().toISOString(),
      });
    }

    this.closeTaskModal();
  }

  deleteTask(task: Task, event: Event): void {
    event.stopPropagation();
    // In a real app, you'd confirm and delete
    this.dataService.updateTask(task.id, { status: TaskStatus.Cancelled });
  }

  getPriorityClass(priority: TaskPriority): string {
    const classes: Record<TaskPriority, string> = {
      [TaskPriority.Urgent]: "error",
      [TaskPriority.High]: "warning",
      [TaskPriority.Medium]: "info",
      [TaskPriority.Low]: "success",
    };
    return classes[priority] || "info";
  }
}
