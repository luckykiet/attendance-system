
import { FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ThemedTextInput from '@/components/theme/ThemedTextInput';
import ThemedView from '@/components/theme/ThemedView';
import { useAppStore } from '@/stores/useAppStore';
import useTranslation from '@/hooks/useTranslation';
import ThemedText from './theme/ThemedText';

const schema = z.object({
    url: z.string().regex(
        /^(https?:\/\/)(?:\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$r|^(https?:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d{1,5})?(\/[^\\/]*)?$/,
        { message: 'srv_invalid_url' }
    ),
});

type FormData = z.infer<typeof schema>;

const URLSelection: React.FC = () => {
    const { t } = useTranslation();
    const { urls, addUrl, deleteUrl } = useAppStore();
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const handleAddUrl = async (url: string) => {
        await addUrl(url);
        setValue('url', '');
    };

    const handleDeleteUrl = async (url: string) => {
        Alert.alert(
            t('misc_confirm_delete'),
            t('misc_you_will_not_see_workplace_until_add_again'),
            [
                { text: t('misc_cancel'), style: 'cancel' },
                {
                    text: t('misc_confirm'),
                    onPress: async () => {
                        await deleteUrl(url);
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const onSubmit: SubmitHandler<FormData> = (data) => {
        let formattedUrl = data.url.toLowerCase().trim();
        formattedUrl = formattedUrl.endsWith('/') ? formattedUrl.slice(0, -1) : formattedUrl;
        if (urls.includes(formattedUrl)) {
            Alert.alert(t('srv_url_exists'), `${t('misc_url_already_added')}.`);
        } else {
            handleAddUrl(formattedUrl);
        }
    };

    const renderItem = ({ item }: { item: string }) => (
        <ThemedView style={styles.itemContainer}>
            <TouchableOpacity style={styles.item} onPress={() => setValue('url', item)}>
                <ThemedText style={styles.itemText}>{item}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteUrl(item)}>
                <ThemedText style={styles.deleteButtonText}>{t('misc_delete')}</ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );

    return (
        <ThemedView style={styles.container}>
            <Controller
                control={control}
                name="url"
                render={({ field: { onChange, onBlur, value } }) => (
                    <ThemedTextInput
                        style={[styles.input, errors.url ? styles.inputError : null]}
                        placeholder="https://example.com; http://192.168.0.14:8080"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="none"
                        lightColor="#fff"
                        darkColor="#444"
                    />
                )}
            />
            {errors.url?.message && <Text style={styles.error}>{t(errors.url.message)}</Text>}
            <TouchableOpacity style={styles.button} onPress={handleSubmit(onSubmit)}>
                <Text style={styles.buttonText}>{t('misc_add_url')}</Text>
            </TouchableOpacity>

            {urls.length > 0 && (
                <FlatList
                    data={urls}
                    keyExtractor={(item) => item}
                    renderItem={renderItem}
                    style={styles.list}
                />
            )}
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        borderColor: '#ccc',
        marginBottom: 10,
    },
    inputError: {
        borderColor: '#e63946',
    },
    list: {
        marginTop: 20,
        minHeight: 70,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 5,
        marginVertical: 5,
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    item: {
        flex: 1,
    },
    itemText: {
        fontSize: 16,
    },
    error: {
        color: '#e63946',
        fontSize: 14,
        marginBottom: 10,
        paddingLeft: 5,
    },
    button: {
        backgroundColor: '#457b9d',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#e63946',
        borderRadius: 5,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginLeft: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default URLSelection;
