import dotenv from "dotenv";

dotenv.config();

import "./queues/email.worker";
import app from "./app";

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});