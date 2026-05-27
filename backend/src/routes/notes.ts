import { Router, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, h } from "../middleware/auth";

const router = Router();
router.use(requireAuth as RequestHandler);

router.get("/", h(async (req, res) => {
  const notes = await prisma.note.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ notes });
}));

router.post("/", h(async (req, res) => {
  const { title, content, category } = req.body as {
    title?: string;
    content?: string;
    category?: string;
  };

  if (!title?.trim() && !content?.trim()) {
    res.status(400).json({ error: "Title or content is required" });
    return;
  }

  const note = await prisma.note.create({
    data: {
      userId: req.user!.userId,
      title: title?.trim() || "Untitled",
      content: content?.trim() ?? "",
      category: category ?? "General",
    },
  });
  res.status(201).json({ note });
}));

router.put("/:id", h(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const { title, content, category } = req.body as {
    title?: string;
    content?: string;
    category?: string;
  };

  const note = await prisma.note.update({
    where: { id },
    data: {
      title: title !== undefined ? (title.trim() || "Untitled") : existing.title,
      content: content !== undefined ? content.trim() : existing.content,
      category: category ?? existing.category,
    },
  });
  res.json({ note });
}));

router.delete("/:id", h(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.note.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  await prisma.note.delete({ where: { id } });
  res.json({ message: "Deleted" });
}));

export default router;
