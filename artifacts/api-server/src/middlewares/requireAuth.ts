import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

/** Express Request extended with the authenticated Clerk user ID. */
export interface AuthRequest extends Request {
  clerkId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthRequest).clerkId = clerkId;
  next();
}
