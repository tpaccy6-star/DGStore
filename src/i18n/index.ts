import i18n from 'i18next';
import { useEffect, useState } from 'react';
import * as Keychain from 'react-native-keychain';

export const supportedLanguages = ['en', 'fr', 'rw'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
const LANGUAGE_SERVICE = 'com.dgstore.language';
const localeByLanguage: Record<SupportedLanguage, string> = { en: 'en-RW', fr: 'fr-RW', rw: 'rw-RW' };

i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: { appName: 'D&G Store', homeTitle: 'Welcome to D&G Store', loading: 'Loading...', browseProducts: 'Browse products', viewCart: 'View cart', viewOrders: 'Order history', adminDashboard: 'Owner dashboard', productsTitle: 'Products', productsEmpty: 'No products found.', productsError: 'Unable to load products.', offlineMessage: 'You are offline.', retryButton: 'Retry', stockLabel: '{{count}} in stock', addToCart: 'Add to cart', outOfStock: 'Out of stock', cartTitle: 'Your cart', cartEmpty: 'Your cart is empty.', cartError: 'Unable to load your cart.', cartLocalMessage: '{{count}} local cart items will sync when you are online.', cartTotal: 'Total: {{total}}', checkoutButton: 'Checkout', checkoutTitle: 'Checkout', deliveryAddress: 'Delivery address', addressValidation: 'Enter a delivery address.', paymentMethod: 'Payment method', momo: 'Mobile Money', airtel: 'Airtel Money', card: 'Card', placeOrder: 'Place order', checkoutError: 'Unable to place your order.', orderSuccess: 'Order {{id}} placed successfully.', ordersTitle: 'Order history', ordersEmpty: 'You have no orders.', ordersError: 'Unable to load your orders.', orderStatus: 'Status: {{status}}', orderTracking: 'Tracking: {{tracking}}', loginTitle: 'Sign in', loginButton: 'Sign in', registerTitle: 'Create account', registerButton: 'Create account', registerPrompt: 'Create a customer account', loginPrompt: 'Already have an account? Sign in', name: 'Full name', username: 'Username', email: 'Email', password: 'Password', nameValidation: 'Enter your name.', usernameValidation: 'Username must be at least 3 characters.', emailValidation: 'Enter a valid email.', passwordValidation: 'Password must be at least 8 characters.', authLoginError: 'Unable to sign in. Check your details and try again.', authRegisterError: 'Unable to create your account. Check your details and try again.', logoutButton: 'Sign out', cartItems: '{{count}} cart items', languageEnglish: 'English', languageFrench: 'French', languageKinyarwanda: 'Kinyarwanda', adminTitle: 'Owner dashboard', adminStats: 'Overview', adminRevenue: 'Revenue: {{amount}}', adminOrders: 'Orders: {{count}}', adminCustomers: 'Customers: {{count}}', adminOrdersSection: 'Orders', adminProductsSection: 'Products', adminCustomersSection: 'Customers', adminNoOrders: 'No orders found.', adminNoProducts: 'No products found.', adminNoCustomers: 'No customers found.', adminStatus: 'Status: {{status}}', adminUpdateStatus: 'Mark as {{status}}', adminProductName: 'Product name', adminCategory: 'Category', adminPrice: 'Price', adminImage: 'Image URL', adminStock: 'Stock', adminCreateProduct: 'Add product', adminUpdateProduct: 'Save changes', adminEditProduct: 'Edit product', adminDeleteProduct: 'Delete', adminRequired: 'This field is required.', adminInvalidPrice: 'Enter a valid price.', adminInvalidStock: 'Enter a valid stock quantity.', adminError: 'Unable to load owner data.', adminSaveError: 'Unable to save the product.', adminDeleteError: 'Unable to delete the product.', adminSuccess: 'Saved successfully.' } },
    fr: { translation: { appName: 'D&G Store', homeTitle: 'Bienvenue chez D&G Store', loading: 'Chargement...', browseProducts: 'Voir les produits', productsTitle: 'Produits', productsEmpty: 'Aucun produit trouvé.', productsError: 'Impossible de charger les produits.', offlineMessage: 'Vous êtes hors ligne.', retryButton: 'Réessayer', stockLabel: '{{count}} en stock', addToCart: 'Ajouter au panier', outOfStock: 'Rupture de stock', loginTitle: 'Se connecter', loginButton: 'Se connecter', registerTitle: 'Créer un compte', registerButton: 'Créer un compte', registerPrompt: 'Créer un compte client', loginPrompt: 'Vous avez déjà un compte ? Connectez-vous', name: 'Nom complet', username: 'Nom d’utilisateur', email: 'E-mail', password: 'Mot de passe', nameValidation: 'Saisissez votre nom.', usernameValidation: 'Le nom doit contenir au moins 3 caractères.', emailValidation: 'Saisissez un e-mail valide.', passwordValidation: 'Le mot de passe doit contenir au moins 8 caractères.', authLoginError: 'Connexion impossible. Vérifiez vos informations.', authRegisterError: 'Impossible de créer le compte.', logoutButton: 'Se déconnecter', cartItems: '{{count}} articles dans le panier', languageEnglish: 'Anglais', languageFrench: 'Français', languageKinyarwanda: 'Kinyarwanda', adminDashboard: 'Tableau propriétaire', adminTitle: 'Tableau propriétaire', adminStats: 'Aperçu', adminRevenue: 'Revenu : {{amount}}', adminOrders: 'Commandes : {{count}}', adminCustomers: 'Clients : {{count}}', adminOrdersSection: 'Commandes', adminProductsSection: 'Produits', adminCustomersSection: 'Clients', adminNoOrders: 'Aucune commande.', adminNoProducts: 'Aucun produit.', adminNoCustomers: 'Aucun client.', adminStatus: 'Statut : {{status}}', adminUpdateStatus: 'Marquer comme {{status}}', adminProductName: 'Nom du produit', adminCategory: 'Catégorie', adminPrice: 'Prix', adminImage: 'URL de l’image', adminStock: 'Stock', adminCreateProduct: 'Ajouter le produit', adminUpdateProduct: 'Enregistrer les modifications', adminEditProduct: 'Modifier le produit', adminDeleteProduct: 'Supprimer', adminRequired: 'Ce champ est obligatoire.', adminInvalidPrice: 'Saisissez un prix valide.', adminInvalidStock: 'Saisissez un stock valide.', adminError: 'Impossible de charger les données propriétaire.', adminSaveError: 'Impossible d’enregistrer le produit.', adminDeleteError: 'Impossible de supprimer le produit.', adminSuccess: 'Enregistré.' } },
    rw: { translation: { appName: 'D&G Store', homeTitle: 'Murakaza neza kuri D&G Store', loading: 'Birimo gutegurwa...', browseProducts: 'Reba ibicuruzwa', productsTitle: 'Ibicuruzwa', productsEmpty: 'Nta bicuruzwa byabonetse.', productsError: 'Ibicuruzwa ntibyafungutse.', offlineMessage: 'Nta murongo wa interineti ufite.', retryButton: 'Ongera ugerageze', stockLabel: '{{count}} bisigaye', addToCart: 'Ongeramo mu gatebo', outOfStock: 'Byashize', loginTitle: 'Injira', loginButton: 'Injira', registerTitle: 'Fungura konti', registerButton: 'Fungura konti', registerPrompt: 'Fungura konti y’umukiriya', loginPrompt: 'Ufite konti? Injira', name: 'Amazina yose', username: 'Izina ukoresha', email: 'Imeyili', password: 'Ijambobanga', nameValidation: 'Andika amazina yawe.', usernameValidation: 'Izina rigomba kugira inyuguti 3 nibura.', emailValidation: 'Andika imeyili yemewe.', passwordValidation: 'Ijambobanga rigomba kuba rifite inyuguti 8 nibura.', authLoginError: 'Kwinjira byanze. Ongera ugenzure amakuru yawe.', authRegisterError: 'Konti ntiyafunguwe. Ongera ugenzure amakuru yawe.', logoutButton: 'Sohoka', cartItems: 'Ibicuruzwa {{count}} biri mu gatebo', languageEnglish: 'Icyongereza', languageFrench: 'Igifaransa', languageKinyarwanda: 'Kinyarwanda', adminDashboard: 'Imbonerahamwe y’umuyobozi', adminTitle: 'Imbonerahamwe y’umuyobozi', adminStats: 'Incamake', adminRevenue: 'Amafaranga: {{amount}}', adminOrders: 'Amabwiriza: {{count}}', adminCustomers: 'Abakiriya: {{count}}', adminOrdersSection: 'Amabwiriza', adminProductsSection: 'Ibicuruzwa', adminCustomersSection: 'Abakiriya', adminNoOrders: 'Nta mabwiriza abonetse.', adminNoProducts: 'Nta bicuruzwa.', adminNoCustomers: 'Nta bakiriya.', adminStatus: 'Imiterere: {{status}}', adminUpdateStatus: 'Shyira kuri {{status}}', adminProductName: 'Izina ry’igicuruzwa', adminCategory: 'Icyiciro', adminPrice: 'Igiciro', adminImage: 'URL y’ishusho', adminStock: 'Ububiko', adminCreateProduct: 'Ongeraho igicuruzwa', adminUpdateProduct: 'Bika impinduka', adminEditProduct: 'Hindura igicuruzwa', adminDeleteProduct: 'Siba', adminRequired: 'Iki gice kirakenewe.', adminInvalidPrice: 'Andika igiciro cyemewe.', adminInvalidStock: 'Andika umubare w’ububiko wemewe.', adminError: 'Amakuru y’umuyobozi ntiyafungutse.', adminSaveError: 'Igicuruzwa nticyabitswe.', adminDeleteError: 'Igicuruzwa nticyasibwe.', adminSuccess: 'Byabitswe.' } },
  },
  interpolation: { escapeValue: false },
});

