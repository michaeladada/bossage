async function loadBossDeathDataFromDiscord() {
    const response = await fetch('https://discord.com/api/v9/channels/998734693631524904/messages?limit=100', {
        method: 'GET',
        headers: {
            'Authorization': 'MTI4NjIxNzMxNjAzMTI2Njk0Nw.GSGk-B.TH0_u_aJ2SORVuXVpS4sVYII2gHPDCx6CGUuxY',  // Add your authorization token
            'Content-Type': 'application/json'          // Specify the content type
        }
    });

    // const response = await fetch('http://localhost:63342/bossage/out.json', {
    //     method: 'GET',
    //     headers: {
    //         'Authorization': 'MTI4NjIxNzMxNjAzMTI2Njk0Nw.GSGk-B.TH0_u_aJ2SORVuXVpS4sVYII2gHPDCx6CGUuxY',  // Add your authorization token
    //         'Content-Type': 'application/json'          // Specify the content type
    //     }
    // });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
}

function getBossName(fields) {
    let bossName = null;
    fields.forEach(item => {
        if(item.name === "Lineage Boss") {
            bossName = item.value;
        }
    });

    return bossName;
}

async function processBossData() {
    const rawBossDeath = await loadBossDeathDataFromDiscord();

    const bossesDeathArray = [];
    const bossesDeath = {};
    rawBossDeath.forEach(row => {
        const fields = row.embeds[0].fields;
        const bossName = getBossName(fields);
        const deathTimeEpochSeconds = new Date(row.timestamp).getTime() / 1000;
        if(bossesDeath[bossName] === undefined) {
            bossesDeath[bossName] = [];
            bossesDeathArray.push({ name: bossName, deathTime: deathTimeEpochSeconds });
        }
        if (bossName === "Dark Elder" && bossesDeath[bossName].length === 1) {
            bossesDeathArray.push({ name: bossName, deathTime: deathTimeEpochSeconds });
        }
        bossesDeath[bossName].push(deathTimeEpochSeconds);
    });

    return bossesDeathArray;

}