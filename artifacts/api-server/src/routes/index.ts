import { Router, type IRouter } from "express";
import healthRouter from "./health";
import retellRouter from "./retell";

const router: IRouter = Router();

router.use(healthRouter);
router.use(retellRouter);

export default router;
