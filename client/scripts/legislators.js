import { getAllLegislators } from '../getServerData.js';

main();

async function main() {
    const response = await getAllLegislators();
    const legislatorsUl = document.getElementById("legislators");

    for (const element of response) {
        console.log(element);

        const linkUrl = `legislatorDetails.html?id=${element.id}/`;

        let li = document.createElement("li");
        li.innerHTML = `
                        <li>
                            <div>
                                <a href="${linkUrl}">
                                    <img src="${element.image}">
                                </a>
                                <p>${element.fullName}</p>
                            </div>
                        </li>`;
        legislatorsUl.appendChild(li);
    }
}