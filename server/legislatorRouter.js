import express from 'express';
import Database from './database/database.js'

const legislatorRouter = express.Router();

const _db = new Database();

legislatorRouter.get('/:id', async (req, res) => {
    //send back the legislator id information
    try {
        const id = req.params.id;
        const legislatorData = await _db.getLegislator(id);
        res.send(legislatorData);
    } catch (err) {
        console.error('Error fetching legislator details:', error);
        res.status(500).send('Internal Server Error');
    }
});

legislatorRouter.get('/:id/allVotes', async (req, response) => {
    try {
        const id = req.params.id;
        const allLegislatorVotes = await _db.getAllBillsAndVotesForLegislator(id)
        res.send(allLegislatorVotes);
    } catch (err) {
        console.error('Error fetching votes for legislator:', error);
        res.status(500).send('Internal Server Error');
    }
})

export { legislatorRouter }; 