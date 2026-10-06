import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../Models/User";
dotenv.config({ quiet: true });

export interface JWTPayLoad {
  id: string;
  /** The account's tokenVersion when this login was issued. */
  v?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const jwtSecret = (): string => {
  // JWT_SECRET is the name the first version's Render service uses.
  const secret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET_KEY is not defined");
  return secret;
};

// Returns the signed-in user for a request, or null. The account is looked up
// every time, so a login stops working when the account is deleted or its
// password changes (which bumps tokenVersion).
async function readUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  let decoded: JWTPayLoad;
  try {
    decoded = jwt.verify(header.slice(7), jwtSecret()) as unknown as JWTPayLoad;
  } catch {
    return null;
  }

  const user = await User.findById(decoded.id).select("name email tokenVersion").lean();
  if (!user || (user.tokenVersion ?? 0) !== (decoded.v ?? 0)) return null;
  return { id: String(user._id), name: user.name, email: user.email };
}

// For pages that need an account. 401 tells the client to sign out and show
// the login page.
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await readUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: "Please sign in to continue." });
  }
  req.user = user;
  next();
};

// For public pages that show more to a signed-in viewer (a listing's owner
// sees its requests). A missing or stale login just means "anonymous".
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  req.user = (await readUser(req)) ?? undefined;
  next();
};
