import { Pressable, StyleSheet, Text, View } from 'react-native';
import { changeLanguage, supportedLanguages, useI18n, type SupportedLanguage } from '../i18n';

const languageKeys: Record<SupportedLanguage, string> = {
  en: 'languageEnglish',
  fr: 'languageFrench',
  rw: 'languageKinyarwanda',
};

export function LanguageSwitcher(): React.JSX.Element {
  const i18n = useI18n();
  return (
    <View accessibilityRole="radiogroup" style={styles.container}>
      {supportedLanguages.map(language => (
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: i18n.language === language }}
          key={language}
          onPress={() => { changeLanguage(language).catch(() => undefined); }}
          style={[styles.option, i18n.language === language && styles.selected]}
        >
          <Text style={styles.label}>{i18n.t(languageKeys[language])}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, marginTop: 24 },
  label: { fontSize: 12 },
  option: { borderColor: '#D0D5DD', borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  selected: { backgroundColor: '#E8F1FF', borderColor: '#145DA0' },
});
