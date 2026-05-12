import { CommonModule } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { NavigationEnd, Router, RouterModule } from "@angular/router";
import { filter } from "rxjs";
import { DataService } from "./services/data.service";
import { LocaleService } from "./services/locale.service";
import { TranslateService } from "./services/translate.service";

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.less",
})
export class AppComponent {
  private dataService = inject(DataService);
  private router = inject(Router);
  private localeService = inject(LocaleService);
  private translateService = inject(TranslateService);

  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  pageTitle = signal("Dashboard");

  currentLocale = this.localeService.currentLocale;
  isRtl = this.localeService.isRtl;

  // Track translation loading state for reactivity
  translationsLoaded = this.translateService.isLoaded;

  unreadAlerts = computed(() => this.dataService.unreadAlerts().length);
  pendingTasks = computed(() => this.dataService.pendingTasks().length);

  // Translation helper - reads from signal so it's reactive
  t(key: string, params?: Record<string, string | number>): string {
    return this.translateService.get(key, params);
  }

  // navItems recomputes when translations change (due to translationsLoaded dependency)
  navItems = computed<NavItem[]>(() => {
    // This dependency ensures recomputation when translations load
    const _ = this.translationsLoaded();

    return [
      { label: this.t("nav.dashboard"), route: "/dashboard", icon: "📊" },
      { label: this.t("nav.upload"), route: "/upload", icon: "📤" },
      {
        label: this.t("nav.alerts"),
        route: "/alerts",
        icon: "🔔",
        badge: this.unreadAlerts(),
      },
      {
        label: this.t("nav.tasks"),
        route: "/tasks",
        icon: "📋",
        badge: this.pendingTasks(),
      },
      { label: this.t("nav.email"), route: "/email", icon: "✉️" },
      { label: this.t("nav.search"), route: "/search", icon: "🔍" },
      { label: this.t("nav.clients"), route: "/clients", icon: "👥" },
      { label: this.t("nav.policies"), route: "/policies", icon: "📄" },
    ];
  });

  constructor() {
    // Update page title on navigation
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.updatePageTitle(url);
      });
  }

  private updatePageTitle(url: string): void {
    const titleKeys: Record<string, string> = {
      "/dashboard": "nav.dashboard",
      "/upload": "nav.upload",
      "/alerts": "nav.alerts",
      "/tasks": "nav.tasks",
      "/email": "nav.email",
      "/search": "nav.search",
      "/clients": "nav.clients",
      "/policies": "nav.policies",
    };
    const key = titleKeys[url] || "nav.dashboard";
    this.pageTitle.set(this.t(key));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  navigateToSearch(): void {
    this.router.navigate(["/search"]);
  }

  toggleLanguage(): void {
    this.localeService.toggleLocale();
    // Update page title after language change
    const url = this.router.url;
    setTimeout(() => this.updatePageTitle(url), 100);
  }
}
