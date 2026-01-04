I have successfully updated the favicon and PWA icons to use the `logo.png`, `large-logo.png`, and `logo.svg` files you provided in the `public/images/` directory.

The following changes have been made:
- `index.html` now points to your new logos for the browser tab icon, Apple touch icon, and mask icon.
- The PWA configuration (`vite.config.ts`) has been updated to use your logos for the web app manifest, which will be used when the app is installed on a device.
- The old placeholder icon files have been removed.

Your new branding should now be correctly displayed. You may need to clear your browser cache or do a hard refresh to see the changes.