import express from "express";
import bodyParser from "body-parser";
import api from "./routes/index.js";
import notification from "./utils/notification.js";
import {applicationDefault, initializeApp,} from 'firebase-admin';

const app = express();
const port = process.env.PORT || 3000;

notification();

app.use(bodyParser.json());
app.use("/api", api)

initializeApp({
  credential: applicationDefault()
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app