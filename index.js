const express = require("express");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const cors = require("cors");
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const admin = require('./firebaseAdmin');
const verifyAuth = require("./middleware/verifyAuth");
const jwt =require('jsonwebtoken')


const uri =
  "mongodb+srv://mdsaleem516:a4dtNSbNPV1KOFHh@cluster0.npkfbjc.mongodb.net/test-db?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the connection instance
const db = mongoose.connection;

// Listen for connection events
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected successfully to MongoDB using Mongoose");

  const app = express();
  const port = 8080;
  app.use(express.json())
  app.use(cookieParser());
  app.use(cors({
    origin: '*',
    credentials: true, // Enable sending cookies
  }));
  // app.use(session({
  //   name:"saleem",
  //   secret: "saleem", // Use the secret from the environment variable
  //   resave: false,
  //   saveUninitialized: true,
  //   cookie: {
  //     secure: false, // Set to true if using HTTPS
  //   }
  // }));
  app.get("/", (req, res) => {
    res.send("hi saleem");
  });
  app.post('/verifyToken', async (req, res) => {
    const idToken = req.body.idToken;
  
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
  
   console.log(decodedToken,"panda")
   const token =jwt.sign({
    name:decodedToken.name,email:decodedToken.email
   },"saleem",{
    expiresIn:'1h'
   })
      // Respond with success message or user data
      res.status(200).send({token:token});
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      res.status(401).send({ error: 'Unauthorized' });
    }
  });
  // app.use(verifyAuth)
  app.get("/api/customers/accounts/:customerId", async (req, res) => {
    const customerId = req.params.customerId;
    console.log(customerId);
    try {
      const pipeline = [
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              _id: new ObjectId(customerId),
            },
        },
        {
          $unwind: {
            path: "$accounts",
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "accounts",
            foreignField: "account_id",
            as: "account_details",
          },
        },
        {
          $unwind: {
            path: "$account_details",
          },
        },
        {
          $group: {
            _id: "$_id",
            username: {
              $first: "$username",
            },
            account_details: {
              $push: "$account_details",
            },
          },
        },
      ];

      const result = await db
        .collection("customers")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
 
  app.get("/api/profile/:customerId", async (req, res) => {
    const customerId = req.params.customerId;
    console.log(customerId);
    try {
      const pipeline = [
        {
   $match:{
  _id:new ObjectId(customerId)
}
        },
        {
          $unwind:
            /**
             * path: Path to the array field.
             * includeArrayIndex: Optional name for index.
             * preserveNullAndEmptyArrays: Optional
             *   toggle to unwind null and empty values.
             */
            {
              path: "$accounts"
            }
        },
        {
          $lookup:
            /**
             * from: The target collection.
             * localField: The local join field.
             * foreignField: The target join field.
             * as: The name for the results.
             * pipeline: Optional pipeline to run on the foreign collection.
             * let: Optional variables to use in the pipeline field stages.
             */
            {
              from: "transactions",
              localField: "accounts",
              foreignField: "account_id",
              as: "result"
            }
        },
        {
          $addFields:
            /**
             * newField: The new field name.
             * expression: The new field expression.
             */
            {
              result: {
                $arrayElemAt: ["$result", 0]
              }
            }
        },
        {
          $group:
            /**
             * _id: The id of the group.
             * fieldN: The first field name.
             */
            {
              _id: "$_id",
              username: {
                $first: "$username"
              },
              name: {
                $first: "$name"
              },
              address: {
                $first: "$address"
              },
              birthdate: {
                $first: "$birthdate"
              },
              email: {
                $first: "$email"
              },
              active: {
                $first: "$active"
              },
              tier_and_details: {
                $first: "$tier_and_details"
              },
              results: {
                $push: "$result"
              }
            }
        }
      ]

      const result = await db
        .collection("customers")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/getcustomers", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;
    try {
      const pipeline = [{ $skip: skip }, { $limit: size }];

      const result = await db
        .collection("customers")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
   app.get("/api/getUniqueProducts", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;
    try {
      const pipeline = [{
        $unwind: "$products"
      },
      {
        $group: {
          _id: "$products"
        }
      },
      {
        $project: {
          _id: 0,
          product: "$_id"
        }
      },{ $skip: skip }, { $limit: size }];

      const result = await db
        .collection("accounts")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  })
  ,
  app.get("/api/getFilteredAccounts", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;
    try {
      const pipeline = [{
        $unwind: "$transactions"
      },
      {
        $match: {
          "transactions.amount": {
            $lt: 5000
          }
        }
      },
      {
        $group: {
          _id: "$account_id"
        }
      },
      {
        $project: {
          _id: 0,
          account_id: "$_id"
        }
      
      },{ $skip: skip }, { $limit: size }];

      const result = await db
        .collection("transactions")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  })
 
  
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
})
