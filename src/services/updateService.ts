import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import packageJson from '../../package.json';

export const CURRENT_APP_VERSION = packageJson.version;

// GitHub repository info
const GITHUB_OWNER = 'tpaccy6-star';
const GITHUB_REPO = 'DGStore';

// Fastly CDN raw file URL (no rate limits)
const RAW_VERSION_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/version.json`;
// GitHub Releases API as automatic fallback
const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

const UPDATE_DISMISS_SERVICE = 'com.dgstore.dismissed_update';

export interface UpdateInfo {
  version: string;
  minRequiredVersion?: string;
  title: string;
  releaseDate?: string;
  features: string[];
  downloadUrl: string;
  forceUpdate: boolean;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  isMandatory: boolean;
  updateInfo: UpdateInfo | null;
}

/**
 * Retrieve the version string the user previously dismissed
 */
export async function getDismissedUpdateVersion(): Promise<string | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: UPDATE_DISMISS_SERVICE });
    if (creds && creds.password) {
      return creds.password;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Record a version as dismissed so optional updates don't spam on every app launch
 */
export async function setDismissedUpdateVersion(version: string): Promise<void> {
  try {
    await Keychain.setGenericPassword('dismissed_version', version, { service: UPDATE_DISMISS_SERVICE });
  } catch {
    // Ignore
  }
}

/**
 * Compare two semver version strings (e.g. "0.0.2" vs "0.0.1")
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/i, '').trim();
  const clean2 = v2.replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Check for updates from GitHub (Fastly CDN raw JSON with fallback to Releases API)
 * @param ignoreDismissed if true, checks regardless of previous user dismissal
 */
export async function checkForAppUpdates(ignoreDismissed = false): Promise<UpdateCheckResult> {
  try {
    // 1. Try raw version.json from GitHub main branch with cache-buster
    try {
      const cacheBustUrl = `${RAW_VERSION_URL}?_t=${Date.now()}`;
      const res = await axios.get<UpdateInfo>(cacheBustUrl, {
        timeout: 5000,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache' },
      });

      if (res.data && res.data.version) {
        const remoteVersion = res.data.version;
        const hasUpdate = compareVersions(remoteVersion, CURRENT_APP_VERSION) > 0;
        const isMandatory =
          Boolean(res.data.forceUpdate) ||
          Boolean(
            res.data.minRequiredVersion &&
              compareVersions(res.data.minRequiredVersion, CURRENT_APP_VERSION) > 0,
          );

        if (hasUpdate && !isMandatory && !ignoreDismissed) {
          const dismissedVersion = await getDismissedUpdateVersion();
          if (dismissedVersion === remoteVersion) {
            return {
              hasUpdate: false,
              isMandatory: false,
              updateInfo: null,
            };
          }
        }

        return {
          hasUpdate,
          isMandatory,
          updateInfo: hasUpdate ? res.data : null,
        };
      }
    } catch {
      // Fall through to GitHub Releases API fallback
    }

    // 2. Fallback: Check latest GitHub Release API
    const releaseRes = await axios.get(RELEASES_API_URL, {
      timeout: 5000,
      headers: { 'Cache-Control': 'no-cache' },
    });
    const release = releaseRes.data;

    if (release && release.tag_name) {
      const remoteVersion = release.tag_name.replace(/^v/i, '');
      const hasUpdate = compareVersions(remoteVersion, CURRENT_APP_VERSION) > 0;

      if (hasUpdate && !ignoreDismissed) {
        const dismissedVersion = await getDismissedUpdateVersion();
        if (dismissedVersion === remoteVersion) {
          return {
            hasUpdate: false,
            isMandatory: false,
            updateInfo: null,
          };
        }
      }

      // Extract APK download url if attached in release assets
      const apkAsset = release.assets?.find((a: any) =>
        a.name?.toLowerCase().endsWith('.apk'),
      );
      const downloadUrl =
        apkAsset?.browser_download_url || release.html_url || `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;

      // Extract bullet points from release body
      const features: string[] = [];
      if (release.body) {
        const lines = release.body.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            features.push(trimmed.substring(2).trim());
          }
        }
      }

      if (features.length === 0) {
        features.push('New features and performance improvements');
      }

      const updateInfo: UpdateInfo = {
        version: remoteVersion,
        title: release.name || `Update ${release.tag_name}`,
        releaseDate: release.published_at ? release.published_at.split('T')[0] : undefined,
        features,
        downloadUrl,
        forceUpdate: false,
      };

      return {
        hasUpdate,
        isMandatory: false,
        updateInfo: hasUpdate ? updateInfo : null,
      };
    }
  } catch (error) {
    // Non-blocking: fail quietly on network or timeout errors
    console.log('[UpdateChecker] Could not check for updates:', error);
  }

  return {
    hasUpdate: false,
    isMandatory: false,
    updateInfo: null,
  };
}
