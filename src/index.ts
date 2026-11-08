import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import api from "./routes/index.js";
import {applicationDefault, cert, initializeApp,} from 'firebase-admin';

const app = express();
const port = process.env.PORT || 3000;

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString(); // Converte o BigInt para String automaticamente no JSON
};

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

initializeApp({ credential: cert(serviceAccount) });

app.use(bodyParser.json());
app.use(helmet());
app.use("/api", api)

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app