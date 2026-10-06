import api from "../index";
import type {
  DonationDetail,
  DonationFormValues,
  DonationRequest,
  DonationSummary,
  FoodCategory,
  MyDonation,
  Paginated,
  UploadResponse,
} from "../../types";

export interface BrowseParams {
  q?: string;
  category?: FoodCategory | "";
  sort?: "newest" | "expiring";
  /** Only food that expires today. */
  today?: boolean;
  /** Only listings from businesses and organisations. */
  partnersOnly?: boolean;
  page?: number;
  limit?: number;
}

// The form keeps numbers as typed; the API wants numbers (or null).
const toPayload = (values: DonationFormValues) => ({
  ...values,
  quantity: Number(values.quantity),
  weightKg: values.weightKg.trim() ? Number(values.weightKg) : null,
  pickupNotes: values.pickupNotes.trim() || null,
});

export const donationService = {
  async browse({ today, partnersOnly, ...params }: BrowseParams): Promise<Paginated<DonationSummary>> {
    const { data } = await api.get<Paginated<DonationSummary>>("/api/donations", {
      params: {
        ...params,
        category: params.category || undefined,
        q: params.q?.trim() || undefined,
        today: today ? 1 : undefined,
        partners: partnersOnly ? 1 : undefined,
      },
    });
    return data;
  },

  async get(id: string): Promise<DonationDetail> {
    const { data } = await api.get<{ donation: DonationDetail }>(`/api/donations/${id}`);
    return data.donation;
  },

  async mine(): Promise<MyDonation[]> {
    const { data } = await api.get<{ donations: MyDonation[] }>("/api/donations/mine");
    return data.donations;
  },

  async create(values: DonationFormValues, pantryItemId?: string | null): Promise<DonationDetail> {
    const { data } = await api.post<{ donation: DonationDetail }>("/api/donations", {
      ...toPayload(values),
      pantryItemId: pantryItemId || null,
      // The form only submits once the pledge is ticked.
      safetyPledge: true,
    });
    return data.donation;
  },

  async update(id: string, values: DonationFormValues): Promise<DonationDetail> {
    const { data } = await api.patch<{ donation: DonationDetail }>(`/api/donations/${id}`, toPayload(values));
    return data.donation;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/donations/${id}`);
  },

  async request(id: string, message: string): Promise<DonationRequest> {
    const { data } = await api.post<{ request: DonationRequest }>(`/api/donations/${id}/requests`, { message });
    return data.request;
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post<UploadResponse>("/api/uploads/image", form, {
      // Let the browser set multipart/form-data with its boundary.
      headers: { "Content-Type": undefined },
    });
    return data;
  },
};
