import rateLimit from "express-rate-limit";

const tooMany = (message: string) => ({ success: false, message });

// A generous ceiling for everything under /api, mostly to slow down scrapers.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("Too many requests. Please slow down."),
});

// Password guessing and account creation.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("Too many attempts. Try again in 15 minutes."),
});

// Reset emails: stops someone flooding an inbox (and Brevo's daily allowance).
export const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("Too many reset requests. Try again in 15 minutes."),
});

// Asking for food: each request emails a donor.
export const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("You've sent a lot of requests. Please wait a while before sending more."),
});

// Recipe ideas call an AI model, which costs per request.
export const ideasLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("That's a lot of ideas for one hour. Try again a little later."),
});

// Photo uploads use Cloudinary storage.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: tooMany("Too many uploads. Please wait a while."),
});
