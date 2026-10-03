import express from "express";
import bodyParser from "body-parser";
import api from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/api", api)

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app