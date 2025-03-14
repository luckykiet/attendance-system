// FeedbackMessage.js
import { Typography } from '@mui/material'
import useTranslation from '@/hooks/useTranslation'
import PropTypes from 'prop-types'

const FeedbackMessage = ({ message }) => {
    const { t } = useTranslation()

    return (
        <Typography
            variant="body1"
            textAlign="center"
            color={message instanceof Error ? 'error' : 'success.main'}
        >
            {message instanceof Error
                ? t(message.message)
                : typeof message === 'string' &&
                t(message)}
        </Typography>
    )
}

FeedbackMessage.propTypes = {
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
}

export default FeedbackMessage
