import NetInfo from '@react-native-community/netinfo';
import { ArrowRight, Check, ChevronRight, Globe, Heart, Search, Star } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getProducts, type Product } from '../api/products';
import { BottomNav } from '../components/BottomNav';
import { StoreHeader } from '../components/StoreHeader';
import {
  changeLanguage,
  formatRwf,
  supportedLanguages,
  useI18n,
  type SupportedLanguage,
} from '../i18n';
import { useAppDispatch, useAppSelector } from '../store';
import { addItem, updateQuantity } from '../store/cartSlice';
import type { RootStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { cardShadow, colors, spacing } from '../theme';

const heroImage =
  'https://images.unsplash.com/photo-1645940431507-df8608b308f6?auto=format&fit=crop&w=1200&q=85';
const categories = ['All', 'Shoes', 'Bags', 'Tech', 'Fashion'];

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'English (EN)',
  fr: 'Français (FR)',
  rw: 'Ikinyarwanda (RW)',
};

export function HomeScreen(): React.JSX.Element {
  const i18n = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(state => state.auth.user);
  const cartItems = useAppSelector(state => state.cart.items);
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [langModalVisible, setLangModalVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await getProducts({ limit: 8 }));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    NetInfo.fetch()
      .then(state => {
        if (state.isConnected) load().catch(() => undefined);
        else setLoading(false);
      })
      .catch(() => {
        load().catch(() => undefined);
      });
  }, [load]);

  const visible = products.filter(
    product =>
      (category === 'All' || product.category === category) &&
      product.name.toLowerCase().includes(search.toLowerCase()),
  );

  const openProduct = (product: Product) => navigation.navigate('ProductDetails', { product });

  const currentLang = (
    supportedLanguages.includes(i18n.language as SupportedLanguage)
      ? i18n.language
      : 'en'
  ).toUpperCase();

  const selectLanguage = (lang: SupportedLanguage) => {
    changeLanguage(lang).catch(() => undefined);
    setLangModalVisible(false);
  };

  return (
    <View style={styles.screen}>
      <StoreHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome & Interactive Language Switcher */}
        <View style={styles.welcome}>
          <View style={styles.welcomeLeft}>
            <View style={styles.brandRow}>
              <Text style={styles.eyebrow}>D&G eCOMMERCE</Text>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>RWANDA</Text>
              </View>
            </View>
            <Text style={styles.heading}>
              {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Discover curated styles.'}
            </Text>
            <Text style={styles.subheading}>Shop smarter. Order easily.</Text>
          </View>

          <Pressable
            accessibilityLabel="Change language"
            accessibilityRole="button"
            onPress={() => setLangModalVisible(true)}
            style={styles.languagePill}
          >
            <Globe color={colors.goldDark} size={14} />
            <Text style={styles.languageText}>{currentLang}</Text>
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.search}>
          <Search color={colors.muted} size={18} strokeWidth={2} />
          <TextInput
            onChangeText={setSearch}
            placeholder="Search shoes, bags, tech..."
            placeholderTextColor={colors.mutedLight}
            style={styles.searchInput}
            value={search}
          />
        </View>

        {/* Hero Banner */}
        <Pressable
          accessibilityLabel="Explore new season collection"
          onPress={() => navigation.navigate('Products')}
          style={styles.hero}
        >
          <Image source={{ uri: heroImage }} style={styles.heroImage} />
          <View style={styles.heroShade} />
          <View style={styles.heroCopy}>
            <View style={styles.kickerPill}>
              <Text style={styles.heroKicker}>NEW SEASON · 2026</Text>
            </View>
            <Text style={styles.heroTitle}>Made for your everyday.</Text>
            <View style={styles.heroLink}>
              <Text style={styles.heroLinkText}>Explore collection</Text>
              <ArrowRight color={colors.white} size={14} strokeWidth={2.4} />
            </View>
          </View>
        </Pressable>

        {/* Shop by Category */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Shop by category</Text>
          <Pressable
            accessibilityLabel="See all products"
            onPress={() => navigation.navigate('Products')}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight color={colors.goldDark} size={14} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.categoryRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map(item => {
            const isActive = category === item;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={item}
                onPress={() => {
                  setCategory(item);
                  if (item !== 'All') navigation.navigate('Products');
                }}
                style={[styles.category, isActive && styles.categoryActive]}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Featured Today */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured products</Text>
          <Pressable
            accessibilityLabel="See all featured products"
            onPress={() => navigation.navigate('Products')}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ChevronRight color={colors.goldDark} size={14} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.gold} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.productsRow}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {visible.slice(0, 6).map(product => {
              const quantity =
                cartItems.find(item => item.productId === String(product.id))?.quantity ?? 0;
              return (
                <Pressable
                  key={product.id}
                  onPress={() => openProduct(product)}
                  style={[styles.productCard, cardShadow]}
                >
                  <View style={styles.productImageWrap}>
                    <Image source={{ uri: product.image }} style={styles.productImage} />
                    <View style={styles.favoriteBadge}>
                      <Heart color={colors.ink} fill="transparent" size={17} strokeWidth={1.8} />
                    </View>
                    {product.oldPrice ? <Text style={styles.sale}>SALE</Text> : null}
                  </View>

                  <View style={styles.cardDetails}>
                    <Text numberOfLines={1} style={styles.productName}>
                      {product.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.productMeta}>{product.category}</Text>
                      <Text style={styles.metaDot}>·</Text>
                      <Star color={colors.gold} fill={colors.gold} size={11} />
                      <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.price}>{formatRwf(product.price)}</Text>

                    {/* Quantity & Cart Action */}
                    <View style={styles.quantityControls}>
                      <Pressable
                        accessibilityLabel={`Remove one ${product.name}`}
                        accessibilityRole="button"
                        onPress={event => {
                          event.stopPropagation();
                          dispatch(
                            updateQuantity({
                              productId: String(product.id),
                              quantity: quantity - 1,
                            }),
                          );
                        }}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </Pressable>
                      <Text style={styles.quantity}>{quantity}</Text>
                      <Pressable
                        accessibilityLabel={`Add one ${product.name}`}
                        accessibilityRole="button"
                        disabled={quantity >= product.stock}
                        onPress={event => {
                          event.stopPropagation();
                          dispatch(
                            addItem({
                              productId: String(product.id),
                              quantity: 1,
                              name: product.name,
                              price: product.price,
                              image: product.image,
                              stock: product.stock,
                            }),
                          );
                        }}
                        style={[
                          styles.quantityButton,
                          quantity >= product.stock && styles.buttonDisabled,
                        ]}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {!loading && visible.length === 0 ? (
          <Text style={styles.empty}>No products found matching your search.</Text>
        ) : null}

        {/* Delivery Guarantee Banner */}
        <View style={styles.delivery}>
          <View style={styles.deliveryIcon}>
            <Check color={colors.white} size={18} strokeWidth={2.6} />
          </View>
          <View style={styles.deliveryCopy}>
            <Text style={styles.deliveryTitle}>Delivery across Rwanda</Text>
            <Text style={styles.deliveryText}>
              Fast, reliable delivery to Kigali, Musanze, Rubavu and nationwide.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Language Selector Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
        transparent
        visible={langModalVisible}
      >
        <Pressable onPress={() => setLangModalVisible(false)} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Select Language</Text>
            <Text style={styles.modalSubheading}>Hitamo ururimi / Choisissez une langue</Text>
            {supportedLanguages.map(lang => {
              const isSelected = i18n.language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => selectLanguage(lang)}
                  style={[styles.langOption, isSelected && styles.langOptionSelected]}
                >
                  <Text style={[styles.langOptionText, isSelected && styles.langOptionTextSelected]}>
                    {languageLabels[lang]}
                  </Text>
                  {isSelected && <Check color={colors.gold} size={18} strokeWidth={2.4} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <BottomNav active="Home" signedIn={Boolean(user)} />
    </View>
  );
}

const styles = StyleSheet.create({
  brandBadge: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  brandBadgeText: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cardDetails: {
    padding: 10,
  },
  category: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryActive: {
    backgroundColor: colors.ink,
    borderColor: colors.gold,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: colors.white,
  },
  content: {
    paddingBottom: 110,
    paddingHorizontal: spacing.page,
    paddingTop: 18,
  },
  delivery: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
    padding: 16,
  },
  deliveryCopy: {
    flex: 1,
  },
  deliveryIcon: {
    alignItems: 'center',
    backgroundColor: colors.green,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  deliveryText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  deliveryTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  empty: {
    color: colors.muted,
    paddingVertical: 24,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  favoriteBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
  },
  heading: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  hero: {
    borderRadius: spacing.radius,
    height: 200,
    marginTop: 18,
    overflow: 'hidden',
  },
  heroCopy: {
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 20,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroKicker: {
    color: colors.goldBright,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroLink: {
    alignItems: 'center',
    borderBottomColor: colors.goldBright,
    borderBottomWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    paddingBottom: 3,
    width: 140,
  },
  heroLinkText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroShade: {
    backgroundColor: 'rgba(18, 20, 16, 0.68)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 8,
  },
  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(197, 155, 39, 0.25)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  langOption: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: spacing.radiusSm,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  langOptionSelected: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold,
  },
  langOptionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  langOptionTextSelected: {
    color: colors.goldDark,
  },
  languagePill: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  languageText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  loading: {
    alignItems: 'center',
    height: 160,
    justifyContent: 'center',
  },
  metaDot: {
    color: colors.mutedLight,
    fontSize: 10,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    padding: spacing.page,
    width: '85%',
  },
  modalHeading: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.page,
  },
  modalSubheading: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 16,
    marginTop: 3,
    textAlign: 'center',
  },
  price: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  productCard: {
    backgroundColor: colors.card,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    overflow: 'hidden',
    width: 156,
  },
  productImage: {
    height: 160,
    width: '100%',
  },
  productImageWrap: {
    backgroundColor: colors.cream,
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  productMeta: {
    color: colors.muted,
    fontSize: 10,
  },
  productName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  productsRow: {
    gap: 12,
    paddingVertical: 4,
  },
  quantity: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    minWidth: 20,
    textAlign: 'center',
  },
  quantityButton: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  quantityButtonText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  quantityControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  ratingText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '700',
  },
  sale: {
    backgroundColor: colors.ink,
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    top: 8,
  },
  screen: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  search: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: spacing.radius,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    marginTop: 16,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  seeAllText: {
    color: colors.goldDark,
    fontSize: 12,
    fontWeight: '700',
  },
  subheading: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  welcome: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  welcomeLeft: {
    flex: 1,
    paddingRight: 10,
  },
});
