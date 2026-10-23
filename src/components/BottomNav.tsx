import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Home, Package, ShoppingBag, UserRound } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Tab = 'Home' | 'Products' | 'Orders' | 'Profile';
type Props = { active: Tab; signedIn: boolean };

export function BottomNav({ active, signedIn }: Props): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const tabs: Array<{ name: Tab; label: string; Icon: typeof Home }> = [
    { name: 'Home', label: 'Home', Icon: Home },
    { name: 'Products', label: 'Shop', Icon: ShoppingBag },
    { name: 'Orders', label: 'Orders', Icon: Package },
    { name: 'Profile', label: 'Account', Icon: UserRound },
  ];

  const handlePress = (tabName: Tab) => {
    if (!signedIn && (tabName === 'Orders' || tabName === 'Profile')) {
      navigation.navigate('Login');
    } else {
      navigation.navigate(tabName);
    }
  };

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 10),
        },
      ]}
    >
      {tabs.map(tab => {
        const selected = active === tab.name;
        const Icon = tab.Icon;
        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.name}
            onPress={() => handlePress(tab.name)}
            style={styles.item}
          >
            <View style={styles.iconContainer}>
              <Icon
                color={selected ? colors.ink : colors.muted}
                size={22}
                strokeWidth={selected ? 2.4 : 1.8}
              />
              {selected && <View style={styles.activeDot} />}
            </View>
            <Text style={[styles.label, selected && styles.active]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    color: colors.ink,
    fontWeight: '800',
  },
  activeDot: {
    backgroundColor: colors.gold,
    borderRadius: 2,
    bottom: -5,
    height: 4,
    position: 'absolute',
    width: 14,
  },
  bar: {
    backgroundColor: colors.paper,
    borderTopColor: colors.lineLight,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
  },
  iconContainer: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    position: 'relative',
  },
  item: {
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 64,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
