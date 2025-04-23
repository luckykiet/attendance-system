import React from 'react';
import { MainScreenLayout } from '@/layouts/MainScreenLayout';
import {
  StyleSheet,
} from 'react-native';

import ThemedView from '@/components/theme/ThemedView';
import ThemedText from '@/components/theme/ThemedText';
import useTranslation from '@/hooks/useTranslation';
import { InstructionChild } from '@/types/instruction';
import { INSTRUCTION } from '@/constants/Instruction';
import ScrollToBottomWrapper from '@/components/ScrollViewWrapper';

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


const InstructionPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainScreenLayout>
      <ThemedView>
        <ThemedText type="title" style={styles.title}>
          {t('misc_instructions')}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ScrollToBottomWrapper
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {INSTRUCTION.map((section, idx) => (
            <React.Fragment key={idx}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {t(section.title)}
              </ThemedText>
              {renderChildren(section.children)}
            </React.Fragment>
          ))}
        </ScrollToBottomWrapper>
      </ThemedView>
    </MainScreenLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 15,
  },
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

export default InstructionPage;
