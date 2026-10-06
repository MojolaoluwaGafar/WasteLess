import mongoose from "mongoose";
import { connectDB } from "../config/DB";
import { moveLegacyTrackedItems } from "../db/migrate";

// Moves food tracked with the first version of the app into pantry history.
// The server also does this on every start, so this is only needed to run it
// by hand (for example against a copy of the database).
//
//   npm run migrate:legacy

async function main() {
  await connectDB();
  const { users, items } = await moveLegacyTrackedItems();
  console.log(`Moved ${items} tracked items from ${users} users into pantry history.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
