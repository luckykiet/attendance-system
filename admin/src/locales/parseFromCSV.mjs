import { days as _days, supportedLocales } from './config.mjs';
import { dirname, join } from 'path';
import { readFile, writeFile } from 'fs/promises';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

readFile('locales.csv', 'utf8')
  .then((csv) => {
    const translations = {};
    csv
      .split('\n')
      .filter((line) => !!line.trim())
      .forEach((line) => {
        const fields = line.split('\t');
        const key = fields[0];
        const locales = {};
        Object.keys(supportedLocales).forEach((locale, index) => {
          locales[locale] = fields[index + 1];
        });
        translations[key] = locales;
      });

    const daysOfWeek = {
      ...translations.days_of_week
    };
    delete translations.days_of_week;
    let td = {};
    Object.keys(daysOfWeek).forEach((language) => {
      let newDaysOfWeek = {};
      const data = daysOfWeek[language];
      const days = data.split(',');
      const keys = days[0].split(';');
      days.shift();
      _days.forEach((day, index) => {
        const splittedDay = days[index].split(';');
        const obj = { [keys[0]]: splittedDay[0], [keys[1]]: splittedDay[1] };
        newDaysOfWeek[day] = obj;
      });
      td[language] = newDaysOfWeek;
    });
    translations.days_of_week = td;

    return Promise.all(
      Object.keys(supportedLocales).map(async (locale) => {
        const data = {};
        Object.keys(translations).forEach((key) => {
          data[key] = translations[key][locale];
        });

        const json = JSON.stringify(data, null, 2)
          .replace(/\n/g, '\r\n')
          .replace(/"(["]+)":/g, '$1:')
          .replace(/,\r\n}/g, '\r\n}');

        const localeFolderPath = join(__dirname, `${locale}.json`);
        await writeFile(localeFolderPath, json);
      })
    );
  })
  .catch((error) => {
    console.error('Error reading or writing files:', error);
  });
