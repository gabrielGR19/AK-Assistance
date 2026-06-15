import { Router, type IRouter } from "express";
import healthRouter from "./health";
import retellRouter from "./retell";
import pilotRouter from "./pilot";
import newsletterRouter from "./newsletter";
import demoRequestRouter from "./demo-request";
import blogRouter from "./blog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(retellRouter);
router.use(pilotRouter);
router.use(newsletterRouter);
router.use(demoRequestRouter);
router.use(blogRouter);

export default router;
