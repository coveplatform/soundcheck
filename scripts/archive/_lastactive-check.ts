import { prisma } from "../../src/lib/prisma";

async function main() {
  const now = new Date();
  const day1  = new Date(now.getTime() - 1  * 24 * 60 * 60 * 1000);
  const day7  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [total, nullActive, within1d, within7d, within30d, over30d] = await Promise.all([
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } } } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } }, lastActiveAt: null } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } }, lastActiveAt: { gt: day1 } } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } }, lastActiveAt: { gt: day7, lte: day1 } } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } }, lastActiveAt: { gt: day30, lte: day7 } } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: "@seed.mixreflect.com" } }, lastActiveAt: { lte: day30 } } }),
  ]);

  console.log(`Real users (non-seed): ${total}`);
  console.log(`  lastActiveAt = null:       ${nullActive}  ← never tracked / old accounts`);
  console.log(`  Active within 24h:         ${within1d}`);
  console.log(`  Active 1–7 days ago:       ${within7d}`);
  console.log(`  Active 7–30 days ago:      ${within30d}`);
  console.log(`  Active 30+ days ago:       ${over30d}`);

  await prisma.$disconnect();
}

main().catch(console.error);
