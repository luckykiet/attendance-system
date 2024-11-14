import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

const csvFiles = [
    'admin/src/locales/locales.csv',
    'mobile/locales/locales.csv',
];

const translations = {};
let baseHeaders = [];

function parseCsvFile(filePath) {
    return new Promise((resolve) => {
        let headersCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv({ separator: '\t' })) // Specify tab as delimiter for reading
            .on('headers', (headers) => {
                if (headers.length > headersCount) {
                    headersCount = headers.length;
                    baseHeaders = headers; // Set base headers to the file with the most columns
                }
            })
            .on('data', (row) => {
                const key = row['key']; // Assuming the first column is 'key'

                if (!translations[key]) {
                    translations[key] = { key };
                }

                // Union each language column from the row into the translations object
                Object.keys(row).forEach((col) => {
                    if (col !== 'key' && row[col] !== undefined) {
                        translations[key][col] = row[col];
                    }
                });
            })
            .on('end', resolve);
    });
}

// Function to save the unioned translations back to each original CSV with tabs
async function saveUnionedTranslationsToFiles() {
    for (const file of csvFiles) {
        // Prepare records for writing, filling missing columns with the first column value
        const records = Object.values(translations).map((row) => {
            return baseHeaders.map((header) => row[header] || row[baseHeaders[0]] || ''); // Fill with first column value if missing
        });

        // Write updated unioned records back to the file with tab delimiters
        const outputFilePath = path.resolve(file);
        const headerLine = baseHeaders.join('\t');
        const dataLines = records.map(record => record.join('\t')).join('\n');
        const finalOutput = `${headerLine}\n${dataLines}`;

        fs.writeFileSync(outputFilePath, finalOutput, 'utf8');
        console.log(`Unioned translations saved to ${file}`);
    }
}

// Main function to union CSV files and update originals
async function unionAndApplyCsvFiles() {
    for (const file of csvFiles) {
        await parseCsvFile(file);
    }

    // Save the unioned translations back to each original file
    await saveUnionedTranslationsToFiles();
}

// Run the script
unionAndApplyCsvFiles();
