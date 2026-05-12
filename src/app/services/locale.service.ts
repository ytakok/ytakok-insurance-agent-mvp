import { isPlatformBrowser } from "@angular/common";
import {
  computed,
  Inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from "@angular/core";

export interface LocaleConfig {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  nativeName: string;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: "en", name: "English", direction: "ltr", nativeName: "English" },
  { code: "he", name: "Hebrew", direction: "rtl", nativeName: "עברית" },
];

const LOCALE_STORAGE_KEY = "insurance-app-locale";
const DEFAULT_LOCALE = "en";

@Injectable({
  providedIn: "root",
})
export class LocaleService {
  private readonly _currentLocale = signal<string>(DEFAULT_LOCALE);

  readonly currentLocale = this._currentLocale.asReadonly();
  readonly supportedLocales = SUPPORTED_LOCALES;

  readonly currentLocaleConfig = computed(() => {
    const code = this._currentLocale();
    return (
      SUPPORTED_LOCALES.find((l) => l.code === code) || SUPPORTED_LOCALES[0]
    );
  });

  readonly direction = computed(() => this.currentLocaleConfig().direction);
  readonly isRtl = computed(() => this.direction() === "rtl");

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLocale();
    }
  }

  private initializeLocale(): void {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
      this._currentLocale.set(stored);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (SUPPORTED_LOCALES.some((l) => l.code === browserLang)) {
        this._currentLocale.set(browserLang);
      }
    }
    this.applyDirection();
  }

  setLocale(locale: string): void {
    if (SUPPORTED_LOCALES.some((l) => l.code === locale)) {
      this._currentLocale.set(locale);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        this.applyDirection();
      }
    }
  }

  private applyDirection(): void {
    const dir = this.direction();
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", this._currentLocale());
  }

  toggleLocale(): void {
    const current = this._currentLocale();
    const newLocale = current === "en" ? "he" : "en";
    this.setLocale(newLocale);
  }
}
