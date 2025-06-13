// const puppeteer = require('puppeteer');
import puppeteer from 'puppeteer';
import { getAllLegislators } from './database/getOnlineData.js'

const scrapeHouseBill = async (year, billId) => {
    const url = `https://le.utah.gov/~${year}/bills/static/${billId}.html`;

    let browser;

    //read bill status html page - need puppeteer to click 'status' button to load data
    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(url);

        await page.waitForSelector('#billStatusTbl');

        // Extract vote data from the bill status table
        const voteData = await page.evaluate(() => {
            let rows = Array.from(document.querySelectorAll('#billStatusTbl tr')); //get all rows from billStatustable
            rows = rows.slice(1); //gets rid of column header row 
            return rows.map(row => {
                const cols = row.querySelectorAll('td');
                return {
                    date: cols[0]?.innerText.trim(),
                    action: cols[1]?.innerText.trim(),
                    location: cols[2]?.innerText.trim(),
                    vote: cols[3]?.querySelector('a')?.href.trim()
                };
            });
        });

        if (!voteData) {
            console.log("unable to get vote data.");
            return;
        }

        const houseThirdReading = voteData.find(row => {
            const actionText = row.action.toLowerCase();
            return actionText.includes('passed 3rd reading') && actionText.includes('house/');
        });

        const votingUrl = houseThirdReading.vote;

        const puppeteerResponse = await page.goto(votingUrl);

        const { yesVotes, noVotes, absentVotes } = await page.$$eval('center table', (tables) => {
            const yesTable = tables[0];
            const noTable = tables[1];
            const absentTable = tables[2];

            const getLinksAndNames = (table) => {
                return Array.from(table.querySelectorAll('td font')).map(nameObject => {
                    const linkElement = nameObject.querySelector('a');
                    if (linkElement) {
                        let href = linkElement?.getAttribute('href') || '';
                        const match = href.match(/'([^']+)'/);
                        const cleanedLink = match ? match[1] : '';
                        return {
                            link: cleanedLink,
                            name: linkElement.innerText,
                        }
                    } else {
                        return {
                            link: '',
                            name: nameObject.innerText,
                        }
                    }
                });
            };

            const yesVotes = getLinksAndNames(yesTable);
            const noVotes = getLinksAndNames(noTable);
            const absentVotes = getLinksAndNames(absentTable);

            return { yesVotes, noVotes, absentVotes };
        });

        return {
            yes: yesVotes,
            no: noVotes,
            absent: absentVotes
        }
    }
    catch (err) {
        console.log(err.message);
    }
    finally {
        if (browser != undefined) {
            await browser.close();
        }
    }
}

const getIds = async (arr) => {
    try {
        const results = await Promise.all(arr.map(async (vote) => {
            const baseUrl = "https://le.utah.gov";
            try {
                const newUrl = baseUrl + vote.link;
                const response = await fetch(newUrl, { method: 'GET' });
                const idUrl = response.url;
                const id = idUrl?.split('/')?.filter(item => item !== '' && item !== 'le.utah.gov')?.pop();
                return id;

            } catch (err) {
                console.log(`error for ${vote.link}, ${err.message}`);
                return '';
            }

        }));

        return results;
    } catch (err) {
        console.log(err);
        return [];
    }

}

const getLegIdFromUrl = async (arr) => {
    const allLegs = await getAllLegislators();

    const idVotes = await getIds(arr);

    const fullLegObjectVotes = idVotes.map(legId => {
        return {
            id: legId,
            leg: allLegs.find(leg => leg.id == legId),
        }
    })

    return fullLegObjectVotes;
};

const getLegislatorsFromVoteLink = async (votesLegLinks) => {
    const allLegs = getAllLegislators();

    const idVotes = getIds(votesLegLinks);

    const promiseResult = await Promise.all([allLegs, idVotes]);
    const fullLegArray = promiseResult[0];
    const legIdArray = promiseResult[1];

    const idWithFullLegArray = legIdArray.map(legId => {
        return {
            id: legId,
            leg: fullLegArray.find(leg => leg.id == legId),
        }
    })

    return idWithFullLegArray;
};

const votes = await scrapeHouseBill(2025, 'HB0049');

const yesVotes = getLegislatorsFromVoteLink(votes.yes);
const noVotes = getLegislatorsFromVoteLink(votes.no);
const absentVotes = getLegislatorsFromVoteLink(votes.absent);

const prommy = await Promise.all([yesVotes, noVotes, absentVotes]);
console.log(prommy);


