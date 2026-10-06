// Mirrors CO2E_PER_KG and EXPIRING_SOON_DAYS in packages/shared (the Server
// can't import values from there, only types). Change both together.

/** kg of CO2-equivalent per kg of food wasted (WRAP / FAO estimates: 2 to 4). */
export const CO2E_PER_KG = 2.5;

/** A meal is roughly 0.5 kg of food (WRAP uses 420 g). */
export const KG_PER_MEAL = 0.5;

/** Pantry items expiring within this many days are flagged. */
export const EXPIRING_SOON_DAYS = 3;

// One decimal place is plenty for kilograms shown on a dashboard.
export const round1 = (value: number) => Math.round(value * 10) / 10;
