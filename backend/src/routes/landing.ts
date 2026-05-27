import { Router, Request, Response, RequestHandler } from "express";
import { prisma } from "../lib/prisma";
import { optionalAuth, h } from "../middleware/auth";

const router = Router();

// GET /api/landing/stats
// Returns real aggregate counts from the database
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  const [userCount, testimonialCount] = await Promise.all([
    prisma.user.count(),
    prisma.testimonial.count({ where: { approved: true } }),
  ]);

  res.json({
    students: userCount,
    testimonials: testimonialCount,
  });
});

// GET /api/landing/testimonials
// Returns approved testimonials for the landing page
router.get("/testimonials", async (_req: Request, res: Response): Promise<void> => {
  const testimonials = await prisma.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      role: true,
      initials: true,
      quote: true,
      rating: true,
      anonymous: true,
    },
  });
  res.json({ testimonials });
});

// POST /api/landing/testimonials
// Submit a new testimonial (goes into review queue, approved=false by default)
router.post("/testimonials", optionalAuth as RequestHandler, h(async (req, res) => {
  const { quote, name, role, rating } = req.body as {
    quote?: string;
    name?: string;
    role?: string;
    rating?: number;
  };

  if (!quote?.trim()) {
    res.status(400).json({ error: "Testimonial cannot be empty" });
    return;
  }

  const isAnon = !name?.trim();
  const displayName = isAnon ? "Anonymous" : name!.trim();
  const initials = displayName === "Anonymous"
    ? "AN"
    : displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  await prisma.testimonial.create({
    data: {
      quote: quote.trim(),
      name: displayName,
      role: role?.trim() ?? (isAnon ? "TaskZen User" : undefined),
      initials,
      rating: Math.min(5, Math.max(1, Math.round(rating ?? 5))),
      anonymous: isAnon,
      approved: true,
      userId: req.user?.userId ?? null,
    },
  });

  res.status(201).json({ message: "Testimonial submitted. It will appear after review." });
}));

export default router;
