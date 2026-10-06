import api from "../index";
import type { DonationRequest, MyRequest, PublicProfile } from "../../types";

export type RequestAction = "accept" | "decline" | "cancel";

export const requestService = {
  async mine(): Promise<MyRequest[]> {
    const { data } = await api.get<{ requests: MyRequest[] }>("/api/requests/mine");
    return data.requests;
  },

  /** accept / decline are the donor's; cancel is the requester's. */
  async act(id: string, action: RequestAction): Promise<DonationRequest> {
    const { data } = await api.post<{ request: DonationRequest }>(`/api/requests/${id}/${action}`);
    return data.request;
  },

  /** The donor confirms the handover with the requester's 4-digit code. */
  async complete(id: string, code: string): Promise<DonationRequest> {
    const { data } = await api.post<{ request: DonationRequest }>(`/api/requests/${id}/complete`, { code });
    return data.request;
  },

  async thank(id: string, note: string): Promise<DonationRequest> {
    const { data } = await api.post<{ request: DonationRequest }>(`/api/requests/${id}/thank`, { note });
    return data.request;
  },

  async profile(userId: string): Promise<PublicProfile> {
    const { data } = await api.get<{ profile: PublicProfile }>(`/api/users/${userId}`);
    return data.profile;
  },
};
