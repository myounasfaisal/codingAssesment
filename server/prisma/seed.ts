import { PrismaClient, Role, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TASK_TITLES = [
  "Fix login bug",
  "Write API docs",
  "Set up CI pipeline",
  "Refactor auth middleware",
  "Investigate slow query on dashboard",
  "Add pagination to tasks list",
  "Design onboarding flow",
  "Update dependency versions",
  "Write integration tests for billing",
  "Fix flaky e2e test",
  "Improve error messages on signup form",
  "Add dark mode support",
  "Migrate database to new schema",
  "Optimize image upload pipeline",
  "Draft release notes for v2.1",
  "Review pull request #482",
  "Set up staging environment",
  "Fix memory leak in worker process",
  "Add rate limiting to public API",
  "Create user analytics dashboard",
  "Patch security vulnerability in deps",
  "Write postmortem for outage",
  "Implement password reset flow",
  "Add unit tests for task service",
  "Clean up unused feature flags",
  "Improve mobile responsiveness",
  "Set up error tracking with Sentry",
  "Write onboarding email templates",
  "Add CSV export for reports",
  "Fix timezone bug in due dates",
  "Update privacy policy copy",
  "Add keyboard shortcuts",
  "Set up automated backups",
  "Reduce bundle size",
  "Fix broken search filters",
  "Add audit log for admin actions",
  "Improve accessibility on forms",
  "Set up load testing",
  "Fix duplicate notification bug",
  "Write architecture decision record",
  "Add webhook support",
  "Fix CORS issue on production",
  "Update team wiki",
  "Add multi-language support",
  "Fix incorrect task count on sidebar",
  "Automate deployment rollback",
  "Add drag-and-drop task reordering",
  "Fix race condition in task updates",
  "Write load balancer config",
  "Add SSO integration",
];

const TAG_POOL = [
  "backend",
  "frontend",
  "bug",
  "urgent",
  "docs",
  "infra",
  "security",
  "testing",
  "ux",
  "performance",
];

const STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
const PRIORITIES = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTags(): string[] {
  const count = Math.floor(Math.random() * 3); // 0-2 tags
  const shuffled = [...TAG_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomDueDate(index: number): Date | null {
  // Roughly a third no due date, a third overdue, a third future.
  const bucket = index % 3;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (bucket === 0) return null;
  if (bucket === 1) {
    // overdue: 1-30 days in the past
    return new Date(now - (1 + Math.floor(Math.random() * 30)) * day);
  }
  // future: 1-30 days ahead
  return new Date(now + (1 + Math.floor(Math.random() * 30)) * day);
}

async function main() {
  // Delete in FK-safe order.
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash("Password1!", 10);

  const orgA = await prisma.organization.create({ data: { name: "Org A" } });
  const orgB = await prisma.organization.create({ data: { name: "Org B" } });

  const [adminA, managerA, user1A, user2A] = await Promise.all([
    prisma.user.create({
      data: { email: "admin@orga.com", passwordHash, role: Role.ADMIN, orgId: orgA.id },
    }),
    prisma.user.create({
      data: { email: "manager@orga.com", passwordHash, role: Role.MANAGER, orgId: orgA.id },
    }),
    prisma.user.create({
      data: { email: "user1@orga.com", passwordHash, role: Role.USER, orgId: orgA.id },
    }),
    prisma.user.create({
      data: { email: "user2@orga.com", passwordHash, role: Role.USER, orgId: orgA.id },
    }),
  ]);

  const [user3B, user4B] = await Promise.all([
    prisma.user.create({
      data: { email: "user3@orgb.com", passwordHash, role: Role.USER, orgId: orgB.id },
    }),
    prisma.user.create({
      data: { email: "user4@orgb.com", passwordHash, role: Role.USER, orgId: orgB.id },
    }),
  ]);

  const orgAUsers = [adminA, managerA, user1A, user2A];
  const orgBUsers = [user3B, user4B];

  const taskData = TASK_TITLES.map((title, i) => {
    // Alternate orgs roughly evenly, biasing slightly toward Org A.
    const inOrgA = i % 5 !== 4; // 4 out of 5 in Org A, 1 out of 5 in Org B
    const org = inOrgA ? orgA : orgB;
    const owner = pick(inOrgA ? orgAUsers : orgBUsers);
    const status = pick(STATUSES);
    const dueDate = randomDueDate(i);

    return {
      orgId: org.id,
      ownerId: owner.id,
      title,
      description: Math.random() > 0.3 ? `Details for: ${title.toLowerCase()}.` : null,
      status,
      priority: pick(PRIORITIES),
      tags: pickTags(),
      dueDate,
    };
  });

  await prisma.task.createMany({ data: taskData });

  console.log(
    `Seeded ${2} organizations, ${orgAUsers.length + orgBUsers.length} users, ${taskData.length} tasks.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
