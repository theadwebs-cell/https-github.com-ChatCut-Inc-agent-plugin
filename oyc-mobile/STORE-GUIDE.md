# Publishing the OYC apps on Google Play and the App Store

Two store apps are set up:

| App | Store name | App ID (bundle / package) | Opens |
|---|---|---|---|
| Customer | **On Your Call** | `in.onyourcall.app` | https://onyourcall.in/oyc-app |
| Partner | **OYC Partner** | `in.onyourcall.partner` | https://onyourcall.in/oyc-partner |

The store apps load your live apps, so price changes, new services and fixes show up without a new store release. You only need a new release to change the app icon, the name or the phone permissions.

Privacy policy for both stores: **https://onyourcall.in/privacy**. The account-deletion section is **https://onyourcall.in/privacy#delete**.

---

## Part 1 – Android (Google Play)

### 1. Create your Google Play developer account (one time, US$25)
1. Go to https://play.google.com/console/signup and sign in with the Google account you want to own the apps.
2. Choose **Organization** if OYC is a registered business (needs a D-U-N-S number), otherwise **Individual**.
3. Pay the $25 fee and complete identity verification. This can take 1–3 days.
4. **Individual accounts created after Nov 2023** must run a **closed test with at least 12 testers for 14 days** before they can publish to everyone. Plan for this.

### 2. Get the app files (.aab)
1. Open your GitHub repository → **Actions** → **OYC Android (Play Store)** → **Run workflow** → choose **both** → **Run**.
2. When it finishes (about 10 minutes), open the run and download:
   - `oyc-customer-android-vNN` → contains `app-release.aab` (upload to Play) and `app-release.apk` (to install on a phone for testing)
   - `oyc-partner-android-vNN` → the same for the partner app
3. **First run only – save your upload key.** Download `SAVE-THIS-android-upload-key`. It contains `upload.jks`, `ANDROID_KEYSTORE_BASE64.txt` and `passwords.txt`.
   - In GitHub: **Settings → Secrets and variables → Actions → New repository secret**, and add these four secrets:
     - `ANDROID_KEYSTORE_BASE64` = the contents of `ANDROID_KEYSTORE_BASE64.txt`
     - `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` = the values in `passwords.txt`
   - Keep a copy of the zip somewhere safe (Google Drive, private). Every future update must be signed with this same key. The download disappears from GitHub after 7 days.

### 3. Create each app in Play Console
For **On Your Call** and then **OYC Partner**:
1. **Create app** → name, language English (India), **App**, **Free**.
2. **App content** (left menu) – complete every item:
   - Privacy policy: `https://onyourcall.in/privacy`
   - App access: *Customer app* – "All functionality is available without special access". *Partner app* – "Some functionality is restricted": give Google a test login (mobile **9999999999**, PIN **1234**, or a real test partner you create in Admin).
   - Ads: **No ads**.
   - Content rating: fill in the questionnaire (Utility / Productivity, no violence etc.).
   - Target audience: **18 and over**.
   - Data safety, for the customer app: collects Name, Phone number, Address, Approximate & precise location (optional, app functionality), Purchase history (bookings). Data is encrypted in transit; users can request deletion at `https://onyourcall.in/privacy#delete`. Not shared for advertising.
   - Data safety, for the partner app: additionally collects Photos (passport photo) and Government ID (Aadhaar number and images) for **account management / fraud prevention**.
   - Account deletion URL: `https://onyourcall.in/privacy#delete`
3. **Store listing**: short description (80 characters), full description, the 512×512 app icon (your logo), a 1024×500 feature graphic, and at least 2 phone screenshots (take them from the APK on your phone).
4. **Testing → Closed testing** (or **Internal testing** to try it first) → **Create release** → upload `app-release.aab` → add testers' Gmail addresses → **Roll out**.
5. When testing is done: **Production → Create release** → upload the latest `.aab` → **Send for review**. Reviews usually take 1–7 days.

