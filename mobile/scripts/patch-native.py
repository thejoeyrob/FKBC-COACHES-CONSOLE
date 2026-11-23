"""Applies the FKBC customisations to the generated native projects. Safe to run repeatedly.
Run after `npx cap add ios|android`:   python3 scripts/patch-native.py"""
import os, re
M = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- iOS: audio session so the bell mixes over Spotify (and plays on silent), no export-compliance prompt
sw = os.path.join(M, 'ios/App/App/AppDelegate.swift')
if os.path.exists(sw):
    t = open(sw).read()
    if 'configureAudioSession' not in t:
        t = t.replace('import Capacitor\n', 'import Capacitor\nimport AVFoundation\n', 1)
        t = t.replace('        // Override point for customization after application launch.\n        return true',
            '        // Bell and klaxon must be heard over the coach\'s music (Spotify etc.) without stopping it, and even when the\n'
            '        // phone is on silent. .playback + .mixWithOthers does exactly that.\n        configureAudioSession()\n        return true', 1)
        t = t.replace('    func applicationDidBecomeActive(_ application: UIApplication) {',
            '    private func configureAudioSession() {\n        do {\n            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])\n'
            '            try AVAudioSession.sharedInstance().setActive(true)\n        } catch {\n            print("FKBC: audio session setup failed: \\(error)")\n        }\n    }\n\n'
            '    func applicationDidBecomeActive(_ application: UIApplication) {\n        configureAudioSession()', 1)
        assert 'configureAudioSession()' in t and 'AVFoundation' in t
        open(sw, 'w').write(t)
pl = os.path.join(M, 'ios/App/App/Info.plist')
if os.path.exists(pl):
    t = open(pl).read()
    if 'ITSAppUsesNonExemptEncryption' not in t:
        t = t.replace('</dict>\n</plist>', '\t<key>ITSAppUsesNonExemptEncryption</key>\n\t<false/>\n</dict>\n</plist>')
        open(pl, 'w').write(t)

# ---- Android: release signing from environment (CI secrets) + version from environment
g = os.path.join(M, 'android/app/build.gradle')
if os.path.exists(g):
    t = open(g).read()
    if 'FKBC_KEYSTORE' not in t:
        t = re.sub(r'versionCode \d+', 'versionCode (System.getenv("FKBC_VERSION_CODE") ?: "1").toInteger()', t, 1)
        t = re.sub(r'versionName "[^"]*"', 'versionName (System.getenv("FKBC_VERSION_NAME") ?: "1.0")', t, 1)
        t = t.replace('    buildTypes {\n        release {',
            '    signingConfigs {\n        release {\n            if (System.getenv("FKBC_KEYSTORE")) {\n                storeFile file(System.getenv("FKBC_KEYSTORE"))\n'
            '                storePassword System.getenv("FKBC_KEYSTORE_PASSWORD")\n                keyAlias System.getenv("FKBC_KEY_ALIAS")\n'
            '                keyPassword System.getenv("FKBC_KEY_PASSWORD")\n            }\n        }\n    }\n    buildTypes {\n        release {\n'
            '            if (System.getenv("FKBC_KEYSTORE")) { signingConfig signingConfigs.release }', 1)
        assert 'FKBC_KEYSTORE' in t
        open(g, 'w').write(t)
print('native projects patched')
