import { Router } from "express";
import { optionalAuth, requireAuth } from "../middlewares/Auth";
import { authLimiter, ideasLimiter, requestLimiter, resetLimiter, uploadLimiter } from "../middlewares/RateLimiter";
import { imageUpload } from "../middlewares/Upload";
import * as auth from "../controller/AuthController";
import * as donations from "../controller/DonationController";
import * as requests from "../controller/RequestController";
import * as pantry from "../controller/PantryController";
import * as impact from "../controller/ImpactController";
import * as uploads from "../controller/UploadController";
import * as profiles from "../controller/ProfileController";

// Every route, mounted under /api in index.ts.
const router = Router();

// ---------------------------------------------------------------- accounts
router.post("/auth/register", authLimiter, auth.register);
router.post("/auth/login", authLimiter, auth.login);
router.post("/auth/google", authLimiter, auth.google);
router.post("/auth/forgot-password", resetLimiter, auth.forgotPassword);
router.post("/auth/reset-password", authLimiter, auth.resetPassword);
router.get("/auth/me", requireAuth, auth.me);
router.patch("/auth/me", requireAuth, auth.updateProfile);
router.post("/auth/password", requireAuth, authLimiter, auth.changePassword);

// ---------------------------------------------------------------- listings
// "/donations/mine" must come before "/donations/:id", or ":id" swallows it.
router.get("/donations", donations.browse);
router.get("/donations/mine", requireAuth, donations.mine);
router.get("/donations/:id", optionalAuth, donations.detail);
router.post("/donations", requireAuth, donations.create);
router.patch("/donations/:id", requireAuth, donations.update);
router.delete("/donations/:id", requireAuth, donations.remove);
router.post("/donations/:id/requests", requireAuth, requestLimiter, donations.requestFood);

// ---------------------------------------------------------------- requests
router.get("/requests/mine", requireAuth, requests.mine);
router.post("/requests/:id/accept", requireAuth, requests.accept);
router.post("/requests/:id/decline", requireAuth, requests.decline);
router.post("/requests/:id/cancel", requireAuth, requests.cancel);
router.post("/requests/:id/complete", requireAuth, requests.complete);
router.post("/requests/:id/thank", requireAuth, requests.thank);

// ---------------------------------------------------------------- people
router.get("/users/:id", profiles.show);

// ---------------------------------------------------------------- pantry
router.get("/pantry", requireAuth, pantry.list);
router.post("/pantry/ideas", requireAuth, ideasLimiter, pantry.ideas);
router.post("/pantry", requireAuth, pantry.create);
router.patch("/pantry/:id", requireAuth, pantry.update);
router.post("/pantry/:id/resolve", requireAuth, pantry.resolve);
router.post("/pantry/:id/undo", requireAuth, pantry.undo);
router.delete("/pantry/:id", requireAuth, pantry.remove);

// ---------------------------------------------------------------- impact & photos
router.get("/impact/me", requireAuth, impact.mine);
router.get("/impact/community", impact.community);
router.post("/uploads/image", requireAuth, uploadLimiter, imageUpload, uploads.image);

export default router;
