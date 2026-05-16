import { Router, type IRouter } from "express";
import healthRouter from "./health";
import retellRouter from "./retell";
import pilotRouter from "./pilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(retellRouter);
router.use(pilotRouter);

export default router;
