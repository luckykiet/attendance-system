import { PRIVILEGES } from '@/configs'
import _ from 'lodash'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import { months } from './constants'
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)

export const convertToBase64 = async (file) => {
  let result_base64 = await new Promise((resolve) => {
    let fileReader = new FileReader()
    fileReader.onload = () => resolve(fileReader.result)
    fileReader.onerror = (error) => {
      console.error(error)
    }
    fileReader.readAsDataURL(file)
  })
  return result_base64
}

export const renderIcon = (icon) => {
  const IconComponent = icon
  return <IconComponent />
}

export const isValidHexColor = (color) => {
  return /^#([0-9a-f]{3}){1,2}$/i.test(color)
}

export const isExpired = (startTime, timeRangeInMinut) => {
  const now = dayjs()
  const duration = dayjs.duration(now.diff(dayjs(startTime)))
  const minuts = duration.asMinutes()
  return minuts > timeRangeInMinut
}

//https://cs.wikipedia.org/wiki/Identifikačn%C3%AD_č%C3%ADslo_osonumberArrayy
export const checkICO = (ico) => {
  try {
    const regex = /^\d{8}$/
    if (!regex.test(ico)) {
      return false
    }
    // x = (11-((8*numberArray[0] + ... + 2*numberArray[6])%11))%10
    let sum = 0
    const numberArray = ico.split('')
    for (let weight = 0; weight < numberArray.length - 1; weight++) {
      sum += parseInt(numberArray[weight]) * (numberArray.length - weight)
    }
    sum = sum % 11
    const x = (11 - sum) % 10
    return x === parseInt(numberArray.slice(-1)) ? true : false
  } catch (error) {
    console.error(error)
    return false
  }
}

export const generateRandomIco = () => {
  const randomNum = Math.floor(Math.random() * 9000000) + 1000000
  const numberArray = randomNum.toString().split('')
  let sum = 0
  for (let weight = 0; weight < numberArray.length; weight++) {
    sum += parseInt(numberArray[weight]) * (numberArray.length + 1 - weight)
  }
  sum = sum % 11
  numberArray.push((11 - sum) % 10)
  return numberArray.join('')
}

export const addSlashAfterUrl = (url) => {
  if (url && !url.endsWith('/')) {
    url = url + '/'
  }
  return url
}

export const removeSlashFromUrl = (url) => {
  if (url.endsWith('/')) {
    url = url.replace(/\/+$/, '')
  }
  return url
}

export const stringToValidFilename = (str) => {
  return str.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const arraysAreEqual = (arrayA, arrayB) => {
  const sortedArrayA = arrayA.sort()
  const sortedArrayB = arrayB.sort()
  if (sortedArrayA.length !== sortedArrayB.length) {
    return false
  }
  return sortedArrayA.every((element, index) => element === sortedArrayB[index])
}

export const addDecimalAndNonNegative = (value) => {
  let defaultValue = '0.00'
  if (!isNaN(value) && parseFloat(value) >= 0) {
    defaultValue = parseFloat(value).toFixed(2)
  } else if (value === '') {
    defaultValue = '0.00'
  }
  return defaultValue
}

export const formatPhoneNumber = (string, clearPrefix = false) => {
  try {
    if (!string) return ''
    let input = string
    if (clearPrefix) {
      input = input.replace('+420', '')
    }
    const cleanedValue = input.replace(/\s/g, '')
    const formattedValue = cleanedValue.replace(/(\d{3})(?=\d)/g, '$1 ')
    return formattedValue.trim()
  } catch (error) {
    console.error(error)
    return ''
  }
}

export const formatCzechPostalCode = (input) => {
  try {
    const cleanedInput = input.replace(/\s+/g, '')
    const formattedCode = cleanedInput.replace(/(\d{3})(\d{2})$/, '$1 $2')
    return formattedCode
  } catch (error) {
    console.log(error)
    return ''
  }
}

export const capitalizeUpperCaseEveryWord = (str) => {
  const arr = str.split(' ')
  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1)
  }
  const str2 = arr.join(' ')
  return str2
}

export const capitalizeFirstLetterOfString = (str) => {
  if (!str || str.length === 0) return ''
  const firstLetter = str.charAt(0).toUpperCase()
  const restOfWord = str.slice(1)
  return firstLetter + restOfWord
}

export const splitBankAccountNumber = (bankAccount) => {
  const splitPrefix = bankAccount.split('-')
  const splitBankNumber =
    splitPrefix.length === 2
      ? splitPrefix[1].split('/')
      : splitPrefix[0].split('/')
  const accNumber = !isNaN(splitBankNumber[0]) ? splitBankNumber[0] : ''
  const prefix =
    splitPrefix.length === 2 && !isNaN(splitPrefix[0]) ? splitPrefix[0] : ''
  const bankNumber =
    splitBankNumber.length === 2 && !isNaN(splitBankNumber[1])
      ? splitBankNumber[1]
      : ''
  return {
    prefixNumber: prefix,
    accountNumber: accNumber,
    bankNumber: bankNumber,
  }
}

export const numberWithSpaces = (x) => {
  const numberValue = Number(x)
  const formattedNumber = numberValue.toLocaleString('cs-CZ', {
    minimumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
    maximumFractionDigits: numberValue % 1 === 0 ? 0 : 2,
  })

  return formattedNumber
}

export const replaceNullWithEmptyString = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    if (obj === null) {
      return ''
    }
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => replaceNullWithEmptyString(item))
  } else {
    const newObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = replaceNullWithEmptyString(obj[key])
      }
    }
    return newObj
  }
}

