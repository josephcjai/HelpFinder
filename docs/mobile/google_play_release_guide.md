# Google Play Store Release Guide

This guide details exactly how to build and release your HelpFinder Android app to the Google Play Store.

## 1. APK vs. AAB: What is the difference?

| Feature | **APK** (Android Package) | **AAB** (Android App Bundle) |
| :--- | :--- | :--- |
| **Usage** | Traditional direct install on device. | **Mandatory** for all new Play Store uploads. |
| **Size** | Contains resources for ALL screen sizes and CPUs (larger). | Google generates a tiny, custom APK for each user's specific phone. |
| **Security** | Signed by you. | Signed by you, but Google manages the final app delivery. |

> [!IMPORTANT]
> **Use the AAB file for Google Play.** The APK is only for sending a manual file to your friends for testing.

## 2. Generate the Production AAB

You MUST run this specific command to "bake" the production API URL into the app's code.

1.  **Build the production code:**
    ```powershell
    cd apps/web
    # This command uses the production API URL
    cross-env CAPACITOR_BUILD=true NEXT_PUBLIC_API_BASE=https://api.helpfinder4u.com npm run build:mobile
    ```

2.  **Sync to Android:**
    ```powershell
    npx cap sync android
    ```

3.  **Generate the Signed AAB:**
    ```powershell
    cd android
    ./gradlew bundleRelease
    ```

**Your final file will be located at:**  
`apps/web/android/app/build/outputs/bundle/release/app-release.aab`

## 3. Google Play Console Checklist

Once you have your `app-release.aab`, follow these steps:

1.  **Google Play Console:** Log in at [play.google.com/console](https://play.google.com/console).
2.  **Create App:** Click "Create app", enter "HelpFinder", and select "App", "Free".
3.  **Internal Testing (Recommended):** 
    - Go to **Testing > Internal testing**.
    - Upload your `.aab` file.
    - Add your email address and join the test from your phone.
4.  **Store Presence:** 
    - Set up your **Main store listing** (Description, Icons, Screenshots).
    - Use the `generate_image` tool if you need high-quality icons or screenshots!
5.  **Production Release:** 
    - Once testing is done, go to **Production > Create new release**.
    - Promote your internal test to Production.
    - Click **Review release** and **Start rollout to Production**.

## 4. Key Security Reminder

> [!CAUTION]
> **DO NOT LOSE `release.jks`!** 
> This file and its password (`hfpass123`) are required for **every single update** you push to the store. If you lose it, you can never update the HelpFinder app on Google Play again. Securely back it up now!
