import { z } from "zod";
import type { FoodCategory, RecipeIdea } from "../types/shared";
import { PantryItem } from "../Models/PantryItem";
import { daysFromToday } from "../Utils/dates";
import { logger } from "../Utils/logger";

// "Use it up": cooking ideas built around what in the pantry expires first.
// With GROQ_API_KEY set, an AI model writes them for the exact items; without
// it (or if the call fails), ideas come from a built-in guide by category, so
// the feature always answers.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
const LOOKAHEAD_DAYS = 5;
const MAX_ITEMS = 8;

interface PantryInput {
  name: string;
  category: FoodCategory;
}

const AiIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        title: z.string().min(2).max(80),
        uses: z.array(z.string().max(60)).min(1).max(6),
        steps: z.array(z.string().max(220)).min(1).max(5),
        minutes: z.coerce.number().int().min(1).max(240),
      }),
    )
    .min(1)
    .max(4),
});

async function fromAi(items: PantryInput[]): Promise<RecipeIdea[] | null> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15_000),
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You help households in Nigeria and elsewhere cook food before it goes to waste. " +
              "Suggest 3 simple, realistic home recipes that use up the listed items, favouring the first ones " +
              "(they expire soonest). Common West African staples are welcome; assume a basic kitchen with oil, " +
              "salt, onions and pepper. Never suggest eating food that has gone bad. Reply only with JSON: " +
              '{"ideas":[{"title":string,"uses":[item names from the list],"steps":[2-4 short steps],"minutes":number}]}',
          },
          { role: "user", content: `Items, soonest to expire first: ${items.map((item) => item.name).join(", ")}` },
        ],
      }),
    });
    if (!response.ok) {
      logger.warn({ status: response.status }, "Groq ideas request failed");
      return null;
    }
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const parsed = AiIdeasSchema.safeParse(JSON.parse(body.choices?.[0]?.message?.content ?? "{}"));
    if (!parsed.success) {
      logger.warn("Groq ideas came back in an unexpected shape");
      return null;
    }
    return parsed.data.ideas.slice(0, 3).map((idea) => ({ ...idea, source: "ai" as const }));
  } catch (error) {
    logger.warn({ err: error }, "Groq ideas request errored");
    return null;
  }
}

// ------------------------------------------------------------- built-in guide

type GuideIdea = Omit<RecipeIdea, "uses" | "source">;

const GUIDE: Record<FoodCategory, GuideIdea[]> = {
  produce: [
    {
      title: "Everything-in vegetable stew",
      steps: [
        "Chop the vegetables; soft or wrinkly ones are perfect here.",
        "Fry onions and pepper in oil, add the vegetables and a little water.",
        "Simmer 15 minutes until thick. Freeze any extra in portions.",
      ],
      minutes: 30,
    },
    {
      title: "Quick stir-fry",
      steps: ["Slice everything thin.", "Fry hot and fast with garlic, salt and a splash of soy or stock.", "Serve on rice or noodles."],
      minutes: 15,
    },
    {
      title: "Ripe-fruit smoothie",
      steps: ["Peel and chop the fruit.", "Blend with yoghurt, milk or water and a little ice.", "Freeze any left over as ice lollies."],
      minutes: 5,
    },
  ],
  bakery: [
    {
      title: "Bread pudding",
      steps: ["Tear stale bread into a dish.", "Pour over 2 eggs beaten with a cup of milk and some sugar.", "Bake 30 minutes until set and golden."],
      minutes: 40,
    },
    {
      title: "Crunchy croutons",
      steps: ["Cube the bread.", "Toss with oil and salt.", "Toast in a pan or oven until crisp. Keeps for a week in a jar."],
      minutes: 12,
    },
  ],
  cooked: [
    {
      title: "Leftover fried rice",
      steps: ["Fry cold rice in a hot pan with oil.", "Add chopped leftovers and any vegetables.", "Season, then crack in an egg and stir through."],
      minutes: 15,
    },
    {
      title: "Next-day wraps",
      steps: ["Warm the leftovers through until piping hot.", "Roll in flatbreads or wraps with salad.", "Eat today; don't reheat twice."],
      minutes: 10,
    },
  ],
  dairy: [
    {
      title: "Fluffy pancakes",
      steps: ["Whisk 1 cup flour, 1 egg and 1 cup milk.", "Rest 5 minutes.", "Cook spoonfuls in a buttered pan; top with fruit."],
      minutes: 20,
    },
    {
      title: "Loaded omelette",
      steps: ["Beat the eggs with salt.", "Pour into a hot pan and add chopped vegetables or cheese.", "Fold when just set."],
      minutes: 10,
    },
  ],
  pantry: [
    {
      title: "One-pot jollof",
      steps: ["Fry a tomato-pepper blend until the oil rises.", "Add washed rice, stock and seasoning.", "Cover and cook low until tender."],
      minutes: 45,
    },
    {
      title: "Bean porridge",
      steps: ["Soak and boil the beans until soft.", "Add palm oil, onions, pepper and any soft plantain or yam.", "Mash a little to thicken."],
      minutes: 60,
    },
  ],
  drinks: [
    {
      title: "Fruity ice lollies",
      steps: ["Pour juice (or blended fruit) into moulds or small cups.", "Freeze 4 hours.", "Great for juice that's opened and won't be finished."],
      minutes: 5,
    },
  ],
  other: [
    {
      title: "Clear-the-fridge soup",
      steps: ["Fry onions, add everything that needs using.", "Cover with stock or water and simmer 20 minutes.", "Blend or leave chunky."],
      minutes: 30,
    },
  ],
};

function fromGuide(items: PantryInput[]): RecipeIdea[] {
  const ideas: RecipeIdea[] = [];
  const seen = new Set<FoodCategory>();
  // One idea per category, in expiry order, then a second round if there's room.
  for (const round of [0, 1]) {
    for (const item of items) {
      if (ideas.length >= 3) return ideas;
      if (round === 0 && seen.has(item.category)) continue;
      seen.add(item.category);
      const options = GUIDE[item.category] ?? GUIDE.other;
      const idea = options[round % options.length];
      if (ideas.some((existing) => existing.title === idea.title)) continue;
      const uses = items.filter((other) => other.category === item.category).map((other) => other.name).slice(0, 4);
      ideas.push({ ...idea, uses, source: "guide" });
    }
  }
  return ideas.length ? ideas : [{ ...GUIDE.other[0], uses: items.map((item) => item.name).slice(0, 4), source: "guide" }];
}

export async function ideasFor(userId: string): Promise<{ ideas: RecipeIdea[]; basedOn: string[] }> {
  const docs = await PantryItem.find({ user: userId, status: "active", expiryDate: { $lte: daysFromToday(LOOKAHEAD_DAYS) } })
    .sort({ expiryDate: 1 })
    .limit(MAX_ITEMS);
  // Nothing urgent: use whatever is in the pantry.
  const pool = docs.length
    ? docs
    : await PantryItem.find({ user: userId, status: "active" }).sort({ expiryDate: 1 }).limit(MAX_ITEMS);

  const items: PantryInput[] = pool.map((doc) => ({ name: doc.name, category: (doc.category ?? "other") as FoodCategory }));
  if (!items.length) return { ideas: [], basedOn: [] };

  const ideas = (await fromAi(items)) ?? fromGuide(items);
  return { ideas, basedOn: items.map((item) => item.name) };
}
