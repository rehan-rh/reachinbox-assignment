import { Router } from "express";

import {
  scheduleEmailsController,
} from "../controllers/email.controller";

import {
  getEmailsController,
} from "../controllers/email-list.controller";

import {
  searchEmailsController,
} from "../controllers/search.controller";

import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get(
  "/search",
  searchEmailsController
);

router.post(
  "/schedule",
  scheduleEmailsController
);

router.get(
  "/",
  getEmailsController
);

export default router;