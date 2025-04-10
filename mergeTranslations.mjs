import { dirname, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const delimiter = '\t';

const uniqueTranslation = new Map();
let maxColumns = 0;

const readCsvFile = async (path) => {
    return readFile(path, 'utf8')
        .then((csv) => {
            const allLines = csv.split('\n');
            const headers = allLines[0].split(delimiter);
            maxColumns = Math.max(maxColumns, headers.length);
            const linesWithoutHeaders = allLines.slice(1);

            linesWithoutHeaders
                .filter((line) => !!line.trim())
                .forEach((line) => {
                    const fields = line.split(delimiter);
                    const key = fields[0];
                    const texts = fields.slice(1);
                    const locales = {};
                    headers.slice(1).forEach((locale, index) => {
                        locales[locale] = texts[index].trim();
                    });
                    if (!uniqueTranslation.has(key)) {
                        uniqueTranslation.set(key, locales);
                    }
                });
        })
        .catch((error) => {
            console.error('Error reading file:', error);
        });
};

const csvFiles = [
    join(__dirname, 'admin', 'src', 'locales', 'locales.csv'),
    join(__dirname, 'mobile', 'locales', 'locales.csv'),
    join(__dirname, 'server', 'locales', 'locales.csv'),
];

const writeUniqueTranslationsToFiles = async () => {
    const headers = ['key', ...Array.from(uniqueTranslation.values())[0] ? Object.keys(Array.from(uniqueTranslation.values())[0]) : []];
    const lines = [headers.join(delimiter)];

    const rows = [];
    uniqueTranslation.forEach((locales, key) => {
        const row = [key, ...headers.slice(1).map((locale) => locales[locale] || '')];
        rows.push(row);
    });

    rows.sort((a, b) => a[0].localeCompare(b[0]));
    rows.forEach((row) => lines.push(row.join(delimiter)));

    for (const csvFile of csvFiles) {
        try {
            await writeFile(csvFile, lines.join('\n'), 'utf8');
            console.log(`Unique translations written to ${csvFile}`);
        } catch (error) {
            console.error(`Error writing to file ${csvFile}:`, error);
        }
    }
};

(async () => {
    for (const csvFile of csvFiles) {
        await readCsvFile(csvFile);
    }
    await writeUniqueTranslationsToFiles();
})();
