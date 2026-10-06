import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import type { AccountType, AuthResponse, User as UserDto } from "../types/shared";
import { User, type UserDoc } from "../Models/User";
import { jwtSecret, type JWTPayLoad } from "../middlewares/Auth";
import { escapeRegex } from "../Utils/params";
import { logger } from "../Utils/logger";
import { resetPasswordEmail } from "../emails/templates";
import { notifyNow } from "./notifyService";
import { ServiceError } from "./errors";

const TOKEN_LIFETIME = "7d";
const RESET_LIFETIME_MS = 30 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so a wrong email takes as long
// to reject as a wrong password (and can't be used to find accounts).
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8yJ1Xc0Yy9oQH1d5rN0l8mXvZ3s3aK";

// Google sign-in tokens must be issued for one of our OAuth clients: the one
// in GOOGLE_CLIENT_ID, and the live web app's (also the Client's fallback in
// apps/Client/src/utils/google.ts), so sign-in keeps working while a host
// still has an old ID configured.
const LIVE_GOOGLE_CLIENT_ID = "696845003047-5d1gev6gienmpk35ebffauo7gk78dh6k.apps.googleusercontent.com";
const googleClientIds = [...new Set([process.env.GOOGLE_CLIENT_ID?.trim(), LIVE_GOOGLE_CLIENT_ID].filter(Boolean))] as string[];
const googleClient = new OAuth2Client();

export function toUserDto(user: UserDoc): UserDto {
  return {
    id: String(user._id),
    // Some accounts from the first version were saved without a name.
    name: user.name?.trim() || user.email.split("@")[0],
    email: user.email,
    phone: user.phone ?? null,
    location: user.location ?? null,
    hasPassword: Boolean(user.password),
    accountType: (user.accountType ?? "individual") as AccountType,
    orgName: user.orgName ?? null,
    // Accounts from the first version of the app have no createdAt.
    createdAt: (user.createdAt ?? user._id.getTimestamp()).toISOString(),
  };
}

function signToken(user: UserDoc): string {
  const payload: JWTPayLoad = { id: String(user._id), v: user.tokenVersion ?? 0 };
  return jwt.sign(payload, jwtSecret(), { expiresIn: TOKEN_LIFETIME });
}

const authResponse = (user: UserDoc): AuthResponse => ({ token: signToken(user), user: toUserDto(user) });

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

// Emails are stored lower-case, but accounts from the first version of the
// app may not be, so fall back to a case-insensitive match.
async function findByEmail(email: string, withSecrets = false): Promise<UserDoc | null> {
  const select = withSecrets ? "+password" : "";
  const exact = await User.findOne({ email }).select(select);
  if (exact) return exact;
  return User.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } }).select(select);
}

async function loadUser(id: string, withPassword = false): Promise<UserDoc> {
  const user = await User.findById(id).select(withPassword ? "+password" : "");
  if (!user) throw new ServiceError(401, "Please sign in again.");
  return user;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
  orgName?: string | null;
}

export async function register({ name, email, password, accountType, orgName }: RegisterInput): Promise<AuthResponse> {
  if (await findByEmail(email)) {
    throw new ServiceError(409, "An account with this email already exists. Sign in instead.", "email");
  }
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, BCRYPT_ROUNDS),
    accountType,
    orgName: accountType === "individual" ? null : (orgName ?? null),
  });
  return authResponse(user);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await findByEmail(email, true);
  const matches = await bcrypt.compare(password, user?.password || DUMMY_HASH).catch(() => false);

  if (user && !user.password) {
    // Google-only account: say so, rather than "wrong password" forever.
    throw new ServiceError(400, "This account signs in with Google. Use the Google button, or reset your password to add one.");
  }
  if (!user || !matches) throw new ServiceError(401, "That email or password isn't right.");

  return authResponse(user);
}

// `credential` is the ID token from Google's sign-in button. Verifying it
// against our client ID proves Google issued it for this app; an access token
// from some other app can't be replayed here.
export async function googleSignIn(credential: string): Promise<AuthResponse> {
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: googleClientIds });
    payload = ticket.getPayload();
  } catch (error) {
    logger.warn({ err: error }, "Google token rejected");
    throw new ServiceError(401, "Google sign-in didn't work. Please try again.");
  }

  if (!payload?.email || !payload.email_verified) {
    throw new ServiceError(400, "Your Google account's email isn't verified.");
  }
  const email = payload.email.toLowerCase();

  let user = (await User.findOne({ googleId: payload.sub }).select("+password")) ?? (await findByEmail(email, true));
  if (user) {
    // An email/password account signing in with Google for the first time,
    // or an old account that was saved without a name.
    const missingName = !user.name?.trim() && payload.name?.trim();
    if (!user.googleId || missingName) {
      if (!user.googleId) user.googleId = payload.sub;
      if (missingName) user.name = payload.name!.trim();
      await user.save();
    }
  } else {
    user = await User.create({ name: payload.name?.trim() || email.split("@")[0], email, googleId: payload.sub });
  }
  return authResponse(user);
}

export async function getMe(id: string): Promise<UserDto> {
  return toUserDto(await loadUser(id, true));
}

export async function updateProfile(
  id: string,
  input: { name: string; phone?: string | null; location?: string | null; accountType: AccountType; orgName?: string | null },
): Promise<UserDto> {
  const user = await loadUser(id, true);
  user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.location !== undefined) user.location = input.location;
  user.accountType = input.accountType;
  user.orgName = input.accountType === "individual" ? null : (input.orgName ?? null);
  await user.save();
  return toUserDto(user);
}

// Signs out every other device and returns a fresh login for this one. A
// Google-only account can set its first password without a current one.
export async function changePassword(id: string, currentPassword: string | undefined, newPassword: string): Promise<AuthResponse> {
  const user = await loadUser(id, true);
  if (user.password) {
    const matches = await bcrypt.compare(currentPassword ?? "", user.password).catch(() => false);
    if (!matches) throw new ServiceError(400, "Your current password isn't right.", "currentPassword");
  }
  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  return authResponse(user);
}

// Always answers the same way, whether or not the email has an account, so
// the form can't be used to find out who uses WasteLess.
export async function forgotPassword(email: string): Promise<void> {
  const user = await findByEmail(email);
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user._id },
    { resetTokenHash: hashResetToken(token), resetTokenExpires: new Date(Date.now() + RESET_LIFETIME_MS) },
  );
  const sent = await notifyNow(user.email, resetPasswordEmail(user.name, token));
  if (!sent) logger.warn({ userId: String(user._id) }, "Reset email was not sent");
}

// Sets the new password, signs out every device, and signs this one in.
export async function resetPassword(token: string, password: string): Promise<AuthResponse> {
  const user = await User.findOne({ resetTokenHash: hashResetToken(token), resetTokenExpires: { $gt: new Date() } }).select(
    "+password",
  );
  if (!user) throw new ServiceError(400, "This reset link has expired or was already used. Ask for a new one.");

  user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  user.set({ resetTokenHash: undefined, resetTokenExpires: undefined });
  await user.save();
  return authResponse(user);
}
