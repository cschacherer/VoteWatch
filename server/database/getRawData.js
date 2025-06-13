const fs = require('fs');
const path = require('path');
const axios = require('axios');

const devToken = '83C4D87BC38A20EE125713B39B56AA5B';

function writeToJson(jsonFileName, data) {
    fs.writeFile(jsonFileName, data.toString(), (err) => { console.log(err?.message) });
}

function getLegislatures() {
    const legislatorURL = `https://glen.le.utah.gov/legislators/${devToken}`
    axios.get(legislatorURL)
        .then(function (response) {
            let data = response.data;
            let stringData = JSON.stringify(data);
            let currentDir = process.cwd();
            let newFileName = path.join(currentDir, "jsonFiles\\legislators.json");
            writeToJson(newFileName, stringData);
        })
        .catch(function (error) {
            console.log(error);
        });
}

function getBills(year) {
    const billURL = `https://glen.le.utah.gov/bills/${year}GS/billlist/${devToken}`;
    axios.get(billURL)
        .then(function (response) {
            let data = response.data;
            let stringData = JSON.stringify(data);
            let currentDir = process.cwd();
            let newFileName = path.join(currentDir, `jsonFiles\\${year}bills.json`);
            writeToJson(newFileName, stringData);
        })
        .catch(function (error) {
            console.log(error);
        })
}
