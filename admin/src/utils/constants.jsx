import { ROLES, SPECIFIC_BREAKS } from "@/configs";

export const getDaysOfWeek = (startWithMonday = false) => {
  return startWithMonday ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
}

export const DAYS_OF_WEEK = getDaysOfWeek();

export const getDefaultRetail = () => ({
  name: '',
  tin: '',
  vin: '',
  address: getDefaultAddress(),
});

export const getDefaultAddress = () => ({
  street: '',
  city: '',
  zip: '',
});

export const getDefaultLocation = () => ({
  latitude: 0,
  longitude: 0,
  allowedRadius: 100,
});

export const getDefaultWorkingHour = () => ({
  start: '08:00',
  end: '17:00',
  isOverNight: false,
  isAvailable: true,
});

export const generateDefaultSpecificBreak = () => {
  return {
    start: '11:00',
    end: '13:00',
    duration: 60,
    isOverNight: false,
    isAvailable: false,
  }
}

export const generateDefaultBreak = () => {
  return {
    name: 'Break',
    start: '11:00',
    end: '13:00',
    duration: 60,
    isOverNight: false,
  }
}

export const getDefaultRegister = () => ({
  retailId: '',
  name: '',
  address: getDefaultAddress(),
  location: getDefaultLocation(),
  workingHours: getDaysOfWeek(true).reduce((acc, day) => {
    acc[day] = getDefaultWorkingHour();
    return acc;
  }, {}),
  specificBreaks: getDaysOfWeek(true).reduce((acc, day) => {
    acc[day] = SPECIFIC_BREAKS.reduce((accBrk, brk) => {
      accBrk[brk] = generateDefaultSpecificBreak();
      return accBrk;
    }, {});
    return acc;
  }, {}),
  breaks: getDaysOfWeek(true).reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {}),
  maxLocalDevices: 0,
  isAvailable: true,
});

export const getDefaultEmployee = () => ({
  name: '',
  email: '',
  phone: '',
  position: '',
  deviceId: '',
  registrationToken: '',
  isAvailable: true,
});

export const getDefaultUser = () => ({
  name: '',
  username: '',
  email: '',
  phone: '',
  role: ROLES[0],
  notes: '',
  password: '',
  confirmPassword: '',
  isAvailable: true,
});

export const getDefaultWorkingAt = () => ({
  registerId: '',
  position: '',
  shifts: getDaysOfWeek(true).reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {}),
});

export const getDefaultShift = () => ({
  start: '08:00',
  end: '17:00',
  isOverNight: false,
  isAvailable: true,
  allowedOverTime: 0,
});

export const getDefaultAttendance = () => ({
  _id: '',
  employeeId: '',
  registerId: '',
  dailyAttendanceId: '',
  checkInLocation: { latitude: '', longitude: '', distance: '' },
  checkInTime: '',
  checkOutTime: '',
  checkOutLocation: { latitude: '', longitude: '', distance: '' },
})


export const BOOLEAN_SELECT_OPTIONS = ['all', 'true', 'false'];

export const daysOfWeeksTranslations = {
  [DAYS_OF_WEEK[0]]: {
    shortcut: 'day_sunday_shortcut',
    name: 'day_sunday_name',
  },
  [DAYS_OF_WEEK[1]]: {
    shortcut: 'day_monday_shortcut',
    name: 'day_monday_name',
  },
  [DAYS_OF_WEEK[2]]: {
    shortcut: 'day_tuesday_shortcut',
    name: 'day_tuesday_name',
  },
  [DAYS_OF_WEEK[3]]: {
    shortcut: 'day_wednesday_shortcut',
    name: 'day_wednesday_name',
  },
  [DAYS_OF_WEEK[4]]: {
    shortcut: 'day_thursday_shortcut',
    name: 'day_thursday_name',
  },
  [DAYS_OF_WEEK[5]]: {
    shortcut: 'day_friday_shortcut',
    name: 'day_friday_name',
  },
  [DAYS_OF_WEEK[6]]: {
    shortcut: 'day_saturday_shortcut',
    name: 'day_saturday_name',
  },
}

export const REGEX = {
  phone: /^(\+\d{1,4})?\s?[1-9][0-9]{2}\s?[0-9]{3}\s?[0-9]{3}$/,
  username: /^[a-z0-9]+$/,
}

export const TIME_FORMAT = 'HH:mm';