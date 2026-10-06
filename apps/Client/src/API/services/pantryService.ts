import api from "../index";
import type { PantryFormValues, PantryItem, PantryOutcome, RecipeIdea } from "../../types";

const toPayload = (values: PantryFormValues) => ({
  ...values,
  quantity: Number(values.quantity),
  weightKg: values.weightKg.trim() ? Number(values.weightKg) : null,
});

export const pantryService = {
  async list(view: "active" | "history"): Promise<PantryItem[]> {
    const { data } = await api.get<{ items: PantryItem[] }>("/api/pantry", { params: { view } });
    return data.items;
  },

  async create(values: PantryFormValues): Promise<PantryItem> {
    const { data } = await api.post<{ item: PantryItem }>("/api/pantry", toPayload(values));
    return data.item;
  },

  async update(id: string, values: PantryFormValues): Promise<PantryItem> {
    const { data } = await api.patch<{ item: PantryItem }>(`/api/pantry/${id}`, toPayload(values));
    return data.item;
  },

  async resolve(id: string, outcome: PantryOutcome): Promise<PantryItem> {
    const { data } = await api.post<{ item: PantryItem }>(`/api/pantry/${id}/resolve`, { outcome });
    return data.item;
  },

  async undo(id: string): Promise<PantryItem> {
    const { data } = await api.post<{ item: PantryItem }>(`/api/pantry/${id}/undo`);
    return data.item;
  },

  /** Recipe ideas for what expires soonest. */
  async ideas(): Promise<{ ideas: RecipeIdea[]; basedOn: string[] }> {
    const { data } = await api.post<{ ideas: RecipeIdea[]; basedOn: string[] }>("/api/pantry/ideas");
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/pantry/${id}`);
  },
};
