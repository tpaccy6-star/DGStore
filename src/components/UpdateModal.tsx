import React from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CheckCircle2, Download, Sparkles, X } from 'lucide-react-native';
import { colors, spacing, cardShadow } from '../theme';
import {
  CURRENT_APP_VERSION,
  UpdateInfo,
  setDismissedUpdateVersion,
} from '../services/updateService';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo | null;
  isMandatory?: boolean;
  onDismiss: () => void;
}

export function UpdateModal({
  visible,
  updateInfo,
  isMandatory = false,
  onDismiss,
}: UpdateModalProps): React.JSX.Element | null {
  if (!visible || !updateInfo) return null;

  const handleDismiss = () => {
    if (updateInfo?.version) {
      setDismissedUpdateVersion(updateInfo.version).catch(() => undefined);
    }
    onDismiss();
  };

  const handleDownload = async () => {
    try {
      const supported = await Linking.canOpenURL(updateInfo.downloadUrl);
      if (supported) {
        await Linking.openURL(updateInfo.downloadUrl);
      } else {
        await Linking.openURL(updateInfo.downloadUrl);
      }
    } catch {
      Alert.alert(
        'Unable to Open Link',
        `Please open this download link in your browser:\n${updateInfo.downloadUrl}`,
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isMandatory ? undefined : handleDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.goldBadge}>
              <Sparkles size={13} color={colors.goldDark} />
              <Text style={styles.badgeText}>NEW RELEASE AVAILABLE</Text>
            </View>
            {!isMandatory && (
              <TouchableOpacity
                onPress={handleDismiss}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
                style={styles.closeButton}>
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Title and Version Info */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {updateInfo.title || 'D&G Store Update'}
            </Text>
            <View style={styles.versionRow}>
              <Text style={styles.versionText}>
                v{updateInfo.version}
              </Text>
              <Text style={styles.currentVersionText}>
                (You have v{CURRENT_APP_VERSION})
              </Text>
            </View>
          </View>

          {/* Features / What's New List */}
          <Text style={styles.sectionHeader}>WHAT'S NEW & IMPROVEMENTS</Text>
          <ScrollView style={styles.featuresList} bounces={false}>
            {updateInfo.features.map((feature, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={styles.iconWrapper}>
                  <CheckCircle2 size={15} color={colors.gold} />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.downloadButton}
              activeOpacity={0.85}
              onPress={handleDownload}>
              <Download size={18} color={colors.white} />
              <Text style={styles.downloadButtonText}>
                DOWNLOAD & UPDATE APK
              </Text>
            </TouchableOpacity>

            {!isMandatory && (
              <TouchableOpacity
                style={styles.laterButton}
                activeOpacity={0.7}
                onPress={handleDismiss}>
                <Text style={styles.laterButtonText}>MAYBE LATER</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.page,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    maxHeight: '85%',
    overflow: 'hidden',
    padding: spacing.lg,
    ...cardShadow,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  goldBadge: {
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderColor: colors.goldMuted,
    borderRadius: spacing.radiusPill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
  },
  badgeText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  titleContainer: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  versionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginTop: 4,
  },
  versionText: {
    color: colors.goldDark,
    fontSize: 13,
    fontWeight: '700',
  },
  currentVersionText: {
    color: colors.muted,
    fontSize: 12,
  },
  sectionHeader: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  featuresList: {
    backgroundColor: colors.paper,
    borderColor: colors.lineLight,
    borderRadius: spacing.radius,
    borderWidth: 1,
    maxHeight: 220,
    padding: spacing.md,
  },
  featureItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm + 2,
    marginBottom: spacing.sm + 2,
  },
  iconWrapper: {
    marginTop: 2,
  },
  featureText: {
    color: colors.inkLight,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  downloadButton: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: spacing.radius,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  downloadButtonText: {
    color: colors.goldBright,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  laterButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
  },
  laterButtonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
