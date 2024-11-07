import { dirname, join } from 'path';
import { readFile, writeFile } from 'fs/promises';

import { fileURLToPath } from 'url';
import { supportedLocales } from './config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getLanguageSet = async (locale) => {
  try {
    const json = await readFile(join(__dirname, `${locale}.json`), 'utf-8');
    return JSON.parse(json);
  } catch (error) {
    console.error(`Error reading ${locale}.json:`, error);
    throw error;
  }
};

const generateCSV = async () => {
  let csv = '';
  const languages = {};
  const locales = Object.keys(supportedLocales);

  try {
    await Promise.all(
      locales.map(async (locale) => {
        languages[locale] = await getLanguageSet(locale);
      })
    );

    const keys = Object.keys(languages.en);
    keys.forEach((key) => {
      const line = [key];
      locales.forEach((locale) => {
        if (key === 'days_of_week') {
          const daysOfWeek = languages[locale][key];
          const dayKeys = Object.keys(daysOfWeek);
          const dayValues = [];
          dayValues.push(`name;shortcut`);
          dayKeys.forEach((day) => {
            dayValues.push(`${daysOfWeek[day].name};${daysOfWeek[day].shortcut}`);
          });
          line.push(dayValues.join(','));
        } else {
          line.push(languages[locale][key]);
        }
      });
      csv += `${line.join('\t')}\n`;
    });

    await writeFile(join(__dirname, 'locales.csv'), csv, 'utf-8');
    console.log('locales.csv created successfully.');
  } catch (error) {
    console.error('Error generating CSV:', error);
  }
};

generateCSV();
