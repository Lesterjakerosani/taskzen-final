import { Router, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, h } from "../middleware/auth";

const router = Router();
router.use(requireAuth as RequestHandler);

router.get("/", h(async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ tasks });
}));

router.post("/", h(async (req, res) => {
  const { title, description, category, priority, status, dueDate, dueTime } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    dueTime?: string;
  };

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      userId: req.user!.userId,
      title: title.trim(),
      description: description?.trim() ?? "",
      category: category ?? "Other",
      priority: priority ?? "medium",
      status: status ?? "pending",
      dueDate: dueDate ?? "",
      dueTime: dueTime ?? "",
    },
  });
  res.status(201).json({ task });
}));

router.put("/:id", h(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const { title, description, category, priority, status, dueDate, dueTime } = req.body as {
    title?: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    dueTime?: string;
  };

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: title?.trim() ?? existing.title,
      description: description !== undefined ? description.trim() : existing.description,
      category: category ?? existing.category,
      priority: priority ?? existing.priority,
      status: status ?? existing.status,
      dueDate: dueDate !== undefined ? dueDate : existing.dueDate,
      dueTime: dueTime !== undefined ? dueTime : existing.dueTime,
    },
  });
  res.json({ task });
}));

router.delete("/:id", h(async (req, res) => {
  const id = req.params.id as string;
  const existing = await prisma.task.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await prisma.task.delete({ where: { id } });
  res.json({ message: "Deleted" });
}));

export default router;
