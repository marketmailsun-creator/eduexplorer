#!/bin/bash
# Sync Capacitor native projects with current plugins/config.
# Run this after installing/updating Capacitor plugins.
# NOTE: In Remote URL mode, you do NOT need to rebuild for content changes —
# the app always loads the latest deployed URL. Run this only when:
#   - Adding or updating Capacitor plugins
#   - Changing capacitor.config.ts settings
#   - After upgrading @capacitor/core

set -e

echo "🔄 Syncing Capacitor native projects..."
npx cap sync

echo "✅ Sync complete."
echo ""
echo "Next steps:"
echo "  iOS:     npm run cap:ios     (opens Xcode — requires macOS)"
echo "  Android: npm run cap:android (opens Android Studio)"
echo ""
echo "To submit to stores:"
echo "  iOS:     Archive in Xcode → Distribute to App Store Connect"
echo "  Android: Generate signed APK/AAB in Android Studio → Upload to Play Console"
