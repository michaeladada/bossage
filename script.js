const SPREADSHEET_ID = '1nsi6raNA51ukPT-aTu5iTG3GNKLGU35lpDZKLDV88YU'; // Replace with your Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your desired sheet name

const cycles = {
    "Aden" : {
        startTimeEpochSeconds: "1726277400", // time date
        cycleMinutes: "240",
        activeMinutes: "150"
    },
    "Caspa" : {
        startTimeEpochSeconds: "1726277400", // time date
        cycleMinutes: "60",
        activeMinutes: "20"
    },
    // "1Drake" : {
    //     startTimeEpochSeconds: "1726288200", // time date
    //     cycleMinutes: "60",
    //     activeMinutes: "20"
    // },
    // "2Drake" : {
    //     startTimeEpochSeconds: "1726288200", // time date
    //     cycleMinutes: "60",
    //     activeMinutes: "20"
    // },
    "Beleth" : {
        startTimeEpochSeconds: "1726284600", // time date
        cycleMinutes: "300",
        activeMinutes: "90"
    },
    "Baphomet" : {
        startTimeEpochSeconds: "1726284600", // time date
        cycleMinutes: "300",
        activeMinutes: "90"
    },
    "DarkElder" : {
        startTimeEpochSeconds: "1726283400", // time date
        cycleMinutes: "120",
        activeMinutes: "90"
    },
    "DK" : {
        startTimeEpochSeconds: "1726290000", // time date
        cycleMinutes: "270",
        activeMinutes: "120"
    },
    "Night" : {
        startTimeEpochSeconds: "1725915600", // time date
        cycleMinutes: "240",
        activeMinutes: "120"
    },
    // "Ifrit" : {
    //     startTimeEpochSeconds: "1726288200", // time date
    //     cycleMinutes: "60",
    //     activeMinutes: "20"
    // }
}

// CSV export URL for public Google Sheets
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${SHEET_NAME}`;

async function fetchCSVData() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        const bossData = parseCSV(csvText);
        const cycleData = calculateCycles(cycles);
        createTable(bossData, cycleData);
    } catch (error) {
        console.error('Error fetching CSV data:', error);
    }
}

function calculateCycles(rawCycles) {
    const cycles = {};
    for (const rawCycleName in rawCycles) {
        if (!rawCycles.hasOwnProperty(rawCycleName)) {
            continue;
        }
        cycles[rawCycleName] = cycleActiveIn(rawCycles[rawCycleName]);
    }

    return cycles;
}

function parseCSV(csv) {
    // Split CSV into rows
    const rows = csv.trim().split('\n');

    // Initialize an empty object to hold the grouped data
    const bossData = {};

    // Process each row
    rows.forEach(row => {
        // Split row into columns based on tab delimiter
        const columns = row.split(',');

        // Extract values from columns
        const [name, lvl, cycle, loc, start, end] = columns;

        // If the group is not already a key in the object, initialize it with an empty array
        if (!bossData[cycle]) {
            bossData[cycle] = [];
        }

        // Push the current row's data into the appropriate group
        bossData[cycle].push({
            name: name,
            lvl: parseInt(lvl, 10),
            location: loc + ` (${start}, ${end.trim()})`
        });
    });

    return bossData;
}

function cycleActiveIn(cycle) {
    // const cycle = cycles[cycleName];
    if(cycle === undefined) {
        return { progressPercent: 0, activeInSeconds: 0, active: false };
    }
    const currentTimeSeconds = new Date().getTime() / 1000;
    const diff = currentTimeSeconds - cycle.startTimeEpochSeconds;
    const timeInCycleSeconds = diff % (cycle.cycleMinutes * 60);
    const activeInSeconds = parseInt((cycle.cycleMinutes * 60) - timeInCycleSeconds, 10);
    const cycleProgressDouble = timeInCycleSeconds / (cycle.activeMinutes * 60) * 100;
    const cycleProgressPercent = parseInt(cycleProgressDouble, 10);
    const active = timeInCycleSeconds / (cycle.activeMinutes * 60) < 1;
    return { progressPercent: cycleProgressPercent, activeInSeconds: activeInSeconds, active: active };
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

function createTable(cycleBosses, cycleData) {
    for (const cycleName in cycleBosses) {
        if (!cycleBosses.hasOwnProperty(cycleName)) {
            continue;
        }

        const cycle = cycleData[cycleName] || { progressPercent: 0, activeInSeconds: 0, active: false };
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';

        const div = document.createElement('div');
        div.className = "status-line " + (cycle.active ? "status-active" : "status-inactive");
        div.innerText = cycleName + " " + (cycle.active ? `(chance up: ${cycle.progressPercent}%)` : `(cycle start at: ${fancyTimeFormat(cycle.activeInSeconds)})`);
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

        tableContainer.appendChild(div);
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
}

function addBoss(boss) {
    const row = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = boss.name;
    row.appendChild(tdName);

    const tdLvl = document.createElement('td');
    tdLvl.textContent = boss.lvl;
    row.appendChild(tdLvl);

    const tdLoc = document.createElement('td');
    tdLoc.textContent = boss.location;
    row.appendChild(tdLoc);

    return row;
}


// Fetch and display data when the page loads
fetchCSVData();
