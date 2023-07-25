const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

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

// verify jwt
function verifyJWT(req, res, next) {
  const headerAuthorization = req.headers.authorization;
  console.log(headerAuthorization);
  if (!headerAuthorization) {
    return res.status(401).send("unauthorize access");
  }
  const token = headerAuthorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send("forbidden access");
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const userCollection = client.db("CodeSikho").collection("users");
    const courses = client.db("CodeSikho").collection("courses");
    const ordersCollection = client
      .db("CodeSikho")
      .collection("ordersCollection");
    // verifyAdmin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // jwt create token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // create user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // get user
    app.get("/user", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const userTata = await userCollection.findOne(query);
      res.send(userTata);
    });

    // get paid user
    app.get("/paidUser/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isPaidUser: user?.userStatus === "paid" });
    });
    // update paid user data
    app.put("/paidUser/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      // console.log(status);
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };

      const updateDoc = {
        $set: {
          // update paid status
          userStatus: status.userStatus,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });
    // update user data
    app.put("/user/:id", verifyJWT, async (req, res) => {
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

    // create enroll
    app.post("/enroll", verifyJWT, async (req, res) => {
      const enroll = req.body;
      const result = await ordersCollection.insertOne(enroll);
      res.send(result);
    });
    // get user enroll
    app.get("/enroll", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });
    // get admin show all enroll request
    app.get("/admin/enroll", async (req, res) => {
      const query = {};
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });
    // get admin update enroll request status
    app.put("/enroll/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body;
      console.log(updateStatus);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          status: updateStatus.status,
        },
      };
      const result = await ordersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    // create courses
    app.post("/courses", verifyJWT, verifyAdmin, async (req, res) => {
      const course = req.body;
      const result = await courses.insertOne(course);
      res.send(result);
    });
    // get courses
    app.get("/courses", async (req, res) => {
      const query = {};
      const result = await courses.find(query).toArray();
      res.send(result);
    });
    // get courses
    app.get("/course/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await courses.findOne(query);
      res.send(result);
    });
    // get admin
    app.get("/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
