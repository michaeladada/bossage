const SPREADSHEET_ID = '1nsi6raNA51ukPT-aTu5iTG3GNKLGU35lpDZKLDV88YU'; // Replace with your Spreadsheet ID
const SHEET_NAME = 'Sheet1'; // Replace with your desired sheet name

// CSV export URL for public Google Sheets
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${SHEET_NAME}`;

async function fetchCSVData() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();

        const data = parseCSV(csvText);
        createTable(data);
    } catch (error) {
        console.error('Error fetching CSV data:', error);
    }
}

function parseCSV(csv) {
    // Split CSV into rows
    const rows = csv.trim().split('\n');

    // Initialize an empty object to hold the grouped data
    const groupedData = {};

    // Process each row
    rows.forEach(row => {
        // Split row into columns based on tab delimiter
        const columns = row.split(',');

        // Extract values from columns
        const [name, lvl, cycle, loc, start, end] = columns;

        // If the group is not already a key in the object, initialize it with an empty array
        if (!groupedData[cycle]) {
            groupedData[cycle] = [];
        }

        // Push the current row's data into the appropriate group
        groupedData[cycle].push({
            name: name,
            lvl: parseInt(lvl, 10),
            location: loc + ` (${start}, ${end.trim()})`
        });
    });

    return groupedData;
}



function createTable(cycleBosses) {
    for (const cycle in cycleBosses) {
        if (!cycleBosses.hasOwnProperty(cycle)) {
            continue;
        }

        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';

        const div = document.createElement('div');
        div.className = "status-line status-inactive";
        div.innerText = cycle;
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Create header row
        const headerRow = document.createElement('tr');
        addHeader(headerRow);
        thead.appendChild(headerRow);

        cycleBosses[cycle].forEach(item => {
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
