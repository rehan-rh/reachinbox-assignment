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

const router = Router();

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