### 4. Releasing an update later
Run the workflow again (enter a new version such as `1.0.1`), then upload the new `.aab` in Play Console. The build number goes up automatically.

---

## Part 2 – iOS (Apple App Store)

### 1. Join the Apple Developer Program (US$99 per year)
1. On an iPhone, install the **Apple Developer** app → **Account → Enroll now**, or go to https://developer.apple.com/programs/enroll/.
2. Enrol as an **Organization** (needs a D-U-N-S number and the legal company name) or as an **Individual**. Approval takes 1–2 days, longer for organisations.

### 2. Create the two app records
In https://appstoreconnect.apple.com → **Apps → +** → **New App**:
- Platform iOS, name **On Your Call**, language English (India), Bundle ID **`in.onyourcall.app`** (if it isn't in the list, first register it at developer.apple.com → Certificates, IDs & Profiles → Identifiers → +), SKU `oyc-customer`.
- Repeat for **OYC Partner** with Bundle ID **`in.onyourcall.partner`**, SKU `oyc-partner`.

### 3. Let GitHub build and upload the iOS apps
1. App Store Connect → **Users and Access → Integrations → App Store Connect API → Team Keys → +**. Name it "GitHub", access **App Manager**, then **Generate**.
2. Download the `.p8` key (you can only download it once) and note the **Key ID** and the **Issuer ID** shown at the top.
3. Find your **Team ID** at https://developer.apple.com/account → Membership details.
4. In GitHub → **Settings → Secrets and variables → Actions**, add:
   - `ASC_KEY_ID` = Key ID
   - `ASC_ISSUER_ID` = Issuer ID
   - `ASC_KEY_P8` = the whole text of the `.p8` file (open it in Notepad and copy everything)
   - `APPLE_TEAM_ID` = Team ID
5. **Actions → OYC iOS (App Store) → Run workflow → both**. With the secrets in place it signs the apps and uploads them to App Store Connect. They appear under **TestFlight** after about 15–30 minutes of processing.

### 4. Submit for review
For each app in App Store Connect:
- **App Privacy**: same data as the Android Data safety section above; privacy policy `https://onyourcall.in/privacy`.
- **App Information**: category **Lifestyle** (customer) / **Business** (partner); age rating questionnaire.
- **Version page**: screenshots for 6.9" and 6.5" iPhones, description, keywords, support URL `https://onyourcall.in/on-your-call-home`, and choose the TestFlight build.
- **App Review Information**: for the partner app give the test login (mobile and PIN). In the notes, explain: "OYC is a home-services booking app in Hyderabad. Customers book services; partners receive and complete jobs, verified with Aadhaar."
- **Submit for Review**. Apple usually replies within 1–3 days.

**About Apple review:** Apple sometimes rejects apps that mainly show a website (guideline 4.2). The OYC apps include push notifications, camera and location features, which help. Set up Part 3 before you submit to Apple, and mention the notifications in the review notes.

---

## Live GPS tracking – what to tell the stores (Partner app only)

When a partner taps **"Start trip – I'm on the way"**, the Partner app shares their location every ~10 seconds, also in the background while Google Maps navigation is open. A notification ("OYC – On the way") shows while sharing. It stops automatically when the job starts. Customers see a live map with distance and arrival time; the admin panel shows it too.

- **Google Play → App content → Foreground service permissions**: declare **Location** and explain: "Partners share their live location with the customer only while travelling to a booked job (after tapping 'On the way'). A visible notification is shown and sharing stops when the job starts." Google may ask for a short screen recording showing this, made from the test APK.
- **Google Play → Data safety (partner app)**: add **Precise location** to the data collected, shared with customers, for app functionality.
- **Apple → App Review notes (partner app)**: "Background location is used only while the partner is travelling to a job, after tapping 'On the way'. It lets the customer see the partner's arrival. It stops when the job starts."
- **Apple → App Privacy (partner app)**: add **Precise Location**, linked to the user, used for app functionality.

---

## Part 3 – Push notifications (Firebase, free)

Push notifications work in the **store apps** only, not in the browser. They are sent automatically by your Google Sheet script:

- **Partner:** new job assigned, a customer cancelled, registration approved.
- **Customer:** professional assigned, booking confirmed, professional on the way, service started, service completed (with a "rate us" prompt), booking cancelled.

### 1. Create the Firebase project (10 minutes)
1. Go to https://console.firebase.google.com → **Create a project** → name it `On Your Call`. Turn Google Analytics off (not needed).
2. **Add the Android apps.** Click the Android icon:
   - Package name `in.onyourcall.app`, nickname "OYC Customer" → **Register app** → download **google-services.json**. Rename it `google-services-customer.json`.
   - Add another Android app: package `in.onyourcall.partner`, nickname "OYC Partner" → download its google-services.json and rename it `google-services-partner.json`.
   - Skip the remaining "add SDK" steps; that part is already done.
3. **Add the iOS apps** (once you have the Apple account). Click **Add app → iOS**:
   - Bundle ID `in.onyourcall.app` → download **GoogleService-Info.plist** and rename it `GoogleService-Info-customer.plist`.
   - Bundle ID `in.onyourcall.partner` → download and rename it `GoogleService-Info-partner.plist`.
4. **Apple push key** (iOS only): at https://developer.apple.com/account/resources/authkeys/list, click **+**, tick **Apple Push Notifications service (APNs)**, then Continue and Register. Download the `.p8` file and note the **Key ID**.
   Then in Firebase: **Project settings → Cloud Messaging → Apple app configuration → APNs Authentication Key → Upload**. Upload the .p8 file and enter the Key ID and your Team ID. Do this for both iOS apps.

### 2. Put the Firebase files into GitHub (so the apps are built with push)
GitHub → **Settings → Secrets and variables → Actions → New repository secret**. Open each file in Notepad, copy **everything**, and paste it as the secret value:

| Secret name | File |
|---|---|
| `GOOGLE_SERVICES_JSON_CUSTOMER` | google-services-customer.json |
| `GOOGLE_SERVICES_JSON_PARTNER` | google-services-partner.json |
| `GOOGLE_SERVICE_INFO_PLIST_CUSTOMER` | GoogleService-Info-customer.plist |
| `GOOGLE_SERVICE_INFO_PLIST_PARTNER` | GoogleService-Info-partner.plist |

Then run the Android and iOS workflows again. The build log shows **"Push notifications: ON"**.

### 3. Let your Google Sheet script send notifications
1. Firebase → **Project settings (gear) → Service accounts → Generate new private key → Generate key**. A `.json` file downloads. Keep it private.
2. Open your sheet → **Extensions → Apps Script** → **Project Settings** (gear on the left) → **Script Properties** → **Add script property**:
   - Property: `FCM_SERVICE_ACCOUNT`
   - Value: the entire contents of that .json file
   - **Save script properties**.
3. Paste the latest script (OYC-Google-Apps-Script.txt), keep your password on line 2, **Save**, run **setup** once (it asks for the new "connect to an external service" permission), then **Deploy → Manage deployments → ✏️ → New version → Deploy**.
4. Test it: install the app on your phone, log in and allow notifications. Then in Apps Script select **testPush** and click **Run**, and every registered phone should get "OYC test".

---

## What is in this folder

- `customer/` and `partner/` – Capacitor projects (Android in `android/`, iOS in `ios/`).
- `capacitor.config.json` – the app name, ID and the web address each app opens.
- Phone permissions: location (to fill in the address), camera and photos (partner Aadhaar upload).
- The app icon and splash screen are made automatically from the OYC logo during each build.
- Workflows: `.github/workflows/oyc-android.yml` and `.github/workflows/oyc-ios.yml`.
