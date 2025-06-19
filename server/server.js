import express from 'express';
import { billRouter } from './billRouter.js'
import { legislatorRouter } from './legislatorRouter.js'

const app = express();

app.use('/bills', billRouter);
app.use('/legislators', legislatorRouter);

const PORT = process.env.PORT || '3005';
app.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});
