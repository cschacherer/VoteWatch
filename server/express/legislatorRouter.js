const express = require('express');

const legislatorRouter = express.Router();

legislatorRouter.get('/:id', (req, res) => {
    //send back the legislator id information
    const id = req.params.id;
    legInformation = '';
    res.send(legInformation);
});

module.exports = legislatorRouter; 