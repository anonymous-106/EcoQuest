import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import activitiesRouter from "./activities";
import challengesRouter from "./challenges";
import recommendationsRouter from "./recommendations";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/activities", activitiesRouter);
router.use("/challenges", challengesRouter);
router.use("/recommendations", recommendationsRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/dashboard", dashboardRouter);

export default router;
