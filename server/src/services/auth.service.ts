import bcrypt from "bcryptjs";
import { Role, User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { sessionService } from "./session.service";

type SafeUser = Omit<User, "passwordHash">;

export class AuthService {
  private toSafeUser(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private issueTokens(user: User) {
    const payload = { sub: user.id, email: user.email, orgId: user.orgId, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  async login(email: string, password: string, userAgent?: string | null) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = this.issueTokens(user);
    await sessionService.createSession(user.id, tokens.refreshToken, userAgent);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async register(email: string, password: string, orgName: string, userAgent?: string | null) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("Email already in use", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({ data: { name: orgName } });
      return tx.user.create({
        data: { email, passwordHash, orgId: organization.id, role: Role.ADMIN },
      });
    });

    const tokens = this.issueTokens(user);
    await sessionService.createSession(user.id, tokens.refreshToken, userAgent);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError("User no longer exists", 401);
    }

    const session = await sessionService.findSessionByToken(user.id, refreshToken);
    if (!session) {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    const tokens = this.issueTokens(user);
    await sessionService.rotateSession(session.id, tokens.refreshToken);
    return { ...tokens, user: this.toSafeUser(user) };
  }

  async logout(refreshToken: string): Promise<void> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return;
    }
    await sessionService.deleteSessionByToken(payload.sub, refreshToken);
  }
}

export const authService = new AuthService();
