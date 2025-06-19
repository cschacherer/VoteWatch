import express from 'express'
import Database from './database/database.js'

const billRouter = express.Router();

const _db = new Database();

//next is when you need to handoff to another function.  You don't need it for everything
billRouter.get('/:id', (req, res) => {
    try {
        //send back the bill id information
        const id = req.params.id;

        const billDetails = _db.getBill(id);
        res.send(billDetails);
    } catch (err) {
        console.error('Error fetching bill details:', error);
        res.status(500).send('Internal Server Error');
    }
});

billRouter.get('/:id/votes', (req, res) => {
    try {
        //send back the bill id information
        const id = req.params.id;

        const allVotes = _db.getAllVotesOnBill(id);
        res.send(allVotes);
    } catch (err) {
        console.error('Error fetching bill details:', error);
        res.status(500).send('Internal Server Error');
    }
});

export { billRouter }; 