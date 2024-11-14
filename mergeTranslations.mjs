const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');

const csvFiles = [
    'path/to/your/file1.csv',
    'path/to/your/file2.csv',
    'path/to/your/file3.csv'
];


const translations = {};

function parseCsvFile(filePath) {
    return new Promise((resolve) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const key = row['key'];

                if (!translations[key]) {
                    translations[key] = { key };
                }

                Object.keys(row).forEach((col) => {
                    if (col !== 'key') {
                        translations[key][col] = row[col];
                    }
                });
            })
            .on('end', resolve);
    });
}
async function saveTranslationsToOriginalFiles() {
    for (const file of csvFiles) {

        const headers = await new Promise((resolve) => {
            const headers = [];
            fs.createReadStream(file)
                .pipe(csv())
                .on('headers', (headerRow) => {
                    headerRow.forEach((header) => headers.push(header));
                    resolve(headers);
                });
        });

        const records = Object.values(translations).map((row) => {
            const filteredRow = {};
            headers.forEach((header) => {
                filteredRow[header] = row[header] || '';
            });
            return filteredRow;
        });

        const csvWriter = createCsvWriter({
            path: file,
            header: headers.map((header) => ({ id: header, title: header })),
        });

        await csvWriter.writeRecords(records);
        console.log(`Updated translations saved to ${file}`);
    }
}

async function mergeAndApplyCsvFiles() {
    for (const file of csvFiles) {
        await parseCsvFile(file);
    }

    await saveTranslationsToOriginalFiles();
}


mergeAndApplyCsvFiles();
