import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "../asyncHandler";

export const catalogRouter = Router();

// ---------- Tailor-managed categories ----------

catalogRouter.get(
  "/tailors/:tailorId/categories",
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { tailorId: req.params.tailorId },
      orderBy: { createdAt: "asc" },
    });
    res.json(categories);
  })
);

catalogRouter.post(
  "/tailors/:tailorId/categories",
  asyncHandler(async (req, res) => {
    const { name } = req.body ?? {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const existing = await prisma.category.findUnique({
      where: { tailorId_name: { tailorId: req.params.tailorId, name: name.trim() } },
    });
    if (existing) return res.status(409).json({ error: "A category with this name already exists" });

    const category = await prisma.category.create({
      data: { tailorId: req.params.tailorId, name: name.trim() },
    });
    res.status(201).json(category);
  })
);

// Deleting a category cascades to its products (see schema's onDelete: Cascade).
catalogRouter.delete(
  "/tailors/:tailorId/categories/:categoryId",
  asyncHandler(async (req, res) => {
    const category = await prisma.category.findUnique({ where: { id: req.params.categoryId } });
    if (!category || category.tailorId !== req.params.tailorId) {
      return res.status(404).json({ error: "Category not found" });
    }
    await prisma.category.delete({ where: { id: req.params.categoryId } });
    res.status(204).end();
  })
);

// ---------- Tailor-managed products ----------

catalogRouter.get(
  "/tailors/:tailorId/products",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { tailorId: req.params.tailorId },
      orderBy: { createdAt: "asc" },
    });
    res.json(products);
  })
);

catalogRouter.post(
  "/tailors/:tailorId/products",
  asyncHandler(async (req, res) => {
    const { categoryId, name, price, imageUrl, description } = req.body ?? {};
    if (!categoryId || !name || !name.trim() || !price || Number(price) <= 0) {
      return res.status(400).json({ error: "categoryId, name and a positive price are required" });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.tailorId !== req.params.tailorId) {
      return res.status(404).json({ error: "Category not found" });
    }

    const product = await prisma.product.create({
      data: {
        tailorId: req.params.tailorId,
        categoryId,
        name: name.trim(),
        price: Number(price),
        imageUrl: imageUrl || null,
        description: description || null,
      },
    });
    res.status(201).json(product);
  })
);

catalogRouter.delete(
  "/tailors/:tailorId/products/:productId",
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product || product.tailorId !== req.params.tailorId) {
      return res.status(404).json({ error: "Product not found" });
    }
    await prisma.product.delete({ where: { id: req.params.productId } });
    res.status(204).end();
  })
);

// ---------- Customer-facing browse ----------

// Customers identify a tailor by email (consistent with how orders are
// created), so resolve that to the tailor's uid and return their full
// catalog grouped by category.
catalogRouter.get(
  "/tailors/by-email/:email/catalog",
  asyncHandler(async (req, res) => {
    const tailor = await prisma.user.findUnique({ where: { email: req.params.email } });
    if (!tailor || tailor.role !== "tailor") {
      return res.status(404).json({ error: "No tailor found with this email" });
    }

    const categories = await prisma.category.findMany({
      where: { tailorId: tailor.id },
      orderBy: { createdAt: "asc" },
      include: { products: { orderBy: { createdAt: "asc" } } },
    });

    res.json({
      tailor: { name: tailor.name, shopName: tailor.shopName },
      categories,
    });
  })
);
