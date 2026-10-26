import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import api from "./routes/index.js";
import {applicationDefault, initializeApp,} from 'firebase-admin';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(helmet());
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