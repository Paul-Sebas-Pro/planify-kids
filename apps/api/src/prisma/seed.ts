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

async function main() {
  const existing = await prisma.badge.count();
  if (existing > 0) {
    console.log(`Badges already seeded (${existing} found), skipping.`);
    return;
  }

  await prisma.badge.createMany({ data: badges });
  console.log(`${badges.length} badges seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
