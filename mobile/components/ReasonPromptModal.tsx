import React, { useEffect } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import ThemedText from './theme/ThemedText';
import { Colors } from '@/constants/Colors';
import ThemedView from './theme/ThemedView';
import ThemedTextInput from './theme/ThemedTextInput';
import useTranslation from '@/hooks/useTranslation';
import { getDiffDurationText } from '@/utils';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import _ from 'lodash';

const FormSchema = z.object({
    reason: z.string().trim().min(1, 'misc_required'),
});

export type ReasonData = z.infer<typeof FormSchema>;

type Props = {
    title?: string;
    diff?: number;
    reason?: string;
    visible: boolean;
    onCancel: () => void;
    onConfirm: null | ((data: ReasonData) => void);
};

const ReasonPromptModal: React.FC<Props> = ({ title = 'misc_reason_for_early_check_out', diff = 0, visible, reason = '', onCancel, onConfirm }) => {
    const { t } = useTranslation();
    const { t: noCap } = useTranslation({ capitalize: false });
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const durationText = getDiffDurationText(diff, noCap);

    const { control, handleSubmit, reset } = useForm<ReasonData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            reason: '',
        },
    });

    const onSubmit = async (data: ReasonData) => {
        if (onConfirm) {
            onConfirm(data);
        }
    };

    const containerStyle = [
        styles.container,
        { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' },
    ];

    useEffect(() => {
        if (visible) {
            reset({ reason: reason ? reason : '' });
        }
    }, [visible, reason, reset]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <ThemedView style={styles.overlay}>
                <View style={containerStyle}>
                    <ThemedText style={styles.title}>{t(title)}</ThemedText>
                    {_.isNumber(diff) && diff > 0 && <ThemedText style={styles.subtitle}>
                        {t('misc_until_the_end')}: {durationText}
                    </ThemedText>}
                    <Controller
                        control={control}
                        name="reason"
                        render={({ field: { onChange, onBlur, value }, fieldState }) => (
                            <ThemedTextInput
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
                                multiline
                                numberOfLines={4}
                                error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
                                containerStyle={styles.inputContainer}
                                label={t('misc_reason')}
                            />
                        )}
                    />
                    <View style={styles.actions}>
                        <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
                            <ThemedText style={styles.buttonText}>{t('misc_cancel')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirm]}
                            onPress={handleSubmit(onSubmit)}
                        >
                            <ThemedText style={styles.buttonText}>{t('misc_submit')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    container: {
        borderRadius: 10,
        padding: 20,
        width: '85%',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 10,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    label: {
        fontSize: 16,
        marginBottom: 4,
    },
    inputError: {
        borderColor: 'red',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 15,
    },
    button: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginLeft: 10,
    },
    cancel: {
        backgroundColor: Colors.error,
    },
    confirm: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginTop: 4,
    },
});

export default ReasonPromptModal;
