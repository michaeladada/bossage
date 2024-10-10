const cycles = {
    "Aden" : {
        startTimeEpochSeconds: "1726277400", // time date
        startTimeIsoEdt: "2024-09-13T21:30:00-04:00", // time date
        cycleMinutes: "240",
        activeMinutes: "150"
    },
    "Caspa" : {
        startTimeEpochSeconds: "1726277400", // time date
        startTimeIsoEdt: "2024-09-14T01:30:00-04:00", // time date
        cycleMinutes: "60",
        activeMinutes: "30"
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
        startTimeEpochSeconds: "1726698600", // time date
        startTimeIsoEdt: "2024-09-18T18:30:00-04:00", // time date
        cycleMinutes: "300",
        activeMinutes: "120"
    },
    "Baphomet" : {
        startTimeEpochSeconds: "1726698600", // time date
        startTimeIsoEdt: "2024-09-18T18:30:00-04:00", // time date
        cycleMinutes: "300",
        activeMinutes: "150"
    },
    "DarkElder" : {
        startTimeEpochSeconds: "1726747800", // time date
        startTimeIsoEdt: "2024-09-19T08:10:00-04:00", // time date
        cycleMinutes: "120",
        activeMinutes: "110"
    },
    "DK" : {
        startTimeEpochSeconds: "1726290000", // time date
        startTimeIsoEdt: "2024-09-14T01:00:00-04:00", // time date
        cycleMinutes: "270",
        activeMinutes: "120"
    },
    "Night" : {
        startTimeEpochSeconds: "1725919200", // time date
        startTimeIsoEdt: "2024-09-09T18:00:00-04:00", // time date
        cycleMinutes: "240",
        activeMinutes: "120"
    },
    "Oren" : {
        startTimeEpochSeconds: "1728394200", // time date
        startTimeIsoEdt: "2024-10-08T09:30:00-04:00", // time date
        cycleMinutes: "210",
        activeMinutes: "90"
    }
}

const bossesDeath = [
    // { name: "Ancient Giant", deathTime: 1726600058},
    // { name: "Dark Elder", deathTime: 1726597001},
    // { name: "Dark Elder", deathTime: 1726597301},
    // { name: "Ken Rauhel", deathTime: 1726290000},
    // { name: "Beleth", deathTime: 1726290000},
    // { name: "Baphomet", deathTime: 1720290000},
]

const SPREADSHEET_ID = '1ksa0AwGso9-Sp5-ngRmQthQbU-yE9DybUc9yIFlqip4'; // Replace with your Spreadsheet ID
const BOSSES_SHEET_NAME = 'sheet=bosses';
const TOKEN_SHEET_NAME = 'gid=1537872992';
const CYCLE_SHEET_NAME = 'gid=1253370658';

// CSV export URL for public Google Sheets
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&`;
let myBosses = null;

async function fetchCSVData() {
    const fetchData = {};
    try {
        const tokenResponse = await fetch(CSV_URL + TOKEN_SHEET_NAME);
        window.discordToken = await tokenResponse.text();

        const response = await fetch(CSV_URL + BOSSES_SHEET_NAME);
        const csvText = await response.text();

        fetchData.bossData = parseCSV(csvText);
        myBosses = fetchData.bossData;
        fetchData.cycles = await parseCyclesCSV();
    } catch (error) {
        logError("Failed to load data from CSV. Please try again.")
        console.error('Error fetching CSV data:', error);
        return;
    }

    try {
        fetchData.bossesDeath = await processBossData();
    } catch (error) {
        logError("Failed to load data from discord. Please try again.")
        console.error('Error fetching discord data:', error);
        return;
    }

    try {
        buildCycleBossTable(fetchData.bossData, fetchData.cycles, fetchData.bossesDeath);
    } catch (error) {
        logError("Failed to build boss table.")
        console.error('Error fetching CSV data:', error);
    }
}

function logError(message) {
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.remove('hidden');
    errorMessage.innerText = message;
    pageLoaded();
}

async function parseCyclesCSV() {
    const response = await fetch(CSV_URL + CYCLE_SHEET_NAME);
    const csvText = await response.text();

    const rows = csvText.trim().split('\n');

    const cycleData = {};

    // Remove Header row
    rows.shift();

    // Process each row
    rows.forEach(row => {
        // Split row into columns based on tab delimiter
        const columns = row.split(',');

        // Extract values from columns
        const [name, activeMinutes, cycleMinutes, startTimeIsoEdt] = columns;

        cycleData[name] = {
            startTimeIsoEdt: startTimeIsoEdt,
            cycleMinutes: cycleMinutes,
            activeMinutes: activeMinutes
        };
    });

    return cycleData;
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
        const [name, cycle, hidden] = columns;

        // If the group is not already a key in the object, initialize it with an empty array
        if (!bossData[cycle]) {
            bossData[cycle] = [];
        }

        // Push the current row's data into the appropriate group
        bossData[cycle].push({
            name: name,
            hidden: hidden.trim()
            // cycle: cycle,
            // lvl: parseInt(lvl, 10),
            // location: loc// + ` (${start}, ${end.trim()})`
        });
    });

    return bossData;
}
