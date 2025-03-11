import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';

export const SPECIFIC_BREAKS = ['breakfast', 'lunch', 'dinner']
export const useSpecificBreaks = () => {

  return [
    {
      key: SPECIFIC_BREAKS[0],
      name: 'misc_breakfast',
      icon: BreakfastDiningIcon,
    },
    {
      key: SPECIFIC_BREAKS[1],
      name: 'misc_lunch',
      icon: LunchDiningIcon,
    },
    {
      key: SPECIFIC_BREAKS[2],
      name: 'misc_dinner',
      icon: DinnerDiningIcon,
    },
  ]
}

export const useSpecificBreaksObject = () => {
  const brk = useSpecificBreaks()
  return brk.reduce((acc, s) => {
    acc[s.key] = { ...s }
    return acc
  }, {})
}
