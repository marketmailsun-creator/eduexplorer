import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  {
    code: 'first_quiz',
    name: 'Quiz Starter',
    description: 'Complete your first quiz',
    xpReward: 5,
    iconName: '🎯',
  },
  {
    code: 'quiz_perfect',
    name: 'Perfect Score',
    description: 'Score 100% on any quiz',
    xpReward: 20,
    iconName: '⭐',
  },
  {
    code: 'streak_3',
    name: 'Streak Starter',
    description: 'Maintain a 3-day learning streak',
    xpReward: 10,
    iconName: '🔥',
  },
  {
    code: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    xpReward: 20,
    iconName: '⚡',
  },
  {
    code: 'streak_30',
    name: 'Month Master',
    description: 'Maintain a 30-day learning streak',
    xpReward: 100,
    iconName: '🏆',
  },
  {
    code: 'explorer_10',
    name: 'Curious Explorer',
    description: 'Search and explore 10 unique topics',
    xpReward: 15,
    iconName: '🔭',
  },
  {
    code: 'xp_100',
    name: 'Knowledge Seeker',
    description: 'Earn 100 XP total',
    xpReward: 0,
    iconName: '📚',
  },
  {
    code: 'xp_500',
    name: 'Learning Champion',
    description: 'Earn 500 XP total',
    xpReward: 0,
    iconName: '🎓',
  },
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: achievement.code },
      update: achievement,
      create: achievement,
    });
  }
  console.log('✅ Achievements seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
