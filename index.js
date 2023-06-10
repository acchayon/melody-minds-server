const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(express.json())
app.use(cors())


app.get('/',  (req, res) => {
    res.send('Summer is going on melody minds school')
})

app.listen(port, () => {
    console.log(`Melody Minds is running on port: ${port}`);
})
