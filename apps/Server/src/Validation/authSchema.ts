import { z } from "zod";
import { emailSchema, optionalText, passwordSchema } from "./common";

const nameSchema = z
  .string({ error: "Enter your name." })
  .trim()
  .min(2, "Enter your name.")
  .max(60, "Use at most 60 characters.");

const accountFields = {
  accountType: z.enum(["individual", "business", "organisation"]).default("individual"),
  orgName: optionalText(80, "The name"),
};

// Businesses and organisations need a name to show on their listings.
const requireOrgName = <T extends { accountType: string; orgName?: string | null }>(value: T) =>
  value.accountType === "individual" || Boolean(value.orgName);
const orgNameIssue = { message: "Add the business or organisation name.", path: ["orgName"] };

export const RegisterSchema = z
  .object({ name: nameSchema, email: emailSchema, password: passwordSchema, ...accountFields })
  .refine(requireOrgName, orgNameIssue);

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password."),
});

// The ID token (JWT) from Google's sign-in button.
export const GoogleSchema = z.object({
  credential: z.string({ error: "Google sign-in didn't complete." }).min(20, "Google sign-in didn't complete."),
});

export const ForgotSchema = z.object({ email: emailSchema });

export const ResetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "This reset link isn't valid. Ask for a new one."),
  password: passwordSchema,
});

export const ProfileSchema = z
  .object({
    name: nameSchema,
    ...accountFields,
    phone: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z
        .string()
        .trim()
        .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.")
        .nullable()
        .optional(),
    ),
    location: optionalText(80, "Your area"),
  })
  .refine(requireOrgName, orgNameIssue);

export const PasswordSchema = z.object({
  // Not needed when a Google-only account sets its first password.
  currentPassword: z.string().optional(),
  newPassword: passwordSchema,
});
