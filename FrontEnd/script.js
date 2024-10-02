document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('searchForm');
    const showDuplicatesBtn = document.getElementById('showDuplicates');
    const showAllBtn = document.getElementById('showAll');
    const duplicatesTable = document.getElementById('duplicatesTable');
    const allEntriesTable = document.getElementById('allEntriesTable');
    const buttonsDiv = document.getElementById('buttons');
    const processingMessage = document.createElement('div');  // Create the processing message element

    processingMessage.id = 'processingMessage';  // Give it an id
    processingMessage.style.display = 'none';  // Initially hidden
    processingMessage.textContent = 'Processing, please wait...';
    document.body.appendChild(processingMessage);  // Append it to the body

    let duplicatesData = [];
    let allEntriesData = [];

    // Function to render table rows
    const renderTableRows = (data, table) => {
        const tbody = table.querySelector('tbody');
        tbody.innerHTML = '';  // Clear the table body
        console.log(data);

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No entries found.</td></tr>';
        } else {
            data.forEach(entry => {
                console.log(entry);
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${entry.title}</td>
                <td>${entry.email}</td>
                <td>${entry.phone}</td>
                <td>${entry.url}</td>`;
                tbody.appendChild(row);
            });
        }
    };

    // Hide tables and buttons initially
    duplicatesTable.style.display = 'none';
    allEntriesTable.style.display = 'none';
    buttonsDiv.style.display = 'none';
    processingMessage.style.display = 'none';  // Hide processing message initially

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchQuery = document.getElementById('searchQuery').value.trim();

        if (!searchQuery) {
            alert('Please enter a search query.');
            return;
        }

        // Show the processing message
        processingMessage.style.display = 'block';

        // Hide previous tables and buttons
        duplicatesTable.style.display = 'none';
        allEntriesTable.style.display = 'none';
        buttonsDiv.style.display = 'none';

        // Send search query to server
        fetch('/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ searchQuery })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch data from server');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
                return;
            }

            duplicatesData = data.duplicates;
            allEntriesData = data.allEntries;

            // Hide the processing message
            processingMessage.style.display = 'none';

            // Show buttons if there are results
            if (duplicatesData.length > 0 || allEntriesData.length > 0) {
                buttonsDiv.style.display = 'block';  // Show the buttons to display tables
            } else {
                alert('No results found.');
                buttonsDiv.style.display = 'none';  // Hide buttons if no results
            }
        })
        .catch(err => {
            console.error('Error:', err);
            processingMessage.textContent = 'An error occurred while processing your request. Please try again.';
        });
    });

    showDuplicatesBtn.addEventListener('click', () => {
        renderTableRows(duplicatesData, duplicatesTable);
        duplicatesTable.style.display = 'table';
        allEntriesTable.style.display = 'none';
    });

    showAllBtn.addEventListener('click', () => {
        renderTableRows(allEntriesData, allEntriesTable);
        allEntriesTable.style.display = 'table';
        duplicatesTable.style.display = 'none';
    });
});


function exportToExcel() {
    // Get the table element
    var table = document.getElementById('allEntriesTable');
    
    // Create a new workbook and add the worksheet
    var workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
   
    
    // Export the workbook
    XLSX.writeFile(workbook, 'AllDataRecord.xlsx');
    
}


function exportToExcelDuplicate(){
    var dupTable=document.getElementById('duplicatesTable');
    var workbookSecond=XLSX.utils.table_to_book(dupTable, { sheet: "Sheet1" });
    XLSX.writeFile(workbookSecond, 'DuplicateDataRecord.xlsx');
}




function checkRecordCount() {
    // Show button only if there are more than 0 records
    var exportButton = document.getElementById('AllexportButton');
    var exportDupButton=document.getElementById('DupexportButton');
        exportButton.style.display = 'block';
        exportDupButton.style.display='none';
    
  
    
}

function checkDupRecordCount(){
    var exportDupButton=document.getElementById('DupexportButton');
    var exportButton = document.getElementById('AllexportButton');
    exportDupButton.style.display='block';
    exportButton.style.display = 'none';
}

