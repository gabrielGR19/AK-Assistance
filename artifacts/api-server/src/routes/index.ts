import { Router, type IRouter } from "express";
import healthRouter from "./health";
import retellRouter from "./retell";
import pilotRouter from "./pilot";
import newsletterRouter from "./newsletter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(retellRouter);
router.use(pilotRouter);
router.use(newsletterRouter);

export default router;
