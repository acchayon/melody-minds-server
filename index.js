const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');



// middleware
app.use(express.json())
app.use(cors())

// verify jwt token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthrized access here' })
    }

    // bearer token
    const token = authorization.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_WEB_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthrized access here' })
        }
        req.decoded = decoded;
        next();
    })
}




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


        // for jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_WEB_TOKEN, { expiresIn: '5h' })
            res.send({ token })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = {email: email}
            const user = await userCollection.findOne(query)
            if(user?.role !== 'admin'){
                res.status(403).send({error: true, message: 'forbidden'})
            }
            next();
        }


        // user api

        app.get('/users', verifyJWT, verifyAdmin, async (req, res) => {
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

        app.post('/classes', verifyJWT, verifyAdmin,  async (req, res) => {
            const newClass = req.body;
            const result = await classCollection.insertOne(newClass)
            res.send(result)
        })

        app.delete('/classes/:id',verifyJWT, verifyAdmin,async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await classCollection.deleteOne(query);
            res.send(result)

        })


        // api for cart collection
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;

            if (!email) {
                return res.send([])
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(401).send({ error: true, message: 'Forbidden access here' })
            }
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const result = { admin: user?.role === 'admin' }
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
