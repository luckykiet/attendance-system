import React, { useEffect } from "react";
import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { LOCALES } from "@/locales";

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    useEffect(() => {
        const loadLanguage = async () => {
            const savedLanguage = await AsyncStorage.getItem("language");
            if (savedLanguage) {
                i18n.changeLanguage(savedLanguage);
            }
        };
        loadLanguage();
    }, [i18n]);

    const changeLanguage = async (lang: string) => {
        await AsyncStorage.setItem("language", lang);
        i18n.changeLanguage(lang);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flagsContainer}
            >
                {LOCALES.map((locale) => {
                    const Flag = locale.icon;
                    return <TouchableOpacity
                        key={locale.key}
                        onPress={() => changeLanguage(locale.key)}
                        style={[
                            styles.flag,
                            currentLanguage === locale.key && styles.activeFlag,
                            currentLanguage !== locale.key && styles.inactiveFlag,
                        ]}
                    >
                        <Flag width={45} height={45} />
                    </TouchableOpacity>
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
    },
    flagsContainer: {
        flexDirection: "row",
        paddingVertical: 10,
    },
    flag: {
        paddingHorizontal: 10,
    },
    activeFlag: {
        transform: [{ scale: 1.2 }],
    },
    inactiveFlag: {
        opacity: 0.5,
    },
    text: {
        fontSize: 22,
        lineHeight: 32,
        marginTop: -6,
    },
});