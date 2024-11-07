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
  "http://localhost:8080",
  "http://localhost:8888",
  "https://ariton.app",
  "https://alpha.ariton.app",
  "https://beta.ariton.app",
  "https://status.ariton.app",
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
  try {
    return invoice(req.params, req, res);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Error generating invoice" });
  }
});

/** Route to generate a BOLT-11 invoice */
app.get("/invoice", async (req, res) => {
  try {
    return invoice(req.query, req, res);
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Error generating invoice" });
  }
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
  try {
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
    res.json({ paid: result.isPaid });
  } catch (error) {
    console.error("Failed to check paid status:", error);
    res.status(500).json({ error: "Failed to check paid status" });
  }
});

app.get("/decodeinvoice", async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error decoding invoice:", error);
    res.status(500).json({ error: "Failed to decode invoice" });
  }
});

app.post("/decodeoffer", async (req, res) => {
  try {
    const decoded = await httpClient.post("/decodeoffer", data);
    res.json(decoded);
  } catch (error) {
    console.error("Error decoding offer:", error);
    res.status(500).json({ error: "Failed to decode offer" });
  }
});

app.get("/payments/incoming", async (req, res) => {
  try {
    if (!req.query.apikey) {
      console.error("'apikey' must be provided");

      return res.status(400).json({
        error: "'apikey' must be provided",
      });
    }

    if (req.query.apikey !== process.env.apikey) {
      console.error("'apikey' must be valid");

      return res.status(400).json({
        error: "'apikey' must be valid",
      });
    }

    // const data = {
    //   invoice: req.query.invoice,
    // };

    const result = await httpClient.get("/payments/incoming");
    res.json(result);
  } catch (error) {
    console.error("Error getting incoming payments:", error);
    res.status(500).json({ error: "Failed to list incoming payments" });
  }
});

/** Route to generate a BOLT-12 offer */
app.get("/tip", async (req, res) => {
  try {
    const offer = await httpClient.getText("/getoffer");
    res.json({ tip: offer });
  } catch (error) {
    console.error("Error getting offer:", error);
    res.status(500).json({ error: "Failed to get offer" });
  }
});

app.get("/status", async (req, res) => {
  try {
    const info = await httpClient.get("/getinfo");
    res.json({
      status: "Running",
      chain: info.chain,
      blockHeight: info.blockHeight,
    });
  } catch (error) {
    console.error("Error getting status:", error);
    res.status(500).json({ error: "Failed to get status" });
  }
});

const cache = {
  data: null,
  timestamp: null,
};

app.get("/price", async (req, res) => {
  try {
    const now = Date.now();
    const cacheDuration = 30 * 1000; // 30 seconds

    // Check if cache is valid
    if (cache.data && now - cache.timestamp < cacheDuration) {
      return res.json(cache.data);
    }

    const response = await fetch("https://mempool.space/api/v1/prices");

    if (!response.ok) {
      return res.status(500).json({ error: response.statusText });
    }

    const json = await response.json();

    if (json.USD) {
      // const usd = new Number(json.USD);
      // const satoshiPrice = usd / 100000000; // Calculate the price of a single satoshi
      // console.log(`Price of 1 BTC: $${usd}`);
      // console.log(`Price of 1 Satoshi: $${satoshiPrice}`);

      const data = { usd: json.USD, eur: json.EUR, gbp: json.GBP };

      cache.data = data;
      cache.timestamp = now;

      res.json(data);
    } else {
      res.json({ error: "Failed to get price" });
    }
  } catch (error) {
    console.error("Error getting status:", error);
    res.status(500).json({ error: "Failed to get price" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Ariton Payment running at http://localhost:${port}.`);
  console.log(`PhoenixD URL: ${url}.`);
});
