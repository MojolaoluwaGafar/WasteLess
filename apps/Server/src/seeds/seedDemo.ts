import bcrypt from "bcrypt";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "../config/DB";
import { User } from "../Models/User";
import { Donation } from "../Models/Donation";
import { DonationRequest } from "../Models/DonationRequest";
import { PantryItem } from "../Models/PantryItem";
import { daysFromToday } from "../Utils/dates";

// Demo data for a pitch or a fresh database: a few people, a restaurant and a
// food bank, live listings (some expiring today), two months of past
// handovers with thank-you notes, and a stocked pantry for the demo account.
// Run it against a demo database, not the live one. It does nothing if the
// demo account already exists.
//
//   SEED_PASSWORD=... npm run seed      (every demo account uses this password)
//
// Photos are from Unsplash (free to use). Real listings upload to Cloudinary.

const DEMO_EMAIL = "demo@wasteless.app";
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

const PEOPLE = [
  { key: "ada", name: "Ada Okafor", email: DEMO_EMAIL, accountType: "individual", orgName: null, location: "Yaba, Lagos", phone: "+234 801 234 5678" },
  { key: "kitchen", name: "Tunde Bello", email: "kitchen@wasteless.app", accountType: "business", orgName: "Mama Tunde's Kitchen", location: "Surulere, Lagos", phone: "+234 802 555 0101" },
  { key: "foodbank", name: "Grace Eze", email: "foodbank@wasteless.app", accountType: "organisation", orgName: "Mainland Community Food Bank", location: "Ikeja, Lagos", phone: "+234 803 555 0202" },
  { key: "femi", name: "Femi Adeyemi", email: "femi@wasteless.app", accountType: "individual", orgName: null, location: "Lekki, Lagos", phone: null },
] as const;

type Key = (typeof PEOPLE)[number]["key"];

const LIVE: { by: Key; days: number; listing: Record<string, unknown> }[] = [
  {
    by: "kitchen",
    days: 0,
    listing: {
      title: "20 plates of jollof rice and chicken",
      description: "Cooked this afternoon for a cancelled event. Packed in sealed takeaway packs and kept hot. Perfect for a shelter or a family gathering.",
      category: "cooked",
      quantity: 20,
      unit: "portions",
      weightKg: 9,
      location: "Surulere, Lagos",
      pickupNotes: "Before 9pm today, back entrance. Ask for Tunde.",
      image: photo("photo-1604329760661-e71dc83f8f26"),
    },
  },
  {
    by: "ada",
    days: 0,
    listing: {
      title: "Two loaves of agege bread",
      description: "Unopened bread from this morning. We're travelling and won't finish it.",
      category: "bakery",
      quantity: 2,
      unit: "loaves",
      weightKg: 1.6,
      location: "Yaba, Lagos",
      pickupNotes: "Any time today.",
      image: photo("photo-1509440159596-0249088772ff"),
    },
  },
  {
    by: "femi",
    days: 3,
    listing: {
      title: "Fresh tomatoes and peppers",
      description: "Bought too much at Mile 12 this weekend. Firm, ripe tomatoes and tatashe, enough for two pots of stew.",
      category: "produce",
      quantity: 3,
      unit: "kg",
      weightKg: 3,
      location: "Lekki, Lagos",
      pickupNotes: "Evenings after 6pm. Bring a bag.",
      image: photo("photo-1592924357228-91a4daadcfea"),
    },
  },
  {
    by: "kitchen",
    days: 2,
    listing: {
      title: "Crate of ripe plantain",
      description: "A full crate of plantain that's ripened faster than we can fry it. Great for dodo or plantain porridge.",
      category: "produce",
      quantity: 1,
      unit: "crate",
      weightKg: 12,
      location: "Surulere, Lagos",
      pickupNotes: "Weekdays 10am to 4pm.",
      image: photo("photo-1603052875302-d376b7c0638a"),
    },
  },
  {
    by: "ada",
    days: 4,
    listing: {
      title: "Yoghurt and milk",
      description: "Six cups of plain yoghurt and two cartons of milk, all sealed and refrigerated.",
      category: "dairy",
      quantity: 8,
      unit: "items",
      weightKg: 3.5,
      location: "Yaba, Lagos",
      pickupNotes: null,
      image: photo("photo-1563636619-e9143da7973b"),
    },
  },
  {
    by: "femi",
    days: 60,
    listing: {
      title: "Bag of rice and beans",
      description: "Half a bag of rice and a small bag of honey beans, dry and sealed. Moving house and can't take them.",
      category: "pantry",
      quantity: 2,
      unit: "bags",
      weightKg: 12,
      location: "Lekki, Lagos",
      pickupNotes: "Weekends.",
      image: photo("photo-1586201375761-83865001e31c"),
    },
  },
  {
    by: "kitchen",
    days: 1,
    listing: {
      title: "Moi moi and fried plantain, 15 packs",
      description: "Extra from today's lunch service, packed and refrigerated.",
      category: "cooked",
      quantity: 15,
      unit: "packs",
      weightKg: 6,
      location: "Surulere, Lagos",
      pickupNotes: "Collect tomorrow before noon.",
      image: photo("photo-1567620905732-2d1ec7ab7445"),
    },
  },
];

