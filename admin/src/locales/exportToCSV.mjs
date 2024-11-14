import { dirname, join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { supportedLocales } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const getLanguageSet = async (locale) => {
  try {
    const json = await readFile(join(__dirname, `${locale}.json`), 'utf-8')
    return JSON.parse(json)
  } catch (error) {
    console.error(`Error reading ${locale}.json:`, error)
    throw error
  }
}

const generateCSV = async () => {
  let csv = 'key'
  const languages = {}
  const locales = Object.keys(supportedLocales)

  csv += `\t${locales.join('\t')}\n`

  try {
    await Promise.all(
      locales.map(async (locale) => {
        languages[locale] = await getLanguageSet(locale)
      })
    )

    const keys = Object.keys(languages.en)
    const csvLines = []

    keys.forEach((key) => {
      if (key === 'days_of_week') {
        const daysOfWeek = Object.keys(languages.en[key])
        daysOfWeek.forEach((day) => {
          const lineName = [`day_${day}_name`]
          const lineShortcut = [`day_${day}_shortcut`]
          locales.forEach((locale) => {
            lineName.push(languages[locale][key][day].name)
            lineShortcut.push(languages[locale][key][day].shortcut)
          })
          csvLines.push(lineName.join('\t'))
          csvLines.push(lineShortcut.join('\t'))
        })
      } else {
        const line = [key]
        locales.forEach((locale) => {
          line.push(languages[locale][key])
        })
        csvLines.push(line.join('\t'))
      }
    })

    csv += csvLines.join('\n')

    await writeFile(join(__dirname, 'locales.csv'), csv, 'utf-8')
    console.log('locales.csv created successfully.')
  } catch (error) {
    console.error('Error generating CSV:', error)
  }
}

generateCSV()
