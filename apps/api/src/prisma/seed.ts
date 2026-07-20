import * as argon2 from "argon2";
import { prisma } from "../config/database.js";

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
  {
    name: "En feu",
    description: "3 jours d'affilée avec au moins une tâche complétée",
    icon: "🔥",
    conditionType: "STREAK",
    conditionValue: 3,
  },
  {
    name: "Semaine parfaite",
    description: "7 jours d'affilée avec au moins une tâche complétée",
    icon: "🔥🔥",
    conditionType: "STREAK",
    conditionValue: 7,
  },
  {
    name: "Invincible",
    description: "30 jours d'affilée avec au moins une tâche complétée",
    icon: "🔥🔥🔥",
    conditionType: "STREAK",
    conditionValue: 30,
  },
];

// Additif (par nom) plutôt que "skip si déjà seedé" — sinon ajouter un
// nouveau badge (ex STREAK) ici n'a aucun effet sur une DB déjà seedée
// (dev local, famille démo prod) tant qu'elle n'est pas entièrement réinitialisée.
async function seedBadges() {
  const existingNames = new Set(
    (await prisma.badge.findMany({ select: { name: true } })).map(
      (b: { name: string }) => b.name,
    ),
  );
  const missing = badges.filter((b) => !existingNames.has(b.name));
  if (missing.length === 0) {
    console.log(`Badges already seeded (${existingNames.size} found), skipping.`);
    return;
  }
  await prisma.badge.createMany({ data: missing });
  console.log(
    `${missing.length} new badge(s) seeded (${existingNames.size} already present).`,
  );
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
  const alicePin = await argon2.hash("1234");
  const tomPin = await argon2.hash("5678");

  const family = await prisma.family.create({
    data: { name: "Famille Demo", code: "DEMO01" },
  });

  const user = await prisma.user.create({
    data: { email: "demo@planify.kids", passwordHash },
  });

  const parent = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: user.id,
      name: "Parent Demo",
      role: "PARENT",
      color: "#6C63FF",
    },
  });

  const alice = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: "Alice",
      role: "CHILD",
      color: "#FF6584",
      birthDate: new Date("2016-03-12"),
      pin: alicePin,
    },
  });

  const tom = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      name: "Tom",
      role: "CHILD",
      color: "#43C6AC",
      birthDate: new Date("2018-07-25"),
      pin: tomPin,
    },
  });

  // Tâches démo
  const tasks = await Promise.all([
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        name: "Ranger sa chambre",
        icon: "🛏️",
        difficulty: 1,
        duration: 15,
        points: 10,
        frequency: "daily",
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        name: "Faire la vaisselle",
        icon: "🍽️",
        difficulty: 2,
        duration: 20,
        points: 15,
        frequency: "daily",
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        name: "Lire 20 minutes",
        icon: "📚",
        difficulty: 1,
        duration: 20,
        points: 20,
        frequency: "daily",
      },
    }),
    prisma.taskTemplate.create({
      data: {
        familyId: family.id,
        name: "Promener le chien",
        icon: "🐕",
        difficulty: 2,
        duration: 30,
        points: 25,
        frequency: "daily",
      },
    }),
  ]);

  // Planning semaine courante (lundi → dimanche)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay(); // 0=dimanche
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const schedule = await prisma.schedule.create({
    data: { familyId: family.id, startDate: monday, endDate: sunday, generatedByAI: true },
  });

  const children = [alice, tom];
  const items: {
    scheduleId: string;
    taskTemplateId: string;
    assignedToMemberId: string;
    date: Date;
    status: "PENDING";
  }[] = [];

  let childIndex = 0;
  const cur = new Date(monday);
  while (cur <= sunday) {
    for (const task of tasks) {
      items.push({
        scheduleId: schedule.id,
        taskTemplateId: task.id,
        assignedToMemberId: children[childIndex % 2]!.id,
        date: new Date(cur),
        status: "PENDING",
      });
      childIndex++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  await prisma.scheduleItem.createMany({ data: items });

  console.log("Demo family seeded:");
  console.log("  Email    : demo@planify.kids / demo1234  (parent)");
  console.log("  Code     : DEMO01");
  console.log(`  Alice    : PIN 1234  (id: ${alice.id})`);
  console.log(`  Tom      : PIN 5678  (id: ${tom.id})`);
  console.log(`  Tâches   : ${tasks.length} tâches créées`);
  console.log(`  Planning : ${items.length} items (lun ${monday.toISOString().slice(0,10)} → dim ${sunday.toISOString().slice(0,10)})`);

  // Supprimer la référence unused pour eviter le warning TS
  void parent;
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
