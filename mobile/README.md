# FKBC Coaches Console – App Store & Google Play build

This folder wraps the web app (repo root) in a native shell using **Capacitor 8**, so the same code becomes an iPhone/iPad app and an Android app. Nothing here changes the web app, which stays live on Vercel.

## What is ready

| Item | Where |
|---|---|
| Android project (targets **Android 16 / API 36**, min Android 7) | `android/` |
| iOS project (Swift Package Manager, no CocoaPods) | `ios/` |
| Icons, adaptive icon, splash screens | already generated into both projects |
| Play Store icon 512, feature graphic 1024x500 | `store/` |
| Screenshots at the exact store sizes (iPhone 6.7", iPad 13", Android phone) | `store/screenshots/` |
| Privacy policy page | `/privacy.html` → https://fkbc-coaches-console.vercel.app/privacy.html |
| Cloud builds (no Mac or Android Studio needed) | `.github/workflows/android.yml`, `ios.yml` |
| iOS audio: bell **mixes over Spotify** and plays on silent | `ios/App/App/AppDelegate.swift` |
| Screen stays awake during a lesson (native plugin) | `@capacitor-community/keep-awake` |

## What I could NOT do from here (be aware)

* **I could not compile either app.** This environment has no Android SDK (downloads blocked) and no Mac/Xcode. The projects were generated and synced successfully, and the web code was tested, but the first real build will happen on GitHub's servers. Expect to fix small things on the first run.
* **I cannot sign or upload for you.** That needs your Apple and Google developer accounts.
* **The bell-over-Spotify behaviour on a real iPhone/iPad is still untested.** The native audio session is set to "play over other audio", which is the correct setting – confirm it on a real device through TestFlight before you submit.

Store build requirements (checked November 2026): Google Play needs apps to target **API 36** (done); App Store Connect needs builds made with **Xcode 26 / iOS 26 SDK** (the iOS workflow checks this and fails clearly if the runner is too old).

---

## 1. Things only you can decide / provide

1. **Developer accounts** – Apple Developer Program (about £99/year) and Google Play Console (one-off fee of about $25). Use the club's details.
2. **Bundle / package ID** – currently `com.fkbc.coachesconsole`. It becomes permanent once the app is published, so change it now if you want a different one (e.g. one that matches the club's website). Change it in `capacitor.config.json`, `android/app/build.gradle` (`namespace` and `applicationId`) and the Xcode project, or ask me to do it.
3. **Support contact / website URL** for the store pages.
4. **App name** – "FKBC Coaches Console" (30 characters max on both stores).
5. **Review access** – the app opens on an access-code screen (use the current club access code). Reviewers need this in the "App Review notes" (see below) or the app will be rejected as unusable.

## 2. Android (Google Play)

1. Create a signing key **once** and keep it backed up somewhere safe (lose it = you cannot update the app):
   ```
   keytool -genkeypair -v -keystore fkbc-upload.keystore -alias fkbc -keyalg RSA -keysize 2048 -validity 10000
   base64 -w0 fkbc-upload.keystore      # copy the output
   ```
2. In GitHub → repo **Settings → Secrets and variables → Actions**, add: `ANDROID_KEYSTORE_BASE64` (the base64 text), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`fkbc`), `ANDROID_KEY_PASSWORD`.
3. GitHub → **Actions → Android build → Run workflow**. When it finishes, download:
   * `fkbc-android-debug-apk` – install on a phone to test straight away.
   * `fkbc-android-release-aab` – the file Google Play wants.
4. Play Console → **Create app** → upload the `.aab` to **Internal testing** first and install it via the testers link.
5. Complete the listing using `store/` images and the text below, then the questionnaires:
   * **Data safety:** the app collects no data and shares none (see `privacy.html`).
   * **Content rating:** no violence, no user-generated public content, no purchases → expect "Everyone".
   * **Target audience:** adults/coaches (not primarily children).
