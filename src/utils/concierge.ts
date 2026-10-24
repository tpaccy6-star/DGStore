import { Alert, Linking } from 'react-native';

export const CONCIERGE_PHONE = '+250781343621'; // MTN Rwanda
export const CONCIERGE_PHONE_SECONDARY = '+250726705175'; // Airtel Rwanda
export const CONCIERGE_WHATSAPP = '250781343621';
export const CONCIERGE_WHATSAPP_SECONDARY = '250726705175';

/**
 * Open WhatsApp with prefilled luxury concierge inquiry
 */
export async function openWhatsAppConcierge(
  customMessage = 'Hello D&G Store Concierge, I would like assistance with an inquiry.',
  useSecondary = false,
): Promise<void> {
  const targetNumber = useSecondary ? CONCIERGE_WHATSAPP_SECONDARY : CONCIERGE_WHATSAPP;
  const encodedText = encodeURIComponent(customMessage);
  const appUrl = `whatsapp://send?phone=${targetNumber}&text=${encodedText}`;
  const webUrl = `https://wa.me/${targetNumber}?text=${encodedText}`;

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
      `You can reach our Kigali boutique concierge on WhatsApp or call us directly at ${CONCIERGE_PHONE} / ${CONCIERGE_PHONE_SECONDARY}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call MTN', onPress: () => callConcierge(CONCIERGE_PHONE) },
        { text: 'Call Airtel', onPress: () => callConcierge(CONCIERGE_PHONE_SECONDARY) },
      ],
    );
  }
}

/**
 * Trigger direct phone call to boutique hotline
 */
export async function callConcierge(phone = CONCIERGE_PHONE): Promise<void> {
  const telUrl = `tel:${phone}`;
  try {
    await Linking.openURL(telUrl);
  } catch {
    Alert.alert('Phone Call', `Please dial ${phone} on your phone.`);
  }
}
