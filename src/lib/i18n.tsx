"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "ar";

const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "admin.dashboard": "Kid dashboard",
    "admin.enter": "Enter super admin",
    "admin.enterPassword": "Enter the site admin password to manage every family.",
    "admin.openingMessage": "Verifying admin access and preparing the operator dashboard.",
    "admin.openingTitle": "Opening super admin",
    "admin.password": "Password",
    "admin.signOut": "Sign out",
    "admin.subtitle": "Monitor families, parent access, platform balances, and full transaction history.",
    "admin.title": "Super admin",
    "auth.admin": "Admin",
    "auth.checking": "Checking...",
    "auth.create": "Create family vault",
    "auth.createMessage": "Setting up the family space and parent access.",
    "auth.createTitle": "Creating family vault",
    "auth.emailOptional": "Email optional",
    "auth.familyName": "Family name",
    "auth.familyNamePlaceholder": "Your family name",
    "auth.forgot": "Forgot password?",
    "auth.home": "Home",
    "auth.login": "Sign in",
    "auth.newFamily": "New family",
    "auth.openingMessage": "Checking your parent access and loading the family controls.",
    "auth.openingTitle": "Opening parent portal",
    "auth.parentName": "Parent name",
    "auth.parentNameEmail": "Parent name or email",
    "auth.parentNamePlaceholder": "Parent name",
    "auth.parentPortal": "Family portal",
    "auth.parentPortalSubtitle": "Sign in or create your family's allowance vault.",
    "auth.password": "Password",
    "auth.remember": "Keep me signed in on this device",
    "auth.submit": "Enter parent portal",
    "common.language": "Language",
    "common.pleaseWait": "Please wait",
    "common.privacy": "Privacy",
    "common.terms": "Terms",
    "kid.choose": "Choose your profile and enter your PIN.",
    "kid.checking": "Checking PIN",
    "kid.dashboard": "Kid dashboard",
    "kid.emptyBody": "Ask a parent to add the kids from the parent portal first.",
    "kid.emptyCta": "Go to parent portal",
    "kid.emptyTitle": "No kid vaults yet",
    "kid.loginBadge": "Kid vault login",
    "kid.loading": "Loading activity in the background...",
    "kid.myBank": "My OB Bank",
    "kid.open": "Open vault",
    "kid.opening": "Opening...",
    "kid.openingVault": "Opening {name}'s vault",
    "kid.parent": "Parent",
    "kid.pin": "PIN",
    "kid.remember": "Remember me on this device",
    "kid.subtitle": "Save, spend carefully, and beat your best score.",
    "kid.switch": "Switch kid",
    "kid.vault": "{name}'s vault",
    "parent.controls": "Parent controls for {family}.",
    "parent.portal": "{name}'s family portal",
    "parent.refreshError": "Could not refresh parent data.",
    "parent.signOut": "Sign out"
  },
  ar: {
    "admin.dashboard": "لوحة الأطفال",
    "admin.enter": "دخول المشرف العام",
    "admin.enterPassword": "أدخل كلمة مرور المشرف لإدارة المنصة.",
    "admin.openingMessage": "يتم التحقق من الصلاحية وتجهيز لوحة التحكم.",
    "admin.openingTitle": "فتح لوحة المشرف",
    "admin.password": "كلمة المرور",
    "admin.signOut": "تسجيل الخروج",
    "admin.subtitle": "تابع العائلات، دخول الأهالي، أرصدة المنصة، وسجل العمليات.",
    "admin.title": "المشرف العام",
    "auth.admin": "المشرف",
    "auth.checking": "جاري التحقق...",
    "auth.create": "إنشاء خزنة العائلة",
    "auth.createMessage": "يتم تجهيز مساحة العائلة وحساب ولي الأمر.",
    "auth.createTitle": "إنشاء خزنة العائلة",
    "auth.emailOptional": "البريد الإلكتروني اختياري",
    "auth.familyName": "اسم العائلة",
    "auth.familyNamePlaceholder": "اسم عائلتك",
    "auth.forgot": "نسيت كلمة المرور؟",
    "auth.home": "الرئيسية",
    "auth.login": "تسجيل الدخول",
    "auth.newFamily": "عائلة جديدة",
    "auth.openingMessage": "يتم التحقق من دخولك وتحميل أدوات العائلة.",
    "auth.openingTitle": "فتح بوابة ولي الأمر",
    "auth.parentName": "اسم ولي الأمر",
    "auth.parentNameEmail": "اسم ولي الأمر أو البريد",
    "auth.parentNamePlaceholder": "اسم ولي الأمر",
    "auth.parentPortal": "بوابة العائلة",
    "auth.parentPortalSubtitle": "سجل الدخول أو أنشئ خزنة مصروف لعائلتك.",
    "auth.password": "كلمة المرور",
    "auth.remember": "تذكرني على هذا الجهاز",
    "auth.submit": "دخول بوابة ولي الأمر",
    "common.language": "اللغة",
    "common.pleaseWait": "يرجى الانتظار",
    "common.privacy": "الخصوصية",
    "common.terms": "الشروط",
    "kid.choose": "اختر ملفك وأدخل رقمك السري.",
    "kid.checking": "جاري فحص الرقم السري",
    "kid.dashboard": "لوحة الأطفال",
    "kid.emptyBody": "اطلب من ولي الأمر إضافة الأطفال من بوابة العائلة.",
    "kid.emptyCta": "اذهب إلى بوابة ولي الأمر",
    "kid.emptyTitle": "لا توجد خزائن للأطفال بعد",
    "kid.loginBadge": "دخول خزنة الطفل",
    "kid.loading": "يتم تحميل النشاط في الخلفية...",
    "kid.myBank": "بنك المصروف",
    "kid.open": "افتح الخزنة",
    "kid.opening": "جاري الفتح...",
    "kid.openingVault": "فتح خزنة {name}",
    "kid.parent": "ولي الأمر",
    "kid.pin": "الرقم السري",
    "kid.remember": "تذكرني على هذا الجهاز",
    "kid.subtitle": "ادخر، أنفق بحكمة، وحاول تحسين نتيجتك.",
    "kid.switch": "تبديل الطفل",
    "kid.vault": "خزنة {name}",
    "parent.controls": "أدوات ولي الأمر لعائلة {family}.",
    "parent.portal": "بوابة عائلة {name}",
    "parent.refreshError": "تعذر تحديث بيانات ولي الأمر.",
    "parent.signOut": "تسجيل الخروج"
  }
};

type I18nContextValue = {
  locale: Locale;
  direction: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("ob-bank-locale");
  if (stored === "ar" || stored === "en") return stored;
  return window.navigator.language.toLowerCase().startsWith("ar") ? "ar" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem("ob-bank-locale", locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[locale];
    return {
      locale,
      direction: locale === "ar" ? "rtl" : "ltr",
      setLocale: setLocaleState,
      t(key, replacements) {
        let text = dictionary[key] ?? dictionaries.en[key] ?? key;
        if (replacements) {
          for (const [token, replacement] of Object.entries(replacements)) {
            text = text.replaceAll(`{${token}}`, String(replacement));
          }
        }
        return text;
      }
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }
  return value;
}
