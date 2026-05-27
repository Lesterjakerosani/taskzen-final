import { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyToken, JwtPayload } from "../lib/jwt";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Wraps an AuthRequest handler so Express's overload resolver accepts it. */
export function h(
  fn: (req: AuthRequest, res: Response) => Promise<void> | void,
): RequestHandler {
  return fn as unknown as RequestHandler;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token ?? req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // ignore invalid tokens for optional auth
    }
  }
  next();
}
