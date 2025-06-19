import { getLegislatorDetails, getAllVotesFromLegislator } from '../getServerData.js';

main();

async function main() {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);

    // Get the value of the "id" parameter
    let legislatorId = params.get('id');
    legislatorId = legislatorId.replace('/', '');

    console.log('legislator ID from URL:', legislatorId);

    const legislatorData = await getLegislatorDetails(legislatorId);
    console.log(legislatorData);

    const legislatorDetailsUl = document.getElementById("legislatorDetails");

    let li = document.createElement("li");
    li.innerHTML = `
                <li>
                    <div>
                        <h1>${legislatorData.formatName}</h1>
                        <img src="${legislatorData.image}">
                        <p>House: ${legislatorData.house}</p>
                        <p>Party: ${legislatorData.party}</p>
                        <p>District: ${legislatorData.district}</p>
                        <p>Counties: ${legislatorData.counties}</p>
                        <p>Email: ${legislatorData.email}</p>
                        <p>Phone: ${legislatorData.cell}</p>
                        <p>Service Start: ${legislatorData.serviceStart}</p>
                        <p>Utah Legislator Website Link: ${legislatorData.link}</p>
                    </div>
                </li>`;
    legislatorDetailsUl.appendChild(li);

    //vote data 
    const voteData = await getAllVotesFromLegislator(legislatorId);
    const voteDataTable = document.getElementById("voteData");

    for (const vote of voteData) {
        console.log(vote);

        let li = document.createElement("tr");
        li.innerHTML = `
                        <tr>
                            <td>${vote.billId}</td>
                            <td>${vote.year}</td>
                            <td>${vote.shortTitle}</td>
                            <td>${vote.generalProvisions}</td>
                            <td>${vote.lastAction}</td>
                            <td>${vote.vote}</td>
                        </tr>`;
        voteDataTable.appendChild(li);
    }

}
