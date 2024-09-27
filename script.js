
function buildCycleBossTable(rawBosses, rawCycles, bossesDeath) {
    if(!bossesDeath) {
        bossesDeath = [];
    }
    const cycleData = calculateCycles(rawCycles);
    const cloneBossesDeath = JSON.parse(JSON.stringify(bossesDeath));

    populateFullBossData(rawBosses, cycleData, cloneBossesDeath)
    // createCycleTable(rawBosses, cycleData);
    createBossTable(rawBosses);
}

function populateFullBossData(rawBosses, cycleData, bossesDeath) {
    for (const rawCycleName in cycleData) {
        if (!cycleData.hasOwnProperty(rawCycleName)) {
            continue;
        }
        const bosses = rawBosses[rawCycleName];
        bosses.forEach(boss => {
            boss.lastKilledSeconds = lastBossDeath(boss.name, bossesDeath);
            boss.cycle = cycleData[rawCycleName];
            boss.up = isBossUp(boss.lastKilledSeconds, boss.cycle);
            boss.double = isDoubleUp(boss.lastKilledSeconds, boss.cycle);
            boss.dead = boss.cycle.active && boss.lastKilledSeconds > boss.cycle.startedAtSecondsEpoch;
        });
    }
}

function isDoubleUp(lastKilled, cycle) {
    if(lastKilled === null) {
        return false;
    }
    if(cycle.active) {
        return false; // New cycle restarts double
    }
    const cycleInactiveTime = (cycle.rawCycle.cycleMinutes - cycle.rawCycle.activeMinutes) * 60;
    return lastKilled < (cycle.previousPreviousStartedAtSecondsEpoch + cycleInactiveTime);
}

function isBossUp(lastKilled, cycle) {
    if(lastKilled === null) {
        return false;
    }

    if(cycle.active) {
        return lastKilled < cycle.previousStartedAtSecondsEpoch;
    }
    return lastKilled < cycle.startedAtSecondsEpoch;
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
    const cycleStartedAtSecondsEpoch = currentTimeSeconds - timeInCycleSeconds;
    const previousStartedAtSecondsEpoch = cycleStartedAtSecondsEpoch - (cycle.cycleMinutes * 60);
    const previousPreviousStartedAtSecondsEpoch = previousStartedAtSecondsEpoch - (cycle.cycleMinutes * 60);
    const activeInSeconds = parseInt((cycle.cycleMinutes * 60) - timeInCycleSeconds, 10);
    const cycleProgressDouble = timeInCycleSeconds / (cycle.activeMinutes * 60) * 100;
    const cycleProgressPercent = parseInt(cycleProgressDouble, 10);
    const timeLeftInSeconds =  (cycle.activeMinutes * 60) - timeInCycleSeconds;
    const active = timeInCycleSeconds / (cycle.activeMinutes * 60) < 1;
    return {
        progressPercent: cycleProgressPercent,
        activeInSeconds: activeInSeconds,
        active: active,
        timeLeftInSeconds: timeLeftInSeconds,
        startedAtSecondsEpoch: cycleStartedAtSecondsEpoch,
        previousStartedAtSecondsEpoch: previousStartedAtSecondsEpoch,
        previousPreviousStartedAtSecondsEpoch: previousPreviousStartedAtSecondsEpoch,
        rawCycle: {...cycle}
    };
}

function fancyTimeFormat(duration) {
    // Hours, minutes and seconds
    const hrs = ~~(duration / 3600);
    const mins = ~~((duration % 3600) / 60);

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = "";

    if (hrs > 0) {
        ret += "" + hrs + "h ";
    }

    if(mins > 0) {
        ret += "" + mins + "m ";
    }

    if(mins === 0 && hrs === 0) {
        ret = secs + "s"
    }

    return ret;
}

function createBossTable(cycleBosses) {
    document.getElementById("grid-container-boss").innerHTML = "";
    let clearBosses = [];
    for (const cycleName in cycleBosses) {
        // boss name
        // up chance
        // cycle time left / time to next cycle
        clearBosses.push(...cycleBosses[cycleName]);
    }

    // const entries = Object.entries(clearBosses);
    clearBosses.sort((a, b) => {

        // Handle undefined 'cycle' values
        if (a.cycle === undefined && b.cycle !== undefined) {
            return 1; // Place undefined 'cycle' at the end
        }
        if (b.cycle === undefined && a.cycle !== undefined) {
            return -1; // Place undefined 'cycle' at the end
        }
        if (a.cycle === undefined && b.cycle === undefined) {
            return 0; // Both are undefined, keep them equal
        }

        if (a.double !== b.double) {
            return a.double === true ? -1 : 1;
        }

        if (a.up !== b.up) {
            return a.up === true ? -1 : 1;
        }

        if (a.dead !== b.dead) {
            return a.dead === true ? 1 : -1;
        }

        // First: Sort by 'active', with true first
        if (a.cycle.active !== b.cycle.active) {
            return a.cycle.active === true ? -1 : 1;
        }

        // Second: Sort by 'progressPercent'
        if (a.cycle.active && a.cycle.progressPercent !== b.cycle.progressPercent) {
            return b.cycle.progressPercent - a.cycle.progressPercent;
        }

        // Third: Sort by 'activeInSeconds'
        return a.cycle.activeInSeconds - b.cycle.activeInSeconds;
    });

    const sortedBosses = clearBosses; //Object.fromEntries(entries);
    console.log(sortedBosses);

    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-container';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create header row
    const headerRow = document.createElement('tr');
    addOneTableHeader(headerRow);
    thead.appendChild(headerRow);

    for (const index in sortedBosses) {
        const boss = sortedBosses[index];
        if(!boss.hidden || showHidden) {
            const bossRow = addOneTableBoss(boss)
            tbody.appendChild(bossRow);
        }
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);

    // Add table container to the DOM
    document.getElementById('grid-container-boss').appendChild(tableContainer);
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
            if(!item.hidden) {
                const bossRow = addBoss(item)
                tbody.appendChild(bossRow);
            }
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

    // const thAction = document.createElement('th');
    // thAction.textContent = "Action";
    // headerRow.appendChild(thAction);
}

