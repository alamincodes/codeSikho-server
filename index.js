const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Codesikho server running..!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.zwcbbi0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("CodeSikho").collection("users");
    // create user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // get user
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const userTata = await userCollection.findOne(query);
      res.send(userTata);
    });
    // update user
    app.put("/user/:id", async (req, res) => {
      const id = req.params.id;
      const userData = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };

      const updateDoc = {
        $set: {
          // update user data
          name: userData.name,
          phone: userData.phone,
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
