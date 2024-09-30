const fs = require('fs');
const path=require('path');


// Define file paths
const currentDir = __dirname;

// Define file paths relative to the current directory
const outputFilePath = path.join(currentDir, 'output.json');
const duplicatesFilePath = path.join(currentDir, 'duplicates.txt');
const allEntriesFilePath = path.join(currentDir, 'all_entries.txt');





// Read the Newman output file
let data;
try {
    data = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
} catch (err) {
    console.error('Error reading or parsing output.json:', err);
    process.exit(1);
}

// Extract the response stream and convert it to a string
let responseBody;
try {
    const execution = data.run?.executions?.[0];
    if (execution?.response?.stream) {
        const responseStream = execution.response.stream;
        responseBody = Buffer.from(responseStream).toString('utf-8');
        responseBody = JSON.parse(responseBody); // Parse the JSON response
    } else {
        console.error('No response stream found.');
        process.exit(1);
    }
} catch (err) {
    console.error('Error processing response stream:', err);
    process.exit(1);
}

// Extract the duplicateEntries and allEntries from environment variables
let duplicateEntries = [];
let allEntries = [];
try {
    const envVariables = data.run?.executions?.[0]?.environment?.values || data.environment?.values || [];

    const duplicateVar = envVariables.find(v => v.key === 'duplicateEntries');
    const allEntriesVar = envVariables.find(v => v.key === 'allEntries');

    if (duplicateVar) {
        duplicateEntries = JSON.parse(duplicateVar.value);
    } else {
        console.log('No duplicate entries found.');
    }

    if (allEntriesVar) {
        allEntries = JSON.parse(allEntriesVar.value);
    } else {
        console.log('No all entries found.');
    }
} catch (err) {
    console.error('Error extracting entries from environment variables:', err);
    process.exit(1);
}

// Prepare the formatted entries
const formattedDuplicates = duplicateEntries.length 
    ? duplicateEntries.map(entry => `Title: ${entry.title}, Email: ${entry.email}, Phone: ${entry.phone}, URL: ${entry.url}`).join('\n') 
    : 'No duplicate entries found.';
const formattedAllEntries = allEntries.length 
    ? allEntries.map(entry => `Title: ${entry.title}, Email: ${entry.email}, Phone: ${entry.phone}, URL: ${entry.url}`).join('\n') 
    : 'No entries found.';

// Write duplicates to file
try {
    fs.writeFileSync(duplicatesFilePath, formattedDuplicates + '\n');
    console.log('Duplicate entries written to duplicates.txt');
} catch (err) {
    console.error('Error writing to duplicates.txt:', err);
}

// Write all entries to file
try {
    fs.writeFileSync(allEntriesFilePath, formattedAllEntries + '\n');
    console.log('All entries written to all_entries.txt');
} catch (err) {
    console.error('Error writing to all_entries.txt:', err);
}
