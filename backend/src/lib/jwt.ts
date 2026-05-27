import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "fallback-dev-secret";

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export function signToken(payload: JwtPayload, rememberMe = false): string {
  return jwt.sign(payload, SECRET, {
    expiresIn: rememberMe ? "30d" : "1d",
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
