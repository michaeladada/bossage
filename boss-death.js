async function loadBossDeathDataFromDiscord() {
    const PAGE_SIZE = 100;
    const first_100 = await loadBossDeathDataPageFromDiscord(PAGE_SIZE);
    const lastObjectId = first_100[PAGE_SIZE - 1].id;
    const next_100 = await loadBossDeathDataPageFromDiscord(PAGE_SIZE, lastObjectId);
    return first_100.concat(next_100);
}

async function loadBossDeathDataPageFromDiscord(pageSize, before) {
    let url = `https://discord.com/api/v9/channels/998734693631524904/messages?limit=${pageSize}`;
    if(before !== undefined) {
        url += `&before=${before}`
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': discordToken,
            'Content-Type': 'application/json'
        }
    });

    // const response = await fetch('http://localhost:63342/bossage/out.json', {
    //     method: 'GET',
    //     headers: {
    //         'Authorization': 'xxx',  // Add your authorization token
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