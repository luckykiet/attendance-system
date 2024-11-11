// FeedbackMessage.js
import { Typography } from '@mui/material'
import { capitalizeFirstLetterOfString } from '@/utils'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'

const FeedbackMessage = ({ message }) => {
    const { t } = useTranslation()

    return (
        <Typography
            variant="body2"
            textAlign="center"
            color={message instanceof Error ? 'error' : 'success.main'}
            sx={{ mt: 2 }}
        >
            {message instanceof Error
                ? capitalizeFirstLetterOfString(t(message.message))
                : typeof message === 'string' &&
                capitalizeFirstLetterOfString(t(message))}
        </Typography>
    )
}

FeedbackMessage.propTypes = {
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
}

export default FeedbackMessage
