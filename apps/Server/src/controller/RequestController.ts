import type { Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import { idParam } from "../Utils/params";
import { CompleteSchema, ThankYouSchema } from "../Validation/donationSchema";
import * as requestService from "../Services/requestService";

export const mine = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, requests: await requestService.listMine(req.user!.id) });
};

// accept / decline / cancel take the request id and answer with the updated
// request.
const action =
  (run: (userId: string, requestId: string) => Promise<unknown>) => async (req: AuthRequest, res: Response) => {
    res.status(200).json({ success: true, request: await run(req.user!.id, idParam(req)) });
  };

export const accept = action(requestService.accept);
export const decline = action(requestService.decline);
export const cancel = action(requestService.cancel);

export const complete = async (req: AuthRequest, res: Response) => {
  const { code } = CompleteSchema.parse(req.body);
  res.status(200).json({ success: true, request: await requestService.complete(req.user!.id, idParam(req), code) });
};

export const thank = async (req: AuthRequest, res: Response) => {
  const { note } = ThankYouSchema.parse(req.body);
  res.status(200).json({ success: true, request: await requestService.thank(req.user!.id, idParam(req), note) });
};
