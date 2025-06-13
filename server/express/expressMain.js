const express = require('express');
const billRouter = require('./billRouter.js');
const legislatorRouter = require('./legislatorRouter.js');

const app = express();

app.use('/bills', billRouter);
app.use('/legislators', legislatorRouter);

const PORT = process.env.PORT || '3005';
app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
