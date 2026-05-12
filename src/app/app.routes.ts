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
    path: "upload",
    loadComponent: () =>
      import("./components/excel-upload/excel-upload.component").then(
        (m) => m.ExcelUploadComponent,
      ),
    title: "Excel Upload - Insurance Agent MVP",
  },
  {
    path: "alerts",
    loadComponent: () =>
      import("./components/alerts/alerts.component").then(
        (m) => m.AlertsComponent,
      ),
    title: "AI Alerts - Insurance Agent MVP",
  },
  {
    path: "tasks",
    loadComponent: () =>
      import("./components/tasks/tasks.component").then(
        (m) => m.TasksComponent,
      ),
    title: "Tasks - Insurance Agent MVP",
  },
  {
    path: "email",
    loadComponent: () =>
      import("./components/email/email.component").then(
        (m) => m.EmailComponent,
      ),
    title: "Email - Insurance Agent MVP",
  },
  {
    path: "search",
    loadComponent: () =>
      import("./components/search/search.component").then(
        (m) => m.SearchComponent,
      ),
    title: "Search - Insurance Agent MVP",
  },
  {
    path: "clients",
    loadComponent: () =>
      import("./components/clients/clients.component").then(
        (m) => m.ClientsComponent,
      ),
    title: "Clients - Insurance Agent MVP",
  },
  {
    path: "policies",
    loadComponent: () =>
      import("./components/policies/policies.component").then(
        (m) => m.PoliciesComponent,
      ),
    title: "Policies - Insurance Agent MVP",
  },
  {
    path: "**",
    redirectTo: "dashboard",
  },
];
