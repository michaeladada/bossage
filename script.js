
function buildCycleBossTable(rawBosses, rawCycles, bossesDeath) {
    if(!bossesDeath) {
        bossesDeath = [];
    }
    const cycleData = calculateCycles(rawCycles);
    const cloneBossesDeath = JSON.parse(JSON.stringify(bossesDeath));

    populateFullBossData(rawBosses, cycleData, cloneBossesDeath)
    createCycleTable(rawBosses, cycleData);
}

function populateFullBossData(rawBosses, cycleData, bossesDeath) {
    for (const rawCycleName in cycleData) {
        if (!cycleData.hasOwnProperty(rawCycleName)) {
            continue;
        }
        const bosses = rawBosses[rawCycleName];
        bosses.forEach(boss => {
            boss.lastKilledSeconds = lastBossDeath(boss.name, bossesDeath);
            const currentTimeSeconds = new Date().getTime() / 1000;
            boss.lastKilledMinutesAgo = boss.lastKilledSeconds !== null ? (currentTimeSeconds - boss.lastKilledSeconds) / 60 : null;
            boss.cycle = cycleData[rawCycleName];
            boss.up = boss.lastKilledMinutesAgo !== null ? boss.lastKilledMinutesAgo > boss.cycle.rawCycle.activeMinutes : false
        });
    }
}

function lastBossDeath(bossName, bossesDeath) {
    let foundBoss = null;
    bossesDeath.forEach(boss => {
        if(foundBoss === null && boss.name === bossName) {
            foundBoss = boss;
        }
    });

    if (foundBoss === null) {
        return null;
    }

    const index = bossesDeath.indexOf(foundBoss);
    bossesDeath.splice(index, 1);
    return foundBoss.deathTime;
}

function calculateCycles(rawCycles) {
    const cycles = {};
    for (const rawCycleName in rawCycles) {
        if (!rawCycles.hasOwnProperty(rawCycleName)) {
            continue;
        }
        cycles[rawCycleName] = cycleActiveIn(rawCycles[rawCycleName]);
    }

    const entries = Object.entries(cycles);

    // Step 3: Sort the array by 'active', 'progressPercent', and then 'activeInSeconds'
    entries.sort(([, a], [, b]) => {
        // First: Sort by 'active', with true first
        if (a.active !== b.active) {
            return a.active === true ? -1 : 1;
        }

        // Second: Sort by 'progressPercent'
        if (a.active && a.progressPercent !== b.progressPercent) {
            return b.progressPercent - a.progressPercent;
        }

        // Third: Sort by 'activeInSeconds'
        return a.activeInSeconds - b.activeInSeconds;
    });

    // Step 4: Convert the sorted array back to an object (optional)
    return Object.fromEntries(entries);
}

function cycleActiveIn(cycle) {
    const currentTimeSeconds = new Date().getTime() / 1000;
    const diff = currentTimeSeconds - cycle.startTimeEpochSeconds;
    const timeInCycleSeconds = diff % (cycle.cycleMinutes * 60);
    const activeInSeconds = parseInt((cycle.cycleMinutes * 60) - timeInCycleSeconds, 10);
    const cycleProgressDouble = timeInCycleSeconds / (cycle.activeMinutes * 60) * 100;
    const cycleProgressPercent = parseInt(cycleProgressDouble, 10);
    const timeLeftInSeconds =  (cycle.activeMinutes * 60) - timeInCycleSeconds;
    const active = timeInCycleSeconds / (cycle.activeMinutes * 60) < 1;
    return { progressPercent: cycleProgressPercent, activeInSeconds: activeInSeconds, active: active, timeLeftInSeconds: timeLeftInSeconds, rawCycle: {...cycle} };
}

function fancyTimeFormat(duration) {
    // Hours, minutes and seconds
    const hrs = ~~(duration / 3600);
    const mins = ~~((duration % 3600) / 60);
    const secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = "";

    if (hrs > 0) {
        ret += "" + hrs + "h ";
    }

    if(mins > 0) {
        ret += "" + mins + "m ";
    }
    ret += "" + secs;

    return ret + "s";
}

function createCycleTable(cycleBosses, cycleData) {
    for (const cycleName in cycleData) {
        if (!cycleData.hasOwnProperty(cycleName)) {
            continue;
        }

        const cycle = cycleData[cycleName];
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';

        const div = document.createElement('div');
        div.className = "status-line " + (cycle.active ? "status-active" : "status-inactive");
        div.innerText = cycleName + " " + (cycle.active ? `(${cycle.progressPercent}%)` : `(Start in: ${fancyTimeFormat(cycle.activeInSeconds)})`);
        const divSmall = document.createElement('div');
        divSmall.className = "small-text";
        divSmall.innerText = `Time left: ${fancyTimeFormat(cycle.timeLeftInSeconds)}`;
        if (cycle.active) {
            div.appendChild(divSmall);
        }
        tableContainer.appendChild(div);

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        addHeader(headerRow);
        thead.appendChild(headerRow);

        cycleBosses[cycleName].forEach(item => {
            const bossRow = addBoss(item)
            tbody.appendChild(bossRow);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.appendChild(table);

        // Add table container to the DOM
        document.getElementById('grid-container').appendChild(tableContainer);
    }
}

function addHeader(headerRow) {
    const thName = document.createElement('th');
    thName.textContent = "Boss";
    headerRow.appendChild(thName);

    const thLvl = document.createElement('th');
    thLvl.textContent = "Level";
    headerRow.appendChild(thLvl);

    const thLoc = document.createElement('th');
    thLoc.textContent = "Location";
    headerRow.appendChild(thLoc);

    const thAction = document.createElement('th');
    thAction.textContent = "Action";
    headerRow.appendChild(thAction);
}

function addBoss(boss) {
    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.id = "td-" + boss.name;
    tdName.textContent = boss.name;
    row.appendChild(tdName);

    const tdLvl = document.createElement('td');
    tdLvl.textContent = boss.lvl;
    row.appendChild(tdLvl);

    const tdLoc = document.createElement('td');
    tdLoc.textContent = boss.location;
    row.appendChild(tdLoc);

    const tdAction = document.createElement('td');
    const actionElement = document.createElement('a');
    actionElement.className = "link-button";
    actionElement.textContent = boss.up ? "UP!!!" : "Dead";
    actionElement.onclick = function() {
        bossDead(boss.name);
    };
    tdAction.appendChild(actionElement);
    row.appendChild(tdAction);

    return row;
}

function bossDead(bossName) {
    console.log(`Making ${bossName} as dead`);
    const tdBossName = document.getElementById("td-" + bossName)
    tdBossName.className = "strikethrough";
    if (typeof bossDeadNotification === "function") {
        bossDeadNotification(bossName);
    }
}