// Handovers that already happened: [donor, collector, days ago, kg, title, area, thank-you note].
const HISTORY: [Key, Key, number, number, string, string, string | null][] = [
  ["kitchen", "foodbank", 2, 14, "Rice and stew, 30 portions", "Surulere, Lagos", "Fed 30 people at our Saturday drop-in. Thank you!"],
  ["kitchen", "foodbank", 5, 10, "Leftover fried rice", "Surulere, Lagos", "Still warm when we picked it up. The kids loved it."],
  ["ada", "femi", 6, 2, "Box of oranges", "Yaba, Lagos", "Sweetest oranges, thanks Ada!"],
  ["femi", "foodbank", 9, 8, "Yam tubers", "Lekki, Lagos", null],
  ["kitchen", "foodbank", 12, 18, "Party jollof, 40 plates", "Surulere, Lagos", "This covered our whole evening shelter service."],
  ["ada", "foodbank", 16, 4, "Eggs and bread", "Yaba, Lagos", "Breakfast for the hostel sorted. God bless."],
  ["kitchen", "ada", 20, 3, "Pepper soup, 6 bowls", "Surulere, Lagos", "Delicious, and so easy to collect."],
  ["femi", "ada", 26, 5, "Vegetables from the farm", "Lekki, Lagos", null],
  ["kitchen", "foodbank", 33, 12, "Beans and plantain", "Surulere, Lagos", "Reliable every single week."],
  ["ada", "femi", 41, 2.5, "Sealed cereal and milk", "Yaba, Lagos", null],
  ["kitchen", "foodbank", 47, 16, "Catering surplus", "Ikeja, Lagos", "Shared across three families in need."],
];

const PANTRY = [
  { name: "Spinach (efo)", category: "produce", quantity: 1, unit: "bunch", weightKg: 0.3, days: 0 },
  { name: "Tomatoes", category: "produce", quantity: 6, unit: "pieces", weightKg: 0.8, days: 1 },
  { name: "Bread", category: "bakery", quantity: 1, unit: "loaf", weightKg: 0.8, days: 2 },
  { name: "Eggs", category: "dairy", quantity: 12, unit: "items", weightKg: 0.7, days: 9 },
  { name: "Leftover chicken stew", category: "cooked", quantity: 1, unit: "bowl", weightKg: 1, days: -1 },
  { name: "Rice", category: "pantry", quantity: 1, unit: "bag", weightKg: 5, days: 120 },
];

// What the demo account already resolved, so its dashboard has history.
const PANTRY_HISTORY = [
  { name: "Bananas", category: "produce", weightKg: 1.2, status: "used", daysAgo: 3 },
  { name: "Milk", category: "dairy", weightKg: 1, status: "used", daysAgo: 5 },
  { name: "Ofada rice", category: "pantry", weightKg: 2, status: "donated", daysAgo: 11 },
  { name: "Lettuce", category: "produce", weightKg: 0.3, status: "wasted", daysAgo: 13 },
  { name: "Yam", category: "produce", weightKg: 3, status: "used", daysAgo: 18 },
];

async function main() {
  const password = process.env.SEED_PASSWORD?.trim();
  if (!password || password.length < 8) throw new Error("Set SEED_PASSWORD (8+ characters) for the demo accounts.");

  await connectDB();
  if (await User.exists({ email: DEMO_EMAIL })) {
    console.log(`${DEMO_EMAIL} already exists; nothing to do.`);
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  const ids = {} as Record<Key, Types.ObjectId>;
  for (const { key, ...person } of PEOPLE) {
    const existing = await User.findOne({ email: person.email });
    const user = existing ?? (await User.create({ ...person, password: hash, createdAt: daysAgo(70) }));
    ids[key] = user._id;
  }

  await Donation.insertMany(
    LIVE.map(({ by, days, listing }) => ({ ...listing, expiryDate: daysFromToday(days), user: ids[by] })),
  );

  for (const [donor, collector, ago, kg, title, area, note] of HISTORY) {
    const at = daysAgo(ago);
    const [donation] = await Donation.insertMany([
      {
        title,
        description: `${title}, shared through WasteLess.`,
        category: "cooked",
        quantity: 1,
        unit: "batch",
        weightKg: kg,
        location: area,
        image: photo("photo-1546069901-ba9599a7e63c"),
        expiryDate: at,
        status: "collected",
        user: ids[donor],
        collectedAt: at,
        collectedBy: ids[collector],
        createdAt: at,
        updatedAt: at,
      },
    ]);
    await DonationRequest.insertMany([
      {
        donation: donation._id,
        donor: ids[donor],
        requester: ids[collector],
        message: "We'd love to collect this, thank you!",
        status: "collected",
        thankYouNote: note,
        thankedAt: note ? at : null,
        createdAt: at,
        updatedAt: at,
      },
    ]);
  }

  await PantryItem.insertMany([
    ...PANTRY.map(({ days, ...item }) => ({ ...item, expiryDate: daysFromToday(days), user: ids.ada })),
    ...PANTRY_HISTORY.map(({ daysAgo: ago, ...item }) => ({
      ...item,
      quantity: 1,
      unit: "items",
      expiryDate: daysAgo(ago),
      resolvedAt: daysAgo(ago),
      user: ids.ada,
    })),
  ]);

  console.log(
    `Created ${PEOPLE.length} demo accounts (sign in as ${DEMO_EMAIL}), ${LIVE.length} live listings, ` +
      `${HISTORY.length} past handovers and ${PANTRY.length + PANTRY_HISTORY.length} pantry items.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
