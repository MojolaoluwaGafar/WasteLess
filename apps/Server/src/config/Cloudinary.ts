import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
});

export const isCloudinaryConfigured = () =>
  Boolean(cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Listing photos must come from our own Cloudinary account, so a listing can't
// point at an arbitrary site (tracking pixels, offensive hotlinks).
export const isOwnImageUrl = (url: string) =>
  cloudName ? url.startsWith(`https://res.cloudinary.com/${cloudName}/`) : /^https:\/\//.test(url);

export default cloudinary;