6. New personal developer accounts must usually run a **closed test with about 12 testers for 14 days** before production access – check the current rule in Play Console. Organisation accounts are exempt.

## 3. iPhone / iPad (App Store)

1. Enrol in the Apple Developer Program; in **Certificates, Identifiers & Profiles** create an App ID for your bundle ID.
2. **App Store Connect → Apps → New App** with the same bundle ID.
3. **Users and Access → Integrations → App Store Connect API → create a key** with role *App Manager*. Download the `.p8` once.
4. Add GitHub secrets: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (paste the whole file contents).
5. GitHub → **Actions → iOS build → Run workflow**, tick **upload_to_testflight**. The workflow archives, signs with automatic cloud signing and uploads. The build appears in **TestFlight** after processing (10–30 minutes).
6. Install through TestFlight on a real iPhone **and** iPad. Check: bell over Spotify, bell with the silent switch on, timer stays awake, share/export lesson.
7. App Store Connect → fill the listing, upload `store/screenshots/iphone-*` and `ipad-*`, then **Add for Review**.
   * **App Privacy:** choose **Data Not Collected**.
   * **Age rating:** answer "None" to every content question → 4+.
   * **Export compliance:** already answered ("no non-exempt encryption") in `Info.plist`.
   * **App Review notes** (paste): *"This is a tool for kickboxing coaches. On first launch enter access code <YOUR ACCESS CODE> and tap any coach profile. Then use Planner to build a lesson and the red Start button to run the timer. Lessons are stored on the device; the app has no accounts and no network features."*

> **Apple review risk (guideline 4.2 "minimum functionality"):** Apple can reject apps that are just a website in a frame. This one works fully offline, has a native audio session, keeps the screen awake and has real functionality (planner, timer, library, grading), which helps – but it is not guaranteed. If rejected, reply with the points above; adding native haptics/notifications would strengthen it.

## 4. Store listing text (copy/paste)

**Name:** FKBC Coaches Console  
**Subtitle (iOS, 30):** Lesson planner & round timer  
**Short description (Google, 80):** Plan kickboxing, boxing & Muay Thai classes and run the round timer.  
**Keywords (iOS, 100):** kickboxing,boxing,muay thai,coach,lesson plan,round timer,interval timer,martial arts,grading,pads  
**Category:** Sports (alternative: Health & Fitness)

**Description:**
> Plan it. Time it. Coach it.
>
> FKBC Coaches Console is the lesson planner and round timer built for martial-arts coaches.
>
> • Build a class in minutes – warm-up, technique, pad work, partner work, sparring, fitness, cool down and grading sections, each colour-coded.
> • Pad-swap timing – set demo time, work time and swap-over; choose swap after every round or after all the rounds. The app works out the whole session for you.
> • Built-in library – drills and combinations for kickboxing, boxing, Muay Thai and fitness, plus a belt-by-belt kickboxing grading syllabus. Add your own and tap to drop them into a lesson.
> • Full-screen timer – big clock, bell and klaxon sounds that play over your music, countdown beeps, and your coach's artwork sliding in for their part of the class.
> • Save, copy and share lessons with other coaches. Everything stays on your device – no accounts, no tracking.
> • Works offline.

## 5. Updating later

Change the web app as normal, then run the workflows again (the version code increases automatically with each run). To refresh the native copy locally: `cd mobile && npm ci && npm run sync`. Regenerate icons/screenshots with `npm run assets` and `node scripts/make-screenshots.js <url>`.

## 6. Known limitations to be honest about

* **Access code and admin code are stored in the app's code.** They keep casual users out of the timetable editor but are not real security. Fine for a club tool; do not treat them as secret.
* **Coach chat is local to each device.** It does not sync between phones. Don't describe it as messaging between coaches in the store listing.
* **Timer sounds need the app on screen.** The screen is kept awake, but if a phone is locked the bell may not sound (background audio mode is deliberately not enabled; Apple only allows it for apps that genuinely play audio in the background).
