import type { Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import { CreatePantrySchema, ResolvePantrySchema, UpdatePantrySchema } from "../Validation/pantrySchema";
import { idParam, queryText } from "../Utils/params";
import * as pantryService from "../Services/pantryService";
import * as ideasService from "../Services/ideasService";

export const list = async (req: AuthRequest, res: Response) => {
  const view = queryText(req, "view") === "history" ? "history" : "active";
  res.status(200).json({ success: true, items: await pantryService.list(req.user!.id, view) });
};

export const create = async (req: AuthRequest, res: Response) => {
  const input = CreatePantrySchema.parse(req.body);
  res.status(201).json({ success: true, item: await pantryService.create(req.user!.id, input) });
};

export const update = async (req: AuthRequest, res: Response) => {
  const input = UpdatePantrySchema.parse(req.body);
  res.status(200).json({ success: true, item: await pantryService.update(req.user!.id, idParam(req), input) });
};

export const resolve = async (req: AuthRequest, res: Response) => {
  const { outcome } = ResolvePantrySchema.parse(req.body);
  res.status(200).json({ success: true, item: await pantryService.resolve(req.user!.id, idParam(req), outcome) });
};

export const undo = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, item: await pantryService.undo(req.user!.id, idParam(req)) });
};

export const ideas = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, ...(await ideasService.ideasFor(req.user!.id)) });
};

export const remove = async (req: AuthRequest, res: Response) => {
  await pantryService.remove(req.user!.id, idParam(req));
  res.status(200).json({ success: true, message: "Removed." });
};
