import useTranslation from '@/hooks/useTranslation';
import PropTypes from 'prop-types';
import ThemedText from '@/components/theme/ThemedText';
import { StyleSheet } from 'react-native';

const FeedbackMessage = ({ message }: { message: string | Error }) => {
    const { t } = useTranslation();

    return (
        <ThemedText
            style={[
                styles.text,
                message instanceof Error ? styles.errorText : styles.defaultText,
            ]}
        >
            {message instanceof Error
                ? t(message.message)
                : typeof message === 'string' && t(message)}
        </ThemedText>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
    defaultText: {
        color: 'green',
    },
});

FeedbackMessage.propTypes = {
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Error)]),
};

export default FeedbackMessage;
