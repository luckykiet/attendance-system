import {
    Container,
    IconButton,
    Stack,
    Typography,
    useTheme,
} from '@mui/material'

import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner'
import { QrReader } from 'react-qr-reader'
import ScanOverlay from '@/components/ScanOverlay'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

export default function HomePage() {
    const { t } = useTranslation()
    const [isActiveScanner, setIsActiveScanner] = useState(false)
    const theme = useTheme()

    const onScannerRead = (result, error) => {
        if (result) {
            // setQrCode(result.text);
            window.location.replace(result.text)
        }
        if (error) {
            console.error(error)
        }
    }

    return (
        <Container maxWidth={'lg'} sx={{ mb: 4, pt: { xs: 6, sm: 10 } }}>
            <Stack spacing={3} sx={{ width: '100%' }}>
                <Stack
                    spacing={3}
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        {t('msg_scan_qr')}
                    </Typography>

                    <IconButton
                        size="large"
                        onClick={() => setIsActiveScanner((prev) => !prev)}
                    >
                        <QrCodeScannerIcon
                            color="primary"
                            sx={{ minHeight: '200px', minWidth: '200px' }}
                        />
                    </IconButton>

                    {isActiveScanner && (
                        <QrReader
                            onResult={onScannerRead}
                            scanDelay={500}
                            ViewFinder={() => {
                                return <ScanOverlay />
                            }}
                            containerStyle={{ width: 300, height: 300 }}
                            videoStyle={{
                                width: '100%',
                                height: '100%',
                                border: 'solid',
                                borderWidth: '4px',
                                borderColor: theme.palette.primary.main,
                                borderRadius: '16px',
                                textAlign: 'center',
                            }}
                            constraints={{
                                facingMode: 'environment',
                                aspectRatio: { ideal: 1 },
                            }}
                        />
                    )}
                </Stack>
            </Stack>
        </Container>
    )
}
