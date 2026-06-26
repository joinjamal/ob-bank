"use client";

import type { Locale } from "@/lib/i18n";

const englishOpeners = [
  "Your vault just did a tiny victory dance",
  "A snack-sized dragon is guarding these coins",
  "The calculator says you are suspiciously awesome",
  "Your money walked in wearing sunglasses",
  "A very serious potato approved this vault",
  "The savings button just flexed",
  "Your coins formed a tiny marching band",
  "A ninja piggy bank gave you a thumbs up",
  "This vault smells like smart choices and pizza",
  "The budget wizard has entered the chat",
  "Your balance is doing its homework",
  "A tiny robot counted everything twice",
  "The coins are behaving today",
  "Your goal is waving from the finish line",
  "The vault door opened with extra sparkle"
];

const englishPunchlines = [
  "try not to spend it all on invisible socks",
  "future you is already clapping",
  "even the couch coins are impressed",
  "save now, brag politely later",
  "no llamas were hired as accountants",
  "this is financial broccoli, but fun",
  "your piggy bank requested a high five",
  "the math is mathing beautifully",
  "your wallet just whispered, nice",
  "today's mission: be clever with coins",
  "tiny steps can buy surprisingly big things",
  "the spending monster has been told to wait",
  "your goal got one pixel closer",
  "excellent work, captain of coins",
  "keep calm and count snacks"
];

const englishExtras = [
  "Bonus joke: Why did the coin go to school? To make more cents.",
  "Bonus joke: What do you call a rich fish? A goldfish.",
  "Bonus joke: Why was the math book happy? It finally solved its problems.",
  "Bonus joke: Why did the cookie save money? For chocolate chip upgrades.",
  "Bonus joke: What is a banker's favorite game? Hide and cheque.",
  "Bonus joke: Why did the pencil save up? It wanted a sharp future.",
  "Bonus joke: What did one wall say to the other? Meet you at the corner.",
  "Bonus joke: Why don't eggs tell jokes? They might crack up.",
  "Bonus joke: Why did the banana go to the doctor? It wasn't peeling well.",
  "Bonus joke: What do clouds wear? Thunderwear."
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
  "مدرب الادخار يقول: خطوة ذكية"
];

const arabicPunchlines = [
  "لا تصرفها كلها على جوارب مخفية",
  "نسختك في المستقبل تصفق لك",
  "حتى العملات تحت الكنبة انبهرت",
  "ادخر الآن وتفاخر بلطف لاحقاً",
  "وحش الصرف ينتظر خارج الباب",
  "هدفك اقترب خطوة صغيرة",
  "الرياضيات اليوم سعيدة جداً",
  "حصالتك تطلب كفّ تحية",
  "خطوة صغيرة قد تشتري شيئاً كبيراً",
  "أنت قائد العملات اليوم"
];

const arabicExtras = [
  "نكتة سريعة: لماذا دخلت العملة المدرسة؟ لتصبح أكثر قيمة.",
  "نكتة سريعة: لماذا الكتاب سعيد؟ لأنه حل مشاكله.",
  "نكتة سريعة: لماذا الموز ذهب للطبيب؟ لأنه لم يكن على ما يرام.",
  "نكتة سريعة: ماذا قالت الجدار للجدار؟ نلتقي عند الزاوية.",
  "نكتة سريعة: لماذا البيضة لا تقول نكتاً؟ لأنها قد تنكسر من الضحك.",
  "نكتة سريعة: لماذا القلم يدخر؟ لأنه يريد مستقبلاً حاداً."
];

function pick<T>(items: T[], value: number) {
  return items[Math.abs(value) % items.length];
}

function nextDailyOpenCount(locale: Locale, kidName: string) {
  if (typeof window === "undefined") return Math.floor(Math.random() * 10_000);

  const dateKey = new Date().toISOString().slice(0, 10);
  const storageKey = `ob-bank-vault-joke:${locale}:${kidName}:${dateKey}`;
  const next = Number(window.localStorage.getItem(storageKey) ?? "0") + 1;
  window.localStorage.setItem(storageKey, String(next));
  return next;
}

function makeLine(openers: string[], punchlines: string[], extras: string[], count: number) {
  const openerIndex = (count - 1) % openers.length;
  const punchlineIndex = Math.floor((count - 1) / openers.length) % punchlines.length;
  const extraIndex = Math.floor((count - 1) / (openers.length * punchlines.length)) % extras.length;
  const cycle = Math.floor((count - 1) / (openers.length * punchlines.length * extras.length));
  const cycleSuffix = cycle > 0 ? ` #${cycle + 1}` : "";

  return {
    opener: pick(openers, openerIndex),
    punchline: pick(punchlines, punchlineIndex),
    extra: pick(extras, extraIndex),
    cycleSuffix
  };
}

function shuffleCount(count: number, total: number) {
  const step = total % 2 === 0 ? total - 1 : total - 2;
  return ((count - 1) * step) % total + 1;
}

function makeUniqueLine(locale: Locale, kidName: string) {
  const count = nextDailyOpenCount(locale, kidName);

  if (locale === "ar") {
    const total = arabicOpeners.length * arabicPunchlines.length * arabicExtras.length;
    return makeLine(arabicOpeners, arabicPunchlines, arabicExtras, shuffleCount(count, total));
  }

  const total = englishOpeners.length * englishPunchlines.length * englishExtras.length;
  return makeLine(englishOpeners, englishPunchlines, englishExtras, shuffleCount(count, total));
}

export function makeKidVaultJoke(locale: Locale, kidName: string) {
  const line = makeUniqueLine(locale, kidName);

  if (locale === "ar") {
    return `${line.opener}، ${line.punchline}. ${line.extra}${line.cycleSuffix}`;
  }

  return `${line.opener}, ${line.punchline}. ${line.extra}${line.cycleSuffix}`;
}
