import { createComponents } from '@/theme/create-components'
import { createTheme as createMuiTheme } from '@mui/material'
import { createPalette } from '@/theme/create-palette'
import { createShadows } from '@/theme/create-shadows'
import { createTypography } from '@/theme/create-typography'

export function createTheme() {
  const palette = createPalette()
  const components = createComponents({ palette })
  const shadows = createShadows()
  const typography = createTypography()

  return createMuiTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1440,
      },
    },
    components,
    palette,
    shadows,
    shape: {
      borderRadius: 8,
    },
    typography,
  })
}
