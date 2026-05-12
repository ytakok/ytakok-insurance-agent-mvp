import { HttpClient } from "@angular/common/http";
import { Injectable, effect, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { LocaleService } from "./locale.service";

type TranslationData = Record<string, Record<string, string> | string>;

@Injectable({
  providedIn: "root",
})
export class TranslateService {
  private readonly http = inject(HttpClient);
  private readonly localeService = inject(LocaleService);

  private readonly _translations = signal<TranslationData>({});
  private readonly _isLoaded = signal<boolean>(false);
  private loadedLocale: string | null = null;
  private loadingPromise: Promise<void> | null = null;

  readonly translations = this._translations.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly currentLocale = this.localeService.currentLocale;

  constructor() {
    // Load translations immediately
    this.loadingPromise = this.loadTranslations(
      this.localeService.currentLocale(),
    );

    // React to locale changes
    effect(() => {
      const locale = this.localeService.currentLocale();
      if (this.loadedLocale && this.loadedLocale !== locale) {
        this.loadTranslations(locale);
      }
    });
  }

  async loadTranslations(locale: string): Promise<void> {
    if (this.loadedLocale === locale && this._isLoaded()) {
      return;
    }

    try {
      const translations = await firstValueFrom(
        this.http.get<TranslationData>(`assets/i18n/${locale}.json`),
      );
      this._translations.set(translations);
      this._isLoaded.set(true);
      this.loadedLocale = locale;
    } catch (error) {
      console.warn(
        `Failed to load translations for ${locale}, falling back to English`,
      );
      if (locale !== "en") {
        await this.loadTranslations("en");
      }
    }
  }

  /**
   * Wait for translations to be loaded
   */
  async waitForLoad(): Promise<void> {
    if (this.loadingPromise) {
      await this.loadingPromise;
    }
  }

  /**
   * Get a translation by key using dot notation
   * @param key - Translation key (e.g., 'tasks.newTask')
   * @param params - Optional parameters for interpolation (e.g., { count: 5 })
   */
  get(key: string, params?: Record<string, string | number>): string {
    const translations = this._translations();
    const keys = key.split(".");

    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Return key if translation not found
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    // Handle parameter interpolation (e.g., {{count}})
    if (params) {
      return this.interpolate(value, params);
    }

    return value;
  }

  /**
   * Instant translation (synchronous) - returns key if not loaded
   */
  instant(key: string, params?: Record<string, string | number>): string {
    return this.get(key, params);
  }

  private interpolate(
    text: string,
    params: Record<string, string | number>,
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() ?? match;
    });
  }

  /**
   * Change the current locale and reload translations
   */
  async setLocale(locale: string): Promise<void> {
    this.localeService.setLocale(locale);
    await this.loadTranslations(locale);
  }
}
