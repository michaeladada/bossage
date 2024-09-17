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
        activeMinutes: "120"
    },
    "Baphomet" : {
        startTimeEpochSeconds: "1726284600", // time date
        cycleMinutes: "300",
        activeMinutes: "150"
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
        startTimeEpochSeconds: "1725919200", // time date
        cycleMinutes: "240",
        activeMinutes: "120"
    },
    // "Ifrit" : {
    //     startTimeEpochSeconds: "1726288200", // time date
    //     cycleMinutes: "60",
    //     activeMinutes: "20"
    // }
}

const bossesDeath = [
    { name: "Ancient Giant", deathTime: 1726600058},
    { name: "Dark Elder", deathTime: 1726597001},
    { name: "Dark Elder", deathTime: 1726597301},
    { name: "Ken Rauhel", deathTime: 1726290000},
    { name: "Beleth", deathTime: 1726290000},
    { name: "Baphomet", deathTime: 1720290000},
]

const SPREADSHEET_ID = '1nsi6raNA51ukPT-aTu5iTG3GNKLGU35lpDZKLDV88YU'; // Replace with your Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your desired sheet name

// CSV export URL for public Google Sheets
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${SHEET_NAME}`;

async function fetchCSVData() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        const bossData = parseCSV(csvText);
        buildCycleBossTable(bossData, cycles, bossesDeath);
    } catch (error) {
        console.error('Error fetching CSV data:', error);
    }
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