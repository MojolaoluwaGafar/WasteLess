import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import * as impactService from "../Services/impactService";

export const mine = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, impact: await impactService.forUser(req.user!.id) });
};

export const community = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, stats: await impactService.community() });
};