i18n.addResources('en', 'translation', { increaseQuantity: 'Increase quantity', decreaseQuantity: 'Decrease quantity', removeItem: 'Remove' });
i18n.addResources('en', 'translation', { orderDate: 'Date: {{date}}', orderAddress: 'Delivery address: {{address}}', orderPayment: 'Payment: {{method}}', orderItems: 'Items', orderItemQuantity: 'Quantity: {{quantity}}' });
i18n.addResources('en', 'translation', { profileButton: 'My profile', profileTitle: 'My profile', profileRole: 'Account role', profileLanguage: 'Language' });

i18n.addResources('fr', 'translation', { increaseQuantity: 'Augmenter la quantité', decreaseQuantity: 'Diminuer la quantité', removeItem: 'Supprimer' });
i18n.addResources('fr', 'translation', { orderDate: 'Date : {{date}}', orderAddress: 'Adresse de livraison : {{address}}', orderPayment: 'Paiement : {{method}}', orderItems: 'Articles', orderItemQuantity: 'Quantité : {{quantity}}' });
i18n.addResources('fr', 'translation', { profileButton: 'Mon profil', profileTitle: 'Mon profil', profileRole: 'Rôle du compte', profileLanguage: 'Langue' });

i18n.addResources('rw', 'translation', { increaseQuantity: 'Ongera umubare', decreaseQuantity: 'Gabanura umubare', removeItem: 'Kuramo' });
i18n.addResources('rw', 'translation', { orderDate: 'Itariki: {{date}}', orderAddress: 'Aho bijyanwa: {{address}}', orderPayment: 'Uburyo bwo kwishyura: {{method}}', orderItems: 'Ibintu byatumijwe', orderItemQuantity: 'Umubare: {{quantity}}' });
i18n.addResources('rw', 'translation', { profileButton: 'Konti yanjye', profileTitle: 'Konti yanjye', profileRole: 'Uruhare', profileLanguage: 'Ururimi' });


async function restoreLanguage(): Promise<void> {
  const stored = await Keychain.getGenericPassword({ service: LANGUAGE_SERVICE });
  if (stored && supportedLanguages.includes(stored.password as SupportedLanguage)) {
    await i18n.changeLanguage(stored.password);
  }
}

restoreLanguage();

export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await Keychain.setGenericPassword('language', language, { service: LANGUAGE_SERVICE });
}

export function formatRwf(amount: number): string {
  const language = supportedLanguages.includes(i18n.language as SupportedLanguage) ? i18n.language as SupportedLanguage : 'en';
  return new Intl.NumberFormat(localeByLanguage[language], { currency: 'RWF', maximumFractionDigits: 0, style: 'currency' }).format(amount);
}

export function useI18n(): typeof i18n {
  const [, setLanguage] = useState(i18n.language);
  useEffect(() => {
    const handleLanguageChanged = (language: string) => setLanguage(language);
    i18n.on('languageChanged', handleLanguageChanged);
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, []);
  return i18n;
}

export default i18n;
