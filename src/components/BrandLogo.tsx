import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

const logoSource = require('../assets/logo.png');

type Props = {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
};

export function BrandLogo({ size = 'md', showTagline = false }: Props): React.JSX.Element {
  const dimensions = {
    sm: { width: 104, height: 42 },
    md: { width: 138, height: 55 },
    lg: { width: 220, height: 88 },
  }[size];

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
        style={[styles.logoImage, { width: dimensions.width, height: dimensions.height }]}
        resizeMode="contain"
        accessibilityLabel="D&G eCommerce - Shop Smarter. Order Easily."
      />
      {showTagline && (
        <View style={styles.taglineRow}>
          <View style={styles.taglineRule} />
          <Text style={styles.taglineText}>SHOP SMARTER · ORDER EASILY</Text>
          <View style={styles.taglineRule} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    maxWidth: '100%',
  },
  taglineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  taglineRule: {
    backgroundColor: colors.goldMuted,
    flex: 1,
    height: 1,
  },
  taglineText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
