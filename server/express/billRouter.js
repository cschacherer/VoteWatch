const express = require('express');

const billRouter = express.Router();

//next is when you need to handoff to another function.  You don't need it for everything
billRouter.get('/:id', (req, res) => {
    //send back the bill id information
    const id = req.params.id;
    billInformation = '';
    res.send(billInformation);
});

module.exports = billRouter; 