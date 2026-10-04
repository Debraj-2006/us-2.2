import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../asyncHandler";

export const usersRouter = Router();

// Fetch a profile by Firebase uid. Used to restore the signed-in user's
// name/role when a session is resumed (e.g. on page reload).
usersRouter.get(
  "/:uid",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.uid } });
    if (!user) return res.status(404).json({ error: "Profile not found" });
    res.json(user);
  })
);

// Upsert a profile: creates it on first sign-up, and on every later sign-in
// just returns the existing record — name and role are fixed at signup and
// not overwritten by whichever login page was used.
usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { uid, email, name, role, shopName, phone, location } = req.body ?? {};
    if (!uid || !email || !name || (role !== "customer" && role !== "tailor")) {
      return res.status(400).json({ error: "uid, email, name and role ('customer' | 'tailor') are required" });
    }

    const existing = await prisma.user.findUnique({ where: { id: uid } });
    if (existing) return res.json(existing);

    // Only enforced when actually creating the profile (sign-up) — a sign-in
    // upsert for an existing account won't carry these fields, but that's
    // fine since it returns the existing row above before reaching here.
    if (role === "tailor" && (!shopName || !phone || !location)) {
      return res.status(400).json({ error: "shopName, phone and location are required for tailors" });
    }
    if (role === "customer" && (!phone || !location)) {
      return res.status(400).json({ error: "phone and location are required for customers" });
    }

    const created = await prisma.user.create({
      data: { id: uid, email, name, role, shopName, phone, location },
    });
    res.status(201).json(created);
  })
);
