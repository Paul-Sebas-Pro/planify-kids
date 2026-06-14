import type { MiddlewareHandler } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/AppError.js";

export interface JwtPayload {
  sub: string;   // userId
  familyId: string;
  role: "PARENT" | "CHILD";
}

declare module "hono" {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authorization = c.req.header("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token manquant");
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    c.set("user", payload);
    await next();
  } catch {
    throw new UnauthorizedError("Token invalide ou expiré");
  }
};

export const requireRole =
  (...roles: JwtPayload["role"][]): MiddlewareHandler =>
  async (c, next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      throw new UnauthorizedError("Rôle insuffisant");
    }
    await next();
  };
