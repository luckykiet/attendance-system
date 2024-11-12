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

export const getDefaultOpeningHour = () => ({
  open: '08:00',
  close: '17:00',
  isOpen: true,
});

export const getDefaultRegister = () => ({
  retailId: '',
  name: '',
  address: getDefaultAddress(),
  location: getDefaultLocation(),
  openingHours: {
    mon: getDefaultOpeningHour(),
    tue: getDefaultOpeningHour(),
    wed: getDefaultOpeningHour(),
    thu: getDefaultOpeningHour(),
    fri: getDefaultOpeningHour(),
    sat: getDefaultOpeningHour(),
    sun: getDefaultOpeningHour(),
  },
  isAvailable: true,
});

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

export const TIME_FORMAT = 'HH:mm';