function addOneTableHeader(headerRow) {
    const thName = document.createElement('th');
    thName.textContent = "Boss";
    headerRow.appendChild(thName);

    const thChance = document.createElement('th');
    thChance.textContent = "Chance";
    headerRow.appendChild(thChance);

    const thNext = document.createElement('th');
    thNext.textContent = "Cycle end";
    headerRow.appendChild(thNext);

    const thCycleEnd = document.createElement('th');
    thCycleEnd.textContent = "Next cycle";
    headerRow.appendChild(thCycleEnd);

    // const thAction = document.createElement('th');
    // thAction.textContent = "Action";
    // headerRow.appendChild(thAction);
}

function addOneTableBoss(boss) {
    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.id = "td-" + boss.name;
    tdName.textContent = boss.name;
    tdName.className = boss.dead ? "strikethrough" : "";
    row.appendChild(tdName);

    const tdChance = document.createElement('td');
    const cycleActive = boss.cycle !== undefined && boss.cycle.active;
    const hasChance = boss.up || (cycleActive && !boss.dead);
    let chanceText = boss.cycle !== undefined ? boss.cycle.progressPercent + '%' : "No info";
    if(!hasChance) {
        chanceText = "No chance";
    }
    if(boss.up) {
        chanceText = "UP!";
        tdChance.className = "boss-up";
    }
    if(boss.double) {
        chanceText = "Double!";
        tdChance.className = "boss-double-up";
    }
    tdChance.textContent = chanceText;
    const over50 = !boss.double && !boss.up && cycleActive && boss.cycle.progressPercent >= 50;
    const over75 = !boss.double && !boss.up && cycleActive && boss.cycle.progressPercent >= 75;
    if (over50) {
        tdChance.className = "boss-50-up";
    }
    if (over75) {
        tdChance.className = "boss-75-up";
    }
    if(!hasChance) {
        tdChance.className = "timer-not-active";
    }
    row.appendChild(tdChance);

    const tdCycleEnd = document.createElement('td');
    tdCycleEnd.textContent = boss.cycle ? ((cycleActive && !boss.dead) ? fancyTimeFormat(boss.cycle.timeLeftInSeconds) : "") : "No info";
    tdCycleEnd.className = cycleActive ? "timer-active" : "timer-not-active";
    row.appendChild(tdCycleEnd);

    const tdNextCycle = document.createElement('td');
    tdNextCycle.textContent = boss.cycle ? ((!cycleActive || boss.dead) ? fancyTimeFormat(boss.cycle.activeInSeconds) : "") : "No info";
    tdNextCycle.className = cycleActive ? "timer-active" : "timer-not-active";
    row.appendChild(tdNextCycle);

    return row;
}

function addBoss(boss) {
    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.id = "td-" + boss.name;
    tdName.textContent = boss.name + (boss.up ? "(UP!)" : "");
    tdName.className = boss.up ? "boss-up" : boss.dead ? "strikethrough" : "";
    row.appendChild(tdName);

    const tdLvl = document.createElement('td');
    tdLvl.textContent = boss.lvl;
    row.appendChild(tdLvl);

    const tdLoc = document.createElement('td');
    tdLoc.textContent = boss.location;
    row.appendChild(tdLoc);

    // const tdAction = document.createElement('td');
    // const actionElement = document.createElement('a');
    // actionElement.className = "link-button";
    // actionElement.textContent = "Dead";
    // actionElement.onclick = function() {
    //     bossDead(boss.name);
    // };
    // tdAction.appendChild(actionElement);
    // row.appendChild(tdAction);

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

let showHidden = false;
const toggleHiddenDiv = document.getElementById('toggle-hidden');

if(toggleHiddenDiv !== null) {
    const toggleButton = document.getElementById('toggle-button');
    const statusText = document.getElementById('toggle-text');

    // Add an event listener to handle the toggle action
    toggleButton.addEventListener('change', () => {
        if (toggleButton.checked) {
            statusText.textContent = 'Showing all bosses';
            showHidden = true;
            createBossTable(myBosses);
        } else {
            statusText.textContent = 'Basic bosses';
            showHidden = false;
            createBossTable(myBosses);
        }
    });
}