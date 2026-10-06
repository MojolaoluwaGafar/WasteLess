import type { Request, Response } from "express";
import type { FoodCategory } from "../types/shared";
import type { AuthRequest } from "../middlewares/Auth";
import { CreateDonationSchema, CreateRequestSchema, UpdateDonationSchema } from "../Validation/donationSchema";
import { FOOD_CATEGORIES } from "../Validation/common";
import { idParam, queryInt, queryText } from "../Utils/params";
import * as donationService from "../Services/donationService";
import * as requestService from "../Services/requestService";

export const browse = async (req: Request, res: Response) => {
  const category = queryText(req, "category");
  const result = await donationService.browse({
    q: queryText(req, "q"),
    category: FOOD_CATEGORIES.includes(category as FoodCategory) ? (category as FoodCategory) : undefined,
    sort: queryText(req, "sort") === "expiring" ? "expiring" : "newest",
    today: queryText(req, "today") === "1",
    partnersOnly: queryText(req, "partners") === "1",
    page: queryInt(req, "page", 1),
    limit: queryInt(req, "limit", 12, 48),
  });
  res.status(200).json({ success: true, ...result });
};

export const detail = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, donation: await donationService.getDetail(idParam(req), req.user?.id) });
};

export const mine = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, donations: await donationService.listMine(req.user!.id) });
};

export const create = async (req: AuthRequest, res: Response) => {
  const input = CreateDonationSchema.parse(req.body);
  res.status(201).json({ success: true, donation: await donationService.create(req.user!.id, input) });
};

export const update = async (req: AuthRequest, res: Response) => {
  const input = UpdateDonationSchema.parse(req.body);
  res.status(200).json({ success: true, donation: await donationService.update(req.user!.id, idParam(req), input) });
};

export const remove = async (req: AuthRequest, res: Response) => {
  await donationService.remove(req.user!.id, idParam(req));
  res.status(200).json({ success: true, message: "Listing deleted." });
};

export const requestFood = async (req: AuthRequest, res: Response) => {
  const { message } = CreateRequestSchema.parse(req.body);
  res.status(201).json({ success: true, request: await requestService.create(req.user!.id, idParam(req), message) });
};
