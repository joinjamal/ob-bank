"use client";

import type { Locale } from "@/lib/i18n";

const englishOpeners = [
  "Your vault just did a tiny victory dance",
  "A pancake accountant checked the numbers",
  "Your savings put on superhero socks",
  "A tiny trumpet announced your arrival",
  "The money monster took a nap",
  "Your coins formed a tiny marching band",
  "A ninja piggy bank gave you a thumbs up",
  "The calculator says you are suspiciously awesome",
  "Your money walked in wearing sunglasses",
  "The vault door opened with extra sparkle",
  "A snack-sized dragon is guarding these coins",
  "The budget wizard has entered the chat",
  "Your balance is doing its homework",
  "A tiny robot counted everything twice",
  "The coins are behaving today",
  "Your goal is waving from the finish line",
  "The savings button just flexed",
  "A very serious potato approved this vault",
  "This vault smells like smart choices and pizza",
  "Your vault says please enter dramatically"
];

const englishPunchlines = [
  "future you is already clapping",
  "even the couch coins are impressed",
  "save now, brag politely later",
  "your piggy bank requested a high five",
  "the math is mathing beautifully",
  "your wallet just whispered, nice",
  "today's mission is to be clever with coins",
  "tiny steps can buy surprisingly big things",
  "the spending monster has been told to wait",
  "your goal got one pixel closer",
  "excellent work, captain of coins",
  "keep calm and count snacks",
  "your coins have entered beast mode",
  "the invisible socks can wait",
  "your future snack budget salutes you",
  "the button almost shouted ta-da",
  "this is financial broccoli, but fun",
  "try not to spend it all on invisible pizza",
  "the vault gave that move five stars",
  "your money is standing up straighter"
];

const arabicOpeners = [
  "الخزنة عملت رقصة صغيرة",
  "حصالة نينجا تقول لك ممتاز",
  "الآلة الحاسبة ابتسمت اليوم",
  "النقود دخلت وهي لابسة نظارة شمسية",
  "بطاطا جادة جداً وافقت على فتح الخزنة",
  "هدفك يلوح لك من بعيد",
  "العملات صارت فرقة موسيقية صغيرة",
  "روبوت صغير عد كل شيء مرتين",
  "الخزنة فتحت مع لمعة إضافية",
  "مدرب الادخار يقول خطوة ذكية",
  "الخزنة تقول ادخل بأسلوب بطولي",
  "الهدف أرسل لك تحية سريعة"
];

const arabicPunchlines = [
  "نسختك في المستقبل تصفق لك",
  "حتى العملات تحت الكنبة انبهرت",
  "ادخر الآن وتفاخر بلطف لاحقاً",
  "وحش الصرف ينتظر خارج الباب",
  "هدفك اقترب خطوة صغيرة",
  "الرياضيات اليوم سعيدة جداً",
  "حصالتك تطلب كف تحية",
  "خطوة صغيرة قد تشتري شيئاً كبيراً",
  "أنت قائد العملات اليوم",
  "الصرف العشوائي أخذ إجازة",
  "حصالتك تقول أحسنت",
  "يوم جيد للقرارات الذكية"
];

function nextDailyOpenCount(locale: Locale, kidName: string) {
  if (typeof window === "undefined") return Math.floor(Math.random() * 10_000);

  const dateKey = new Date().toISOString().slice(0, 10);
  const storageKey = `ob-bank-vault-joke:${locale}:${kidName}:${dateKey}`;
  const next = Number(window.localStorage.getItem(storageKey) ?? "0") + 1;
  window.localStorage.setItem(storageKey, String(next));
  return next;
}

function shuffledCount(count: number, total: number) {
  const step = total % 2 === 0 ? total - 1 : total - 2;
  return ((count - 1) * step) % total;
}

function makeLine(openers: string[], punchlines: string[], count: number) {
  const total = openers.length * punchlines.length;
  const index = shuffledCount(count, total);
  const opener = openers[index % openers.length];
  const punchline = punchlines[Math.floor(index / openers.length) % punchlines.length];
  const cycle = Math.floor((count - 1) / total);
  return `${opener}, ${punchline}${cycle > 0 ? ` #${cycle + 1}` : ""}.`;
}

export function makeKidVaultJoke(locale: Locale, kidName: string) {
  const count = nextDailyOpenCount(locale, kidName);

  if (locale === "ar") {
    return makeLine(arabicOpeners, arabicPunchlines, count);
  }

  return makeLine(englishOpeners, englishPunchlines, count);
}
