import express from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import api from "./routes/index.js";
import firebaseInit from "./firebase.js";

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

firebaseInit(); // Inicializa o Firebase Admin SDK

app.use(bodyParser.json());
app.use(helmet());
app.use("/api", api)

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app