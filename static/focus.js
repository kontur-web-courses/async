let API = {
    organizationList: "/orgsList",
    analytics: "/api3/analytics",
    orgReqs: "/api3/reqBase",
    buhForms: "/api3/buh",
};

/*
function run() {
    sendRequest(API.organizationList, (orgOgrns) => {
        let ogrns = orgOgrns.join(",");
        sendRequest(`${API.orgReqs}?ogrn=${ogrns}`, (requisites) => {
            let orgsMap = reqsToMap(requisites);
            sendRequest(`${API.analytics}?ogrn=${ogrns}`, (analytics) => {
                addInOrgsMap(orgsMap, analytics, "analytics");
                sendRequest(`${API.buhForms}?ogrn=${ogrns}`, (buh) => {
                    addInOrgsMap(orgsMap, buh, "buhForms");
                    render(orgsMap, orgOgrns);
                });
            });
        });
    });
}
*/

async function run() {
    let orgOgrns = await sendRequest(API.organizationList);
    let ogrns = orgOgrns.join(",");

    let [requisites, analytics, buh] = await Promise.all([
        sendRequest(`${API.orgReqs}?ogrn=${ogrns}`),
        sendRequest(`${API.analytics}?ogrn=${ogrns}`),
        sendRequest(`${API.buhForms}?ogrn=${ogrns}`)
    ]);

    let orgsMap = reqsToMap(requisites);

    addInOrgsMap(orgsMap, analytics, "analytics");
    addInOrgsMap(orgsMap, buh, "buhForms");
    render(orgsMap, orgOgrns);
}

run();

/*
function sendRequest(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                callback(JSON.parse(xhr.response));
            }
        }
    };

    xhr.send();
}
*/
/*
function sendRequest(url) { // xhr
    return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE)
                    if (xhr.status === 200)
                        resolve(JSON.parse(xhr.response));
                    else
                        reject(xhr.status);
            };

            xhr.send();
        }
    )
}
*/

async function sendRequest(url) { // fetch
    const response = await fetch(url);
    if (response.ok)
        return response.json();
    // else
    //     throw new Error(response.status);

    //console.log(`${response.status} ${response.statusText}`);
    alert(`${response.status} - ${response.statusText}`);
}

function reqsToMap(requisites) {
    return requisites.reduce((acc, item) => {
        acc[item.ogrn] = item;
        return acc;
    }, {});
}

function addInOrgsMap(orgsMap, additionalInfo, key) {
    for (let item of additionalInfo) {
        orgsMap[item.ogrn][key] = item[key];
    }
}

function render(organizationsInfo, organizationsOrder) {
    let table = document.getElementById("organizations");
    table.classList.remove("hide");

    let template = document.getElementById("orgTemplate");
    let container = table.querySelector("tbody");

    organizationsOrder.forEach((item) => {
        renderOrganization(organizationsInfo[item], template, container);
    });
}

function renderOrganization(orgInfo, template, container) {
    let clone = document.importNode(template.content, true);
    let name = clone.querySelector(".name");
    let indebtedness = clone.querySelector(".indebtedness");
    let money = clone.querySelector(".money");
    let address = clone.querySelector(".address");

    name.textContent =
        (orgInfo.UL && orgInfo.UL.legalName && orgInfo.UL.legalName.short) ||
        "";
    indebtedness.textContent = formatMoney(orgInfo.analytics.s1002 || 0);

    if (
        orgInfo.buhForms &&
        orgInfo.buhForms.length &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1] &&
        orgInfo.buhForms[orgInfo.buhForms.length - 1].year === 2017
    ) {
        money.textContent = formatMoney(
            (orgInfo.buhForms[orgInfo.buhForms.length - 1].form2 &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0] &&
                orgInfo.buhForms[orgInfo.buhForms.length - 1].form2[0]
                    .endValue) ||
                0
        );
    } else {
        money.textContent = "—";
    }

    let addressFromServer = orgInfo.UL.legalAddress.parsedAddressRF;
    address.textContent = createAddress(addressFromServer);

    container.appendChild(clone);
}

function formatMoney(money) {
    let formatted = money.toFixed(2);
    formatted = formatted.replace(".", ",");

    let rounded = money.toFixed(0);
    let numLen = rounded.length;
    for (let i = numLen - 3; i > 0; i -= 3) {
        formatted = `${formatted.slice(0, i)} ${formatted.slice(i)}`;
    }

    return `${formatted} ₽`;
}

function createAddress(address) {
    let addressToRender = [];
    if (address.regionName) {
        addressToRender.push(createAddressItem("regionName"));
    }
    if (address.city) {
        addressToRender.push(createAddressItem("city"));
    }
    if (address.street) {
        addressToRender.push(createAddressItem("street"));
    }
    if (address.house) {
        addressToRender.push(createAddressItem("house"));
    }

    return addressToRender.join(", ");

    function createAddressItem(key) {
        return `${address[key].topoShortName}. ${address[key].topoValue}`;
    }
}
