import { Typography } from '@mui/material'
import useTranslation from '@/hooks/useTranslation'
import PropTypes from 'prop-types'

const FeedbackMessage = ({ message }) => {
    const { t } = useTranslation()

    const parseMessage = (input) => {
        if (!input) return null

        try {
            const parsed = JSON.parse(input)
            if (typeof parsed === 'string') {
                return t(parsed)
            }
            const parsedArray = Array.isArray(parsed) ? parsed : Array.isArray(parsed.errors) ? parsed.errors : null;
            if (parsedArray) {
                return parsedArray
                    .map(obj => {
                        const key = Object.keys(obj)[0]
                        const value = obj[key]
                        return `${t(key)} → ${t(value)}`
                    })
                    .join(', ')
            }
        } catch {
            // Not a JSON string, fallback
        }

        return t(input)
    }

    let content = null
    let color = 'success.main'

    if (message instanceof Error) {
        content = parseMessage(message.message)
        color = 'error'
    } else if (typeof message === 'string') {
        content = parseMessage(message)
    }

    return (
        <Typography
            variant="body1"
            textAlign="center"
            color={color}
        >
            {content}
        </Typography>
    )
}

FeedbackMessage.propTypes = {
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(Error),
    ]),
}

export default FeedbackMessage
