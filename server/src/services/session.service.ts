import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

const MAX_SESSIONS_PER_USER = 5;

function hashToken(token: string): string {
  return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export class SessionService {
  async createSession(userId: string, refreshToken: string, userAgent?: string | null) {
    const refreshTokenHash = hashToken(refreshToken);

    const session = await prisma.session.create({
      data: { userId, refreshTokenHash, userAgent: userAgent ?? undefined },
    });

    const count = await prisma.session.count({ where: { userId } });
    if (count > MAX_SESSIONS_PER_USER) {
      const excess = count - MAX_SESSIONS_PER_USER;
      const oldest = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: excess,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.session.deleteMany({ where: { id: { in: oldest.map((s) => s.id) } } });
      }
    }

    return session;
  }

  async findSessionByToken(userId: string, refreshToken: string) {
    const hash = hashToken(refreshToken);
    const session = await prisma.session.findFirst({ where: { userId, refreshTokenHash: hash } });
    if (!session) return null;
    return safeEqual(hash, session.refreshTokenHash) ? session : null;
  }

  async touchSession(sessionId: string): Promise<void> {
    await prisma.session.update({ where: { id: sessionId }, data: { lastUsedAt: new Date() } });
  }

  async rotateSession(sessionId: string, newRefreshToken: string): Promise<void> {
    const refreshTokenHash = hashToken(newRefreshToken);
    await prisma.session.update({
      where: { id: sessionId },
      data: { refreshTokenHash, lastUsedAt: new Date() },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
  }

  async deleteSessionByToken(userId: string, refreshToken: string): Promise<void> {
    const session = await this.findSessionByToken(userId, refreshToken);
    if (session) await this.deleteSession(session.id);
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }
}

export const sessionService = new SessionService();
