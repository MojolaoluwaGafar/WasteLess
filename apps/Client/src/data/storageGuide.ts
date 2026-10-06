import type { FoodCategory } from "../types";

// How to keep common foods fresh, for the Storage guide page and the pantry
// (which uses `days` to suggest a best-before date and `category` to fill in
// the category as you type). Days are typical, not guarantees: always check
// the food itself.

export interface StorageTip {
  name: string;
  /** Other names people type, lower case. */
  aliases: string[];
  category: FoodCategory;
  /** Where it keeps best. */
  storage: string;
  /** Roughly how long it keeps there, in days. */
  days: number;
  shelfLife: string;
  tips: string[];
}

export const STORAGE_GUIDE: StorageTip[] = [
  {
    name: "Tomatoes",
    aliases: ["tomato"],
    category: "produce",
    storage: "Room temperature until ripe, then the fridge",
    days: 5,
    shelfLife: "3–5 days ripe; a week more in the fridge",
    tips: ["Store stem-side down, out of direct sun.", "Blend soft ones with pepper and onion and freeze as stew base."],
  },
  {
    name: "Peppers (tatashe, rodo)",
    aliases: ["pepper", "peppers", "tatashe", "rodo", "scotch bonnet", "bell pepper"],
    category: "produce",
    storage: "Fridge, in a paper bag",
    days: 7,
    shelfLife: "1–2 weeks",
    tips: ["Keep them dry: moisture makes them soft.", "Blend and freeze in ice-cube trays for instant stew."],
  },
  {
    name: "Onions",
    aliases: ["onion"],
    category: "produce",
    storage: "Cool, dry, airy place (not the fridge)",
    days: 30,
    shelfLife: "1–2 months whole",
    tips: ["Keep away from potatoes: they spoil each other.", "Once cut, wrap and refrigerate for up to a week."],
  },
  {
    name: "Spinach (efo, ugu)",
    aliases: ["spinach", "efo", "ugu", "greens", "pumpkin leaves", "vegetable leaves", "lettuce"],
    category: "produce",
    storage: "Fridge, wrapped in a dry paper towel",
    days: 3,
    shelfLife: "3–5 days",
    tips: ["Don't wash until you cook it.", "Blanch for a minute, squeeze dry and freeze for soups."],
  },
  {
    name: "Okra",
    aliases: ["okro", "okra"],
    category: "produce",
    storage: "Fridge, in a paper bag",
    days: 3,
    shelfLife: "2–3 days",
    tips: ["Keep dry until cooking, or it turns slimy.", "Slice and freeze flat for quick okra soup."],
  },
  {
    name: "Plantain",
    aliases: ["plantains", "dodo"],
    category: "produce",
    storage: "Room temperature",
    days: 6,
    shelfLife: "Green: 1–2 weeks. Ripe: 3–5 days",
    tips: ["Separate the fingers to slow ripening.", "Very ripe? Peel, slice and freeze for plantain porridge or mosa."],
  },
  {
    name: "Bananas",
    aliases: ["banana"],
    category: "produce",
    storage: "Room temperature, hung or apart",
    days: 4,
    shelfLife: "2–7 days",
    tips: ["Wrap the stems to slow ripening.", "Freeze peeled overripe bananas for smoothies or banana bread."],
  },
  {
    name: "Yam",
    aliases: ["yams"],
    category: "produce",
    storage: "Cool, dark, dry place",
    days: 21,
    shelfLife: "2–4 weeks whole; cut pieces 2 days in water in the fridge",
    tips: ["Never refrigerate whole yam.", "Cover cut yam in water and refrigerate, or boil and freeze."],
  },
  {
    name: "Oranges",
    aliases: ["orange", "citrus", "tangerine"],
    category: "produce",
    storage: "Fridge for longest life",
    days: 14,
    shelfLife: "1 week out, 3 weeks chilled",
    tips: ["Juice any going soft and freeze the juice."],
  },
  {
    name: "Avocado",
    aliases: ["avocados", "pear"],
    category: "produce",
    storage: "Room temperature until ripe, then the fridge",
    days: 3,
    shelfLife: "2–3 days ripe",
    tips: ["Keep a cut half with the stone in, wrapped, with a squeeze of lime."],
  },
  {
    name: "Bread",
    aliases: ["loaf", "agege", "bread loaf", "buns"],
    category: "bakery",
    storage: "Bread bin or paper bag; freezer for longer",
    days: 3,
    shelfLife: "3–5 days; 3 months frozen",
    tips: ["Don't refrigerate: it goes stale faster.", "Freeze in slices and toast from frozen."],
  },
  {
    name: "Eggs",
    aliases: ["egg"],
    category: "dairy",
    storage: "Fridge, in their box",
    days: 21,
    shelfLife: "3–5 weeks",
    tips: ["Unsure? A fresh egg sinks in water; an old one floats.", "Keep them in the box, not the door."],
  },
  {
    name: "Milk",
    aliases: ["fresh milk"],
    category: "dairy",
    storage: "Fridge, at the back (coldest)",
    days: 5,
    shelfLife: "5–7 days once opened",
    tips: ["Close tightly and return it to the fridge straight away.", "Freeze in portions; shake after thawing."],
  },
  {
    name: "Yoghurt",
    aliases: ["yogurt", "yoghurt"],
    category: "dairy",
    storage: "Fridge",
    days: 7,
    shelfLife: "1–2 weeks sealed",
    tips: ["Use as a marinade or in smoothies when near its date."],
  },
  {
    name: "Cheese",
    aliases: ["wara"],
    category: "dairy",
    storage: "Fridge, wrapped in paper",
    days: 14,
    shelfLife: "1–4 weeks (wara: 2–3 days in water)",
    tips: ["Keep wara covered in water and change it daily."],
  },
  {
    name: "Cooked rice (jollof, fried rice)",
    aliases: ["rice", "jollof", "jollof rice", "fried rice", "cooked rice", "leftover rice"],
    category: "cooked",
    storage: "Fridge within 1 hour of cooking",
    days: 1,
    shelfLife: "1 day in the fridge; 1 month frozen",
    tips: ["Cool it fast: spread it out on a tray.", "Reheat only once, until steaming hot."],
  },
  {
    name: "Stew and soups",
    aliases: ["stew", "soup", "egusi", "efo riro", "ogbono", "pepper soup", "leftover stew"],
    category: "cooked",
    storage: "Fridge, in a covered container",
    days: 3,
    shelfLife: "3–4 days; 3 months frozen",
    tips: ["Freeze in single portions.", "Boil before eating again."],
  },
  {
    name: "Chicken and meat",
    aliases: ["chicken", "beef", "meat", "goat meat", "turkey"],
    category: "cooked",
    storage: "Fridge (raw: bottom shelf) or freezer",
    days: 2,
    shelfLife: "Raw 1–2 days; cooked 3 days",
    tips: ["Keep raw meat below everything else in the fridge.", "Thaw in the fridge, not on the counter."],
  },
  {
    name: "Fish",
    aliases: ["fish", "titus", "mackerel", "catfish"],
    category: "cooked",
    storage: "Fridge or freezer",
    days: 1,
    shelfLife: "Fresh 1–2 days; smoked 2 weeks dry",
    tips: ["Smoke or fry fish you can't use in a day."],
  },
  {
    name: "Uncooked rice",
    aliases: ["raw rice", "bag of rice", "ofada"],
    category: "pantry",
    storage: "Airtight container, cool and dry",
    days: 180,
    shelfLife: "6 months to years",
    tips: ["A bay leaf in the container keeps weevils away."],
  },
  {
    name: "Beans",
    aliases: ["honey beans", "black-eyed peas", "beans"],
    category: "pantry",
    storage: "Airtight container, cool and dry",
    days: 180,
    shelfLife: "Up to a year dry; cooked 4 days chilled",
    tips: ["Cook a big pot and freeze portions for quick meals."],
  },
  {
    name: "Garri",
    aliases: ["gari", "cassava flakes"],
    category: "pantry",
    storage: "Airtight container, dry",
    days: 120,
    shelfLife: "4–6 months",
    tips: ["Keep fully dry: any damp makes it mould."],
  },
  {
    name: "Juice",
    aliases: ["juice", "zobo", "kunu", "soft drink"],
    category: "drinks",
    storage: "Fridge once opened",
    days: 5,
    shelfLife: "5–7 days opened; zobo 3–4 days",
    tips: ["Freeze leftover juice as ice lollies.", "Keep zobo cold and covered."],
  },
];

// The guide entry for what someone typed ("jollof", "Tomatoes"), if any.
export function findTip(text: string): StorageTip | undefined {
  const query = text.trim().toLowerCase();
  if (query.length < 3) return undefined;
  return (
    STORAGE_GUIDE.find((tip) => tip.name.toLowerCase() === query || tip.aliases.includes(query)) ??
    STORAGE_GUIDE.find((tip) => tip.aliases.some((alias) => query.includes(alias)) || tip.name.toLowerCase().startsWith(query))
  );
}
