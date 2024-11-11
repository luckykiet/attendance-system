import Slide from '@mui/material/Slide'
import { forwardRef } from 'react'

const SlideTransition = forwardRef((props, ref) => {
  return <Slide direction="up" ref={ref} {...props} />
})

SlideTransition.displayName = 'SlideTransition'

export default SlideTransition
