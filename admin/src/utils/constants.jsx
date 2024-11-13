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
  isAvailable: true,
});

export const getDefaultRegister = () => ({
  retailId: '',
  name: '',
  address: getDefaultAddress(),
  location: getDefaultLocation(),
  workingHours: {
    mon: getDefaultWorkingHour(),
    tue: getDefaultWorkingHour(),
    wed: getDefaultWorkingHour(),
    thu: getDefaultWorkingHour(),
    fri: getDefaultWorkingHour(),
    sat: getDefaultWorkingHour(),
    sun: getDefaultWorkingHour(),
  },
  isAvailable: true,
});

export const getDefaultEmployee = () => ({
  name: '',
  email: '',
  phone: '',
  position: '',
  deviceId: '',
  isAvailable: true,
});

export const getDefaultWorkingAt = () => ({
  registerId: '',
  position: '',
  workingHours: {
    mon: getDefaultWorkingHour(),
    tue: getDefaultWorkingHour(),
    wed: getDefaultWorkingHour(),
    thu: getDefaultWorkingHour(),
    fri: getDefaultWorkingHour(),
    sat: getDefaultWorkingHour(),
    sun: getDefaultWorkingHour(),
  },
});


export const BOOLEAN_SELECT_OPTIONS = ['all', 'true', 'false'];

export const DAYS_OF_WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const daysOfWeeksTranslations = {
  sun: {
    shortcut: 'day_sunday_shortcut',
    name: 'day_sunday_name',
  },
  mon: {
    shortcut: 'day_monday_shortcut',
    name: 'day_monday_name',
  },
  tue: {
    shortcut: 'day_tuesday_shortcut',
    name: 'day_tuesday_name',
  },
  wed: {
    shortcut: 'day_wednesday_shortcut',
    name: 'day_wednesday_name',
  },
  thu: {
    shortcut: 'day_thursday_shortcut',
    name: 'day_thursday_name',
  },
  fri: {
    shortcut: 'day_friday_shortcut',
    name: 'day_friday_name',
  },
  sat: {
    shortcut: 'day_saturday_shortcut',
    name: 'day_saturday_name',
  },
}

export const REGEX = {
  phone: /^(\+420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/
}

export const TIME_FORMAT = 'HH:mm';