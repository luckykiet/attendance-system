import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import ThemedText from '@/components/theme/ThemedText';
import ThemedView from '@/components/theme/ThemedView';
import useTranslation from '@/hooks/useTranslation';
import { INSTRUCTION } from '@/constants/Instruction';
import { InstructionChild } from '@/types/instruction';

const renderChildren = (children: InstructionChild[], level: number = 1) => {
    const { t } = useTranslation();
    return children.map((child, index) => {
        const isObject = typeof child === 'object' && child !== null;

        const bullet = level === 1 ? `${index + 1}. ` : '— ';
        const key = `${level}-${index}`;

        return (
            <React.Fragment key={key}>
                <ThemedText style={[styles.instructionText, { marginLeft: level * 10 }]}>
                    {bullet}{t(isObject ? child.text : child)}
                </ThemedText>
                {isObject && child.children && renderChildren(child.children, level + 1)}
            </React.Fragment>
        );
    });
};


const InitialInstruction: React.FC = () => {
    const { t } = useTranslation();

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                    {t(INSTRUCTION[0].title)}
                </ThemedText>
                {renderChildren(INSTRUCTION[0].children)}
            </ScrollView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 40,
        gap: 15,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 10,
    },
    instructionText: {
        fontSize: 16,
        lineHeight: 24,
    },
});

export default InitialInstruction;
