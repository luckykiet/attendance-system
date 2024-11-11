import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import packageJson from '../../package.json'

export default function BottomBar() {
  return (
    <Box component="footer" sx={{ pt: 5, pb: 5 }}>
      <Typography variant="body2" align="center">
        {new Date().getFullYear()}&nbsp;©&nbsp;{packageJson.app.provider}&nbsp;
      </Typography>
    </Box>
  )
}
