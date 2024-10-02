const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'FrontEnd' folder
app.use(express.static(path.join(__dirname, '../FrontEnd')));

// Serve index.html on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../FrontEnd/index.html'));
});

// Paths for the files (Consider moving these to environment variables)
const environmentFilePath = path.join(__dirname, 'Local.ch.postman_environment.json');
const collectionFilePath = path.join(__dirname, 'Local.ch.postman_collection.json');
const outputFilePath = path.join(__dirname, 'output.json');
const duplicatesFilePath = path.join(__dirname, 'duplicates.txt');
const allEntriesFilePath = path.join(__dirname, 'all_entries.txt');
const scriptFilePath = path.join(__dirname, 'Script.js');

// Endpoint to handle form submission
app.post('/search', (req, res) => {
    const searchQuery = req.body.searchQuery;

    if (!searchQuery) {
        return res.status(400).json({ error: 'No search query provided.' });
    }

    // Read and update environment JSON
    fs.readFile(environmentFilePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading environment file:', err);
            return res.status(500).json({ error: 'Failed to read environment file.' });
        }

        let envData;
        try {
            envData = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing environment file:', parseErr);
            return res.status(500).json({ error: 'Failed to parse environment file.' });
        }

        // Update searchQuery in environment file
        const searchVar = envData.values.find(v => v.key === 'searchQuery');
        if (searchVar) {
            searchVar.value = searchQuery;
        } else {
            envData.values.push({
                key: 'searchQuery',
                value: searchQuery,
                type: 'default',
                enabled: true
            });
        }

        // Write updated environment back to file
        fs.writeFile(environmentFilePath, JSON.stringify(envData, null, 2), 'utf-8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing environment file:', writeErr);
                return res.status(500).json({ error: 'Failed to write environment file.' });
            }

            // Run Newman command
            const newmanCmd = `newman run "${collectionFilePath}" -e "${environmentFilePath}" --reporters cli,json --reporter-json-export "${outputFilePath}"`;

            exec(newmanCmd, (newmanErr, stdout, stderr) => {
                if (newmanErr) {
                    console.error('Error running Newman:', newmanErr);
                    return res.status(500).json({ error: 'Failed to run Newman.' });
                }
                console.log('Newman run completed:', stdout);

                // Run the processing script (Script.js)
                exec(`node "${scriptFilePath}"`, (scriptErr, scriptStdout, scriptStderr) => {
                    if (scriptErr) {
                        console.error('Error running Script.js:', scriptErr);
                        return res.status(500).json({ error: 'Failed to run processing script.' });
                    }
                    console.log('Processing script completed:', scriptStdout);

                    // Read the duplicates and all entries files and return the data to the frontend
                    fs.readFile(duplicatesFilePath, 'utf-8', (dupErr, dupData) => {
                        if (dupErr) {
                            console.error('Error reading duplicates file:', dupErr);
                            return res.status(500).json({ error: 'Failed to read duplicates data.' });
                        }

                        fs.readFile(allEntriesFilePath, 'utf-8', (allErr, allData) => {
                            if (allErr) {
                                console.error('Error reading all entries file:', allErr);
                                return res.status(500).json({ error: 'Failed to read all entries data.' });
                            }

                            // Send the data back as JSON
                            res.json({
                                duplicates: parseEntries(dupData),
                                allEntries: parseEntries(allData)
                            });
                        });
                    });
                });
            });
        });
    });
});

// Function to parse entries from text data
const parseEntries = (data) => {
    return data.trim().split('\n').map(line => {
        const match = line.match(/Title:\s*(.*),\s*Email:\s*(.*),\s*Phone:\s*(.*),\s*URL:\s*(.*)/);
        if (match) {
            return { title: match[1], email: match[2], phone: match[3], url: match[4] };
        }
        return null;
    }).filter(Boolean);
};

// Start the server
const PORT = process.env.PORT || 3000; // Default to 3000 if PORT is not set
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
