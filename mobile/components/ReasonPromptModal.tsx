import React, { useEffect, useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';

const selectionOptions = [
    { value: 'doctor', name: 'misc_visit_doctor' },
    { value: 'pickup_delivery', name: 'misc_pick_up_delivery_package' },
    { value: 'other', name: 'misc_other' },
];

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

    const { control, handleSubmit, reset, setValue } = useForm<ReasonData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            reason: '',
        },
    });

    const [selectedOption, setSelectedOption] = useState('other');

    const onSubmit = async (data: ReasonData) => {
        if (onConfirm) {
            const selectedItem = selectionOptions.find(opt => opt.value === selectedOption);
            const reasonFinal = selectedOption !== 'other' && selectedItem ? selectedItem.name : data.reason;
            onConfirm({ reason: reasonFinal });
        }
    };

    const containerStyle = [
        styles.container,
        { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' },
    ];

    useEffect(() => {
        if (visible) {
            reset({ reason: reason ? reason : '' });
            setSelectedOption('other');
        }
    }, [visible, reason, reset]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <ThemedView style={styles.overlay}>
                <View style={containerStyle}>
                    <ThemedText style={styles.title}>{t(title)}</ThemedText>
                    {_.isNumber(diff) && diff > 0 && (
                        <ThemedText style={styles.subtitle}>
                            {t('misc_until_the_end')}: {durationText}
                        </ThemedText>
                    )}

                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedOption}
                            onValueChange={(itemValue) => {
                                setSelectedOption(itemValue);
                                if (itemValue !== 'other') {
                                    setValue('reason', t(selectionOptions.find(opt => opt.value === itemValue)?.name || ''));
                                } else {
                                    setValue('reason', '');
                                }
                            }}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                        >
                            {selectionOptions.map(option => (
                                <Picker.Item key={option.value} label={t(option.name)} value={option.value} />
                            ))}
                        </Picker>
                    </View>

                    {selectedOption === 'other' && (
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
                    )}

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
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 16,
        overflow: 'hidden',
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
});

export default ReasonPromptModal;
