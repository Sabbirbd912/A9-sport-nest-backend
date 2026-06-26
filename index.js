const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
dotenv.config();

const PORT = process.env.PORT || 3000;

//MongoDB connection uri
const uri = process.env.MONGODB_URI;

//MongoDB client
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//MongoDB Function -- all database related APIs created in this function
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //getting the database
    const db = client.db("sport_nest");

    //getting the table/collection
    const facilitiesCollection = db.collection("facilities");
    const usersCollection = db.collection("users");

    //users APIs--------------------------
    //read all users
    app.get("/users", async (req, res) => {
      const email = req.query.email;
      const query = {};

      if (email) {
        query.email = email;
      }

      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //facilities APIs------------------------
    //read api all facilities or facilities by email
    app.get("/allfacilities", async (req, res) => {
      const { searchText, category, email } = req.query;
      const query = {};

      // console.log(category)
      if (email) {
        query.userEmail = email;
      }

      if (category) {
        const categories = category.split(",");
        query.category = { $in: categories };
      }

      // if (category) {
      //   query.category = category;
      // }

      if (searchText) {
        query.title = { $regex: searchText, $options: "i" };
      }

      const cursor = facilitiesCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });

    //create
    app.post("/addfacilities", async (req, res) => {
      const newFacility = req.body;
      const result = await facilitiesCollection.insertOne(newFacility);
      res.send(result);
    });

    //facility details read api
    app.get("/addfacilities/:id", async (req, res) => {
      const id = req.params.id;

      if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        res.send({});
      }

      const query = { _id: new ObjectId(id) };
      // const query = { _id: id };
      const result = await facilitiesCollection.findOne(query);
      res.send(result);
    });

    //update api
    app.patch("/updatefacility/:id", async (req, res) => {
      const id = req.params.id; //getting facility id from route
      const query = { _id: new ObjectId(id) }; //making query which facility will be updated
      // const query = { _id: id };                           //making query which facility will be updated
      const updatedFacility = req.body; //getting latest data from frontend
      const update = {
        //making data $set object to pass in function
        // $set: updatedFacility;
        $set: {
          title: updatedFacility.title,
          category: updatedFacility.category,
          summary: updatedFacility.summary,
          coverImage: updatedFacility.coverImage,
        },
      };

      const result = await facilitiesCollection.updateOne(query, update); //updating command
      res.send(result); //sending response
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
