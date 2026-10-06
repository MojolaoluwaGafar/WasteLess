import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import {
  ForgotSchema,
  GoogleSchema,
  LoginSchema,
  PasswordSchema,
  ProfileSchema,
  RegisterSchema,
  ResetSchema,
} from "../Validation/authSchema";
import * as authService from "../Services/authService";

// Validation errors (ZodError) and ServiceErrors thrown here are turned into
// responses by errorHandler (Utils/sendError.ts).

export const register = async (req: Request, res: Response) => {
  const input = RegisterSchema.parse(req.body);
  res.status(201).json({ success: true, ...(await authService.register(input)) });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.login(email, password)) });
};

export const google = async (req: Request, res: Response) => {
  const { credential } = GoogleSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.googleSignIn(credential)) });
};

export const me = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, user: await authService.getMe(req.user!.id) });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const input = ProfileSchema.parse(req.body);
  res.status(200).json({ success: true, user: await authService.updateProfile(req.user!.id, input) });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = PasswordSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.changePassword(req.user!.id, currentPassword, newPassword)) });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = ForgotSchema.parse(req.body);
  await authService.forgotPassword(email);
  res.status(200).json({
    success: true,
    message: "If that email has an account, a reset link is on its way. Check your inbox and spam folder.",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = ResetSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.resetPassword(token, password)) });
};
