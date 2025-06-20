import { PRIVILEGES } from '@/configs'
import _ from 'lodash'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

import { TIME_FORMAT } from './constants'
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export const isExpired = (startTime, timeRangeInMinutes) => {
  const now = dayjs()
  const duration = dayjs.duration(now.diff(dayjs(startTime)))
  const minutes = duration.asMinutes()
  return minutes > timeRangeInMinutes
}

export const renderIcon = (icon) => {
  const IconComponent = icon
  return <IconComponent />
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

export const mergeObjects = (obj1, obj2) => {
  return _.merge(obj1, obj2)
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

export const checkPrivileges = (privilegesKey, role) => {
  return role && PRIVILEGES[privilegesKey] && PRIVILEGES[privilegesKey].includes(role)
}

export const timeStartEndValidation = (start, end) => dayjs(end, TIME_FORMAT).isAfter(dayjs(start, TIME_FORMAT));

export const calculateKilometersFromMeters = (pureMeters) => {
  const absMeters = Math.abs(pureMeters);
  const kilometers = Math.floor(absMeters / 1000);
  const meters = absMeters % 1000;
  return { kilometers, meters };
};

export const calculateHoursFromMinutes = (diffInMinutes) => {
  const absMin = Math.abs(diffInMinutes);
  const hours = Math.floor(absMin / 60);
  const minutes = absMin % 60;
  return { hours, minutes };
};

export const calculateHoursAndMinutesFromHours = (hours) => {
  const absHours = Math.abs(hours);
  const wholeHours = Math.floor(absHours);
  const minutes = Math.round((absHours - wholeHours) * 60);
  return { hours: wholeHours, minutes };
};

export const minutesToHour = (minutes) => minutes / 60;
export const hourToMinutes = (hours) => hours * 60;

export const createZustandSetters = (set, state) => {
  return Object.keys(state).reduce((acc, key) => {
    acc[`set${key.charAt(0).toUpperCase() + key.slice(1)}`] = (value) =>
      set((s) => ({ ...s, [key]: value }))
    return acc
  }, {})
}

export const clearAllQueries = (queryClient) => {
  queryClient.getQueryCache().getAll().forEach((query) => {
    if (query.queryKey[0] !== 'config') {
      queryClient.removeQueries(query.queryKey)
    }
  })
}

export const validateBreaksWithinWorkingHours = (brk, workingHours, timeFormat = TIME_FORMAT) => {
  const isInsideWorkingHours = isBreakWithinShift({
    breakStart: brk.start,
    breakEnd: brk.end,
    shiftStart: workingHours.start,
    shiftEnd: workingHours.end,
    timeFormat,
  });

  return {
    isStartValid: isInsideWorkingHours,
    isEndValid: isInsideWorkingHours,
  };
};

export const getDurationLabel = ({ start, end, timeFormat = TIME_FORMAT, t }) => {
  const startTime = dayjs.isDayjs(start) ? start : dayjs(start, timeFormat);
  const endTime = dayjs.isDayjs(end) ? end : dayjs(end, timeFormat);

  if (startTime.isValid() && endTime.isValid()) {
    const diff =
      startTime.isAfter(endTime)
        ? endTime.add(1, 'day').diff(startTime, 'minutes')
        : endTime.diff(startTime, 'minutes');
    return getDiffDurationText(diff, t);
  }

  return '-';
}

export const getWorkingHoursText = ({
  workingHour,
  isToday,
  t,
}) => {
  const now = dayjs();

  const workingHourTime = getStartEndTime({ start: workingHour.start, end: workingHour.end, isToday });

  if (!workingHourTime) {
    return null
  }

  const { startTime: openTime, endTime: closeTime, isOverNight } = workingHourTime;

  const warningTime = openTime.subtract(1, 'hour');

  const inBeforeOneHourTime = now.isBefore(openTime) && now.isAfter(warningTime);
  const inShiftTime = now.isBetween(openTime, closeTime);

  const timeText = `${openTime.format(TIME_FORMAT)} - ${closeTime.format(TIME_FORMAT)}${isOverNight ? ` (${t('misc_over_night')})` : ''}`;

  return {
    message: timeText,
    status: inShiftTime ? 'open' : inBeforeOneHourTime ? 'warning' : 'out_of_time',
    isToday,
  };
};

export const isBreakWithinShift = ({
  breakStart,
  breakEnd,
  shiftStart,
  shiftEnd,
  timeFormat = TIME_FORMAT,
}) => {
  const baseDay = dayjs();

  const shiftTime = getStartEndTime({
    start: shiftStart,
    end: shiftEnd,
    timeFormat,
    baseDay,
  });

  if (!shiftTime) return false;

  const { startTime: sStart, endTime: sEnd, isOverNight: shiftIsOvernight } = shiftTime;

  const breakTime = getStartEndTime({
    start: breakStart,
    end: breakEnd,
    timeFormat,
    baseDay,
  });

  if (!breakTime) return false;

  let { startTime: bStart, endTime: bEnd } = breakTime;

  if (shiftIsOvernight && bEnd.isBefore(sStart)) {
    bStart = bStart.add(1, 'day');
    bEnd = bEnd.add(1, 'day');
  }

  return bStart.isBefore(sEnd) && bEnd.isAfter(sStart);
};

export const getStartEndTime = ({ start, end, baseDay = dayjs(), timeFormat = TIME_FORMAT, isToday = true }) => {
  const base = isToday ? dayjs(baseDay) : dayjs(baseDay).subtract(1, 'day');

  const startParsed = dayjs(start, timeFormat, true);
  const endParsed = dayjs(end, timeFormat, true);

  if (!startParsed.isValid() || !endParsed.isValid() || startParsed.isSame(endParsed)) {
    return null;
  }

  const startTime = base
    .hour(startParsed.hour())
    .minute(startParsed.minute())
    .second(0)
    .millisecond(0);

  let endTime = base
    .hour(endParsed.hour())
    .minute(endParsed.minute())
    .second(0)
    .millisecond(0);

  let isOverNight = false;
  if (endTime.isBefore(startTime)) {
    isOverNight = true;
    endTime = endTime.add(1, 'day');
  }

  return { startTime, endTime, isOverNight };
}

export const isOverNight = ({ start, end, timeFormat = TIME_FORMAT }) => {
  if (!start || !end) return false;
  const startTime = dayjs(start, timeFormat, true);
  const endTime = dayjs(end, timeFormat, true);
  if (!startTime.isValid() || !endTime.isValid()) return false;
  return endTime.isBefore(startTime);
}

export const getDiffDurationText = (diffInMinutes, t) => {
  if (diffInMinutes < 1) {
    return `>1 ${t('misc_min_short')}`;
  }

  const { hours, minutes } = calculateHoursFromMinutes(diffInMinutes);
  return `${hours > 0 ? `${hours} ${t('misc_hour_short')}` : ''}${minutes > 0 ? ` ${minutes} ${t('misc_min_short')}` : ''}`.trim();
};