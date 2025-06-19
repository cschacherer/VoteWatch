import * as cheerio from 'cheerio';
import { VoteValue } from '../classes/vote.js';

const scrapeBillVote = async (year, billId, voteUrl) => {
    try {
        if (!voteUrl) {
            return [];
        }
        const response = await fetch(voteUrl, { method: 'GET' });
        const htmlData = await response.text();
        const $ = cheerio.load(htmlData);

        const votingTables = $('center table');
        const yesTable = votingTables[0];
        const noTable = votingTables[1];
        const absentTable = votingTables[2];

        //If the legislator is currently active, the vote will contain a link.
        //Using that link, you can get the legislators unique id.    
        //If the legislator is retired, then there is no link and the legislator's name will be part of the font class
        const getLinksAndNames = (table) => {
            const legislatorVotes = $(table).find('td font');
            const linkAndNameObjects = Array.from(legislatorVotes).map(element => {
                const link = $(element).find('a');
                if (link.length > 0) {
                    const href = link.attr('href') || '';
                    const match = href.match(/'([^']+)'/);
                    const cleanedLink = match ? match[1] : '';
                    return {
                        link: cleanedLink,
                        name: link.text(),
                    };
                } else {
                    return {
                        link: '',
                        name: $(element).text(),
                    };
                }
            });
            return linkAndNameObjects;
        };

        const yesVotes = getLinksAndNames(yesTable);
        const noVotes = getLinksAndNames(noTable);
        const absentVotes = getLinksAndNames(absentTable);

        const yesIds = getIds(yesVotes);
        const noIds = getIds(noVotes);
        const absentIds = getIds(absentVotes)

        const promiseResult = await Promise.all([yesIds, noIds, absentIds]);
        const yesIdsArray = promiseResult[0];
        const noIdsArray = promiseResult[1];
        const absentIdsArray = promiseResult[2];

        const house = new URL(voteUrl).searchParams.get('house');

        const yesVotesTotal = createVoteDatabaseObjects(year, billId, house, yesVotes, yesIdsArray, VoteValue.yes);
        const noVotesTotal = createVoteDatabaseObjects(year, billId, house, noVotes, noIdsArray, VoteValue.no)
        const absentVotesTotal = createVoteDatabaseObjects(year, billId, house, absentVotes, absentIdsArray, VoteValue.absent);

        const totalVotes = yesVotesTotal.concat(noVotesTotal, absentVotesTotal);
        return totalVotes;
    }
    catch (err) {
        console.log(err.message);
    }
}

const createVoteDatabaseObjects = (year, billId, house, legislatorVoteArray, idArray, vote) => {
    try {
        const voteArray = [];
        if (legislatorVoteArray.length !== idArray.length) {
            console.log('Error with voter array and legislator id arrary');
            return [];
        }
        for (let i = 0; i < legislatorVoteArray.length; i++) {
            voteArray.push({
                year: year,
                billId: billId,
                house: house,
                legislatorId: idArray[i],
                legislatorName: legislatorVoteArray[i].name,
                vote: vote,
            });
        }
        return voteArray;
    } catch (err) {
        console.log(err.message);
    }

};

const getIds = async (arr) => {
    try {
        const results = await Promise.all(arr.map(async (vote) => {
            if (vote.link === '') {
                return '';
            }

            const baseUrl = "https://le.utah.gov";
            try {
                const newUrl = baseUrl + vote.link;
                const response = await fetch(newUrl, { method: 'GET' });
                const idUrl = response.url;
                const id = idUrl?.split('/')?.filter(item => item !== '' && item !== 'le.utah.gov')?.pop();
                return id;

            } catch (err) {
                //we do not allow for null values in the legislator id column in the database, so 
                //use a -1 value instead 
                console.log(`error for ${vote.link}, ${err.message}`);
                return '-1';
            }

        }));

        return results;
    } catch (err) {
        console.log(err);
        return [];
    }

}

export { scrapeBillVote };


