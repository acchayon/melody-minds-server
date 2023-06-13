const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');



// middleware
app.use(express.json())
app.use(cors())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aifxgic.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();



        const classCollection = client.db("melodyMinds").collection("classes");
        const cartCollection = client.db("melodyMinds").collection("carts");
        const userCollection = client.db("melodyMinds").collection("users");


        // user api

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const query = { email: user.email }
            const existUser = await userCollection.findOne(query)
            // console.log('exist user',existUser);
            if (existUser) {
                return res.send({ message: 'already exists' })
            }
            const result = await userCollection.insertOne(user);
            res.send(result)
        })

        // patch
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result)

        })


        // get all classes
        app.get('/classes', async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result)
        })


        // api for cart collection
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.send([])
            }
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        // select cart collection
        app.post('/carts', async (req, res) => {
            const showClass = req.body;
            console.log(showClass);
            const result = await cartCollection.insertOne(showClass);
            res.send(result)
        })

        // delete cart
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query)
            res.send(result)
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('Summer is going on melody minds school')
})

app.listen(port, () => {
    console.log(`Melody Minds is running on port: ${port}`);
})
