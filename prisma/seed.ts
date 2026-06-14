import { PrismaClient, TransactionType } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();
const hashPassword = (value: string) => createHash("sha256").update(value).digest("hex");

const accounts = [
  {
    name: "Basil",
    avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=BasilGamer&radius=50&backgroundColor=dceaff",
    currentBalance: 125,
    themeColor: "#2F7DF6",
    profileColor: "#DCEBFF",
    profilePattern: "stars"
  },
  {
    name: "Osama",
    avatarUrl: "https://api.dicebear.com/9.x/adventurer/svg?seed=OsamaSkater&radius=50&backgroundColor=ece4ff",
    currentBalance: 98.5,
    themeColor: "#8E5CF7",
    profileColor: "#ECE4FF",
    profilePattern: "dots"
  }
];

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.historicalLedger.deleteMany();
  await prisma.account.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.family.deleteMany();

  const family = await prisma.family.create({ data: { name: "Jamal Family" } });
  await prisma.parent.create({
    data: {
      familyId: family.id,
      name: "Jamal",
      email: "jamal@obbank.local",
      passwordHash: hashPassword("password")
    }
  });

  const [basil, osama] = await Promise.all(
    accounts.map((account) => prisma.account.create({ data: { ...account, familyId: family.id } }))
  );

  await prisma.transaction.createMany({
    data: [
      {
        accountId: basil.id,
        date: new Date("2026-05-22T10:00:00.000Z"),
        type: TransactionType.Deposit,
        amount: 25,
        reason: "Weekly allowance"
      },
      {
        accountId: osama.id,
        date: new Date("2026-05-22T10:00:00.000Z"),
        type: TransactionType.Deposit,
        amount: 20,
        reason: "Weekly allowance"
      },
      {
        accountId: basil.id,
        date: new Date("2026-05-29T15:30:00.000Z"),
        type: TransactionType.Withdrawal,
        amount: 12,
        reason: "Calculator"
      },
      {
        accountId: osama.id,
        date: new Date("2026-06-05T16:00:00.000Z"),
        type: TransactionType.Withdrawal,
        amount: 8.5,
        reason: "Book fair"
      }
    ]
  });

  await prisma.historicalLedger.createMany({
    data: [
      { date: new Date("2026-05-15"), basilBalance: 92, osamaBalance: 76 },
      { date: new Date("2026-05-22"), basilBalance: 117, osamaBalance: 96 },
      { date: new Date("2026-05-29"), basilBalance: 105, osamaBalance: 96 },
      { date: new Date("2026-06-05"), basilBalance: 125, osamaBalance: 98.5 }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
