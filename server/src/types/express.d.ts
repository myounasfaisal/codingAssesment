import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        orgId: string;
        role: Role;
      };
      validatedQuery?: unknown;
    }
  }
}

export {};
