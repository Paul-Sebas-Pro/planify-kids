import * as argon2 from "argon2";
import { prisma } from "../config/database";

const badges = [
  {
    name: "Première tâche",
    description: "A complété sa toute première tâche",
    icon: "🌟",
    conditionType: "TASKS_COMPLETED",
    conditionValue: 1,
  },
  {
    name: "Apprenti",
    description: "A complété 10 tâches",
    icon: "📚",
    conditionType: "TASKS_COMPLETED",
    conditionValue: 10,
  },
  {
    name: "Travailleur",
    description: "A complété 50 tâches",
    icon: "💪",
    conditionType: "TASKS_COMPLETED",
    conditionValue: 50,
  },
  {
    name: "Champion",
    description: "A complété 100 tâches",
    icon: "🏆",
    conditionType: "TASKS_COMPLETED",
    conditionValue: 100,
  },
  {
    name: "Collecteur",
    description: "A accumulé 100 points",
    icon: "💰",
    conditionType: "POINTS",
    conditionValue: 100,
  },
  {
    name: "Riche",
    description: "A accumulé 500 points",
    icon: "💎",
    conditionType: "POINTS",
    conditionValue: 500,
  },
  {
    name: "Millionnaire",
    description: "A accumulé 1000 points",
    icon: "👑",
    conditionType: "POINTS",
    conditionValue: 1000,
  },
];

async function seedBadges() {
  const existing = await prisma.badge.count();
  if (existing > 0) {
    console.log(`Badges already seeded (${existing} found), skipping.`);
    return;
  }
  await prisma.badge.createMany({ data: badges });
  console.log(`${badges.length} badges seeded.`);
}

async function seedDemoFamily() {
  const existing = await prisma.user.findUnique({
    where: { email: "demo@planify.kids" },
  });
  if (existing) {
    console.log("Demo user already exists, skipping.");
    return;
  }

  const passwordHash = await argon2.hash("demo1234");

  const family = await prisma.family.create({
    data: { name: "Famille Demo" },
  });

  const user = await prisma.user.create({
    data: { email: "demo@planify.kids", passwordHash },
  });

  await prisma.familyMember.createMany({
    data: [
      {
        familyId: family.id,
        userId: user.id,
        name: "Parent Demo",
        role: "PARENT",
        color: "#6C63FF",
      },
      {
        familyId: family.id,
        name: "Alice",
        role: "CHILD",
        color: "#FF6584",
        birthDate: new Date("2016-03-12"),
      },
      {
        familyId: family.id,
        name: "Tom",
        role: "CHILD",
        color: "#43C6AC",
        birthDate: new Date("2018-07-25"),
      },
    ],
  });

  console.log("Demo family seeded:");
  console.log("  Email    : demo@planify.kids");
  console.log("  Password : demo1234");
  console.log("  Members  : Parent Demo, Alice, Tom");
}

async function main() {
  await seedBadges();
  await seedDemoFamily();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
