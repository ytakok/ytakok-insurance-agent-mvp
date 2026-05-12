import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { SearchResult } from "../../models";
import { DataService } from "../../services/data.service";
import { TranslateService } from "../../services/translate.service";

@Component({
  selector: "app-search",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.less",
})
export class SearchComponent {
  private dataService = inject(DataService);
  private translateService = inject(TranslateService);

  t = (key: string, params?: Record<string, string | number>) =>
    this.translateService.get(key, params);

  searchQuery = signal("");
  selectedFilter = signal("all");
  searchResults = signal<SearchResult[]>([]);

  filters = [
    { value: "all", icon: "🔍" },
    { value: "client", icon: "👥" },
    { value: "policy", icon: "📄" },
    { value: "task", icon: "📋" },
    { value: "alert", icon: "🔔" },
  ];

  recentTasks = computed(() => this.dataService.tasks().slice(0, 5));
  recentAlerts = computed(() => this.dataService.activeAlerts().slice(0, 5));
  recentClients = computed(() => this.dataService.clients().slice(0, 5));
  recentPolicies = computed(() => this.dataService.policies().slice(0, 5));

  filteredResults = computed(() => {
    const results = this.searchResults();
    const filter = this.selectedFilter();

    if (filter === "all") return results;
    return results.filter((r) => r.type === filter);
  });

  onSearch(): void {
    const query = this.searchQuery();
    if (query.length >= 2) {
      this.searchResults.set(this.dataService.search(query));
    } else {
      this.searchResults.set([]);
    }
  }

  clearSearch(): void {
    this.searchQuery.set("");
    this.searchResults.set([]);
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  getFilterCount(type: string): number {
    return this.searchResults().filter((r) => r.type === type).length;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      client: "👤",
      policy: "📄",
      task: "📋",
      alert: "🔔",
    };
    return icons[type] || "📌";
  }

  getMetaKeys(metadata: Record<string, string>): string[] {
    return Object.keys(metadata);
  }

  getQuickAccessTitle(): string {
    const filter = this.selectedFilter();
    const titleKeys: Record<string, string> = {
      all: "search.quickAccess",
      task: "search.recentTasks",
      alert: "search.activeAlerts",
      client: "search.recentClients",
      policy: "search.recentPolicies",
    };
    return this.t(titleKeys[filter] || "search.quickAccess");
  }

  viewResult(result: SearchResult): void {
    // In a real app, navigate to the appropriate detail view
    console.log("View result:", result);
  }
}
