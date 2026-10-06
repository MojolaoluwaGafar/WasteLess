import type { Request, Response } from "express";
import { idParam } from "../Utils/params";
import * as profileService from "../Services/profileService";

export const show = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, profile: await profileService.getProfile(idParam(req)) });
};
