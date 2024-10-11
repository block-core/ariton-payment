import cors from "cors";
import express from "express";
import dotenv from "dotenv";
dotenv.config();

import HttpClient from "./httpclient.js";

const url = process.env.url;
const password = process.env.password;
const port = process.env.port ?? 8080;

const httpClient = new HttpClient(url, password);
const app = express();

const allowedOrigins = [
  "http://localhost",
  "http://localhost:4200",
  "http://localhost:4201",
  "http://localhost:4210",
  "https://alpha.ariton.app",
  "https://beta.ariton.app",
];
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// Step 4: Apply the CORS middleware
app.use(cors(corsOptions));

// Uncomment if you want public access to wallet balance.
// app.get("/balance", async (req, res) => {
//   const balance = await httpClient.get("/getbalance");
//   res.json(balance);
// });

/** Route to generate a BOLT-11 invoice */
app.post("/invoice", async (req, res) => {
  return invoice(req.params, req, res);
});

/** Route to generate a BOLT-11 invoice */
app.get("/invoice", async (req, res) => {
  return invoice(req.query, req, res);
});

const invoice = async (input, req, res) => {
  if (!input.description) {
    console.error("'description' must be provided");

    return res.status(400).json({
      error: "'description' must be provided",
    });
  }

  if (!input.amount) {
    console.error("'amount' must be provided");

    return res.status(400).json({
      error: "'amount' must be provided",
    });
  }

  if (!input.id) {
    console.error("'id' must be provided");

    return res.status(400).json({
      error: "'id' must be provided",
    });
  }

  const data = {
    description: input.description,
    amountSat: input.amount,
    externalId: input.id,
  };

  const invoice = await httpClient.post("/createinvoice", data);
  res.json(invoice);
};

app.get("/paid", async (req, res) => {
  if (!req.query.hash) {
    console.error("'hash' must be provided");

    return res.status(400).json({
      error: "'hash' must be provided",
    });
  }

  const data = {
    hash: req.query.hash,
  };

  const result = await httpClient.get(`/payments/incoming/${data.hash}`);
  console.log("PAID RESULT:", result);

  if (result.isPaid) {
    res.json({ paid: true });
  } else {
    res.json({ paid: true });
  }
});

app.get("/decodeinvoice", async (req, res) => {
  if (!req.query.invoice) {
    console.error("'invoice' must be provided");

    return res.status(400).json({
      error: "'invoice' must be provided",
    });
  }

  const data = {
    invoice: req.query.invoice,
  };

  const decoded = await httpClient.post("/decodeinvoice", data);
  res.json(decoded);
});

app.get("/decodeoffer", async (req, res) => {
  if (!req.query.offer) {
    console.error("'offer' must be provided");

    return res.offer(400).json({
      error: "'invoice' must be provided",
    });
  }

  const data = {
    offer: req.query.offer,
  };

  const decoded = await httpClient.post("/decodeoffer", data);
  res.json(decoded);
});

/** Route to generate a BOLT-12 offer */
app.get("/tip", async (req, res) => {
  const offer = await httpClient.getText("/getoffer");
  res.json({ tip: offer });
});

app.get("/status", async (req, res) => {
  const info = await httpClient.get("/getinfo");
  //   console.log("INFO:", info);
  res.json({
    status: "Running",
    chain: info.chain,
    blockHeight: info.blockHeight,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Ariton Payment running at http://localhost:${port}.`);
  console.log(`PhoenixD URL: ${url}.`);
});
