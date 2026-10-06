import type { Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import { uploadImage } from "../Services/uploadService";
import { ServiceError } from "../Services/errors";

export const image = async (req: AuthRequest, res: Response) => {
  if (!req.file) throw new ServiceError(400, "Choose a photo to upload.");
  res.status(201).json({ success: true, ...(await uploadImage(req.file.buffer)) });
};