export const checkBankAccount = (prefix, accountNumber) => {
  if ((prefix !== '' && isNaN(prefix)) || isNaN(accountNumber)) {
    return false
  }
  const weights = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1].reverse()
  const checkNumber = (number) => {
    const array = number.toString().split('').reverse()
    let sum = 0
    for (let i = 0; i < array.length; i++) {
      sum += parseInt(array[i]) * weights[i]
    }
    return sum % 11 === 0
  }
  const regexPrefix = /^\d{2,6}$/
  const regexAN = /^\d{2,10}$/
  const parsedPrefix = parseInt(prefix)
  const parsedAccountNumber = parseInt(accountNumber)

  if (prefix !== '' || parsedPrefix > 0) {
    if (!regexPrefix.test(prefix) || !checkNumber(parsedPrefix)) {
      return false
    }
  }

  if (!regexAN.test(accountNumber) || !checkNumber(parsedAccountNumber)) {
    return false
  }
  return true
}

export const getBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const baseURL = reader.result
      resolve(baseURL)
    }
  })
}

export const dirtyValues = (dirtyFields, allValues) => {
  if (dirtyFields === true || Array.isArray(dirtyFields)) {
    return allValues
  }
  return Object.fromEntries(
    Object.keys(dirtyFields).map((key) => [
      key,
      dirtyValues(dirtyFields[key], allValues[key]),
    ])
  )
}

const descendingComparator = (a, b, orderBy) => {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

export const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy)
}

export const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

export const getStorageFormData = ({
  formDataKey = '',
  defaultValues = {},
}) => {
  let data = localStorage.getItem(formDataKey)
  if (data) {
    try {
      data = JSON.parse(data)
    } catch (err) {
      console.log(err)
    }
    return data
  }
  return defaultValues
}

export const mergeObjects = (obj1, obj2) => {
  return _.merge(obj1, obj2)
}

export const filterObjectWithValue = (object, value, excludes = []) => {
  const isExcluded = (key) =>
    excludes.some((excludedKey) => _.startsWith(key, excludedKey))

  if (_.isPlainObject(object)) {
    const resultObject = {}
    Object.keys(object).forEach((key) => {
      if (!isExcluded(key)) {
        const filteredValue = filterObjectWithValue(
          object[key],
          value,
          excludes
        )
        if (filteredValue !== undefined) {
          resultObject[key] = filteredValue
        }
      }
    })
    return Object.keys(resultObject).length ? resultObject : undefined
  } else if (_.isArray(object)) {
    const result = []
    object.forEach((item) => {
      const resultObject = {}
      Object.keys(item).forEach((key) => {
        if (!isExcluded(key)) {
          const filteredValue = filterObjectWithValue(
            item[key],
            value,
            excludes
          )
          if (filteredValue !== undefined) {
            resultObject[key] = filteredValue
          }
        }
      })
      if (Object.keys(resultObject).length) {
        result.push(resultObject)
      }
    })
    return result.length ? result : undefined
  } else {
    return object === value ? object : undefined
  }
}

export const mergeSameKeys = (obj1, obj2) => {
  if (_.isPlainObject(obj1) && _.isPlainObject(obj2)) {
    const commonKeys = _.intersection(Object.keys(obj1), Object.keys(obj2))

    const mergedObject = {}
    commonKeys.forEach((key) => {
      mergedObject[key] = mergeSameKeys(obj1[key], obj2[key])
    })
    return mergedObject
  } else {
    return obj2 ? obj2 : obj1
  }
}

export const errorFormHandler = (error, t, setError, fields) => {
  let err = ''
  if (error) {
    if (error instanceof Object) {
      Object.keys(error).map((field) => {
        if (fields[field]) {
          setError(
            field,
            {
              type: 'custom',
              message: capitalizeFirstLetterOfString(t(error[field])),
            },
            {
              shouldFocus: true,
            }
          )
        }
      })
    } else {
      err = new Error(capitalizeFirstLetterOfString(t(error)))
    }
  }

  return err
}

export const getMonthsWithYears = (start, end, t) => {
  const startDate = dayjs(start, 'DDMMYYYY', true).isValid()
    ? dayjs(start, 'DDMMYYYY').startOf('month')
    : null

  const endDate = dayjs(end, 'DDMMYYYY', true).isValid()
    ? dayjs(end, 'DDMMYYYY').endOf('month')
    : null

  if (!endDate || !endDate || startDate.isAfter(endDate)) {
    console.error(
      capitalizeFirstLetterOfString(t('srv_start_day_can_not_after_end_day'))
    )
    return []
  }

  const startYear = startDate.year()
  const endYear = endDate.year()

  const startMonth = startDate.month()
  const endMonth = endDate.month()

  const result = []

  for (let year = startYear; year <= endYear; year++) {
    let monthStart = 0
    let monthEnd = 11

    if (year === startYear) {
      monthStart = startMonth
    }
    if (year === endYear) {
      monthEnd = endMonth
    }

    for (let month = monthStart; month <= monthEnd; month++) {
      const monthName = months[month].shortcut
      const formattedMonth = `${capitalizeFirstLetterOfString(
        t(monthName)
      )} (${String(year).slice(2)})`
      result.push(formattedMonth)
    }
  }

  return result
}

export const checkPrivileges = (privilegesKey, role) => {
  return role && PRIVILEGES[privilegesKey] && PRIVILEGES[privilegesKey].includes(role)
}
