import { Alert, Linking } from 'react-native';

export const CONCIERGE_PHONE = '+250788300000';
export const CONCIERGE_WHATSAPP = '250788300000';

/**
 * Open WhatsApp with prefilled luxury concierge inquiry
 */
export async function openWhatsAppConcierge(
  customMessage = 'Hello D&G Store Concierge, I would like assistance with an inquiry.',
): Promise<void> {
  const encodedText = encodeURIComponent(customMessage);
  const appUrl = `whatsapp://send?phone=${CONCIERGE_WHATSAPP}&text=${encodedText}`;
  const webUrl = `https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodedText}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appUrl);
    if (canOpenApp) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    Alert.alert(
      'Boutique Concierge',
      `You can reach our Kigali boutique concierge on WhatsApp or call us directly at ${CONCIERGE_PHONE}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => callConcierge() },
      ],
    );
  }
}

/**
 * Trigger direct phone call to boutique hotline
 */
export async function callConcierge(): Promise<void> {
  const telUrl = `tel:${CONCIERGE_PHONE}`;
  try {
    await Linking.openURL(telUrl);
  } catch {
    Alert.alert('Phone Call', `Please dial ${CONCIERGE_PHONE} on your phone.`);
  }
}
