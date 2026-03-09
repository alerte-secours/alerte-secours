# get/create creds
- appstoreconnect apiKey
generate a key here: https://appstoreconnect.apple.com/access/integrations/api
- retrieve provider id (called PublicId in the output of altool)
```sh
xcrun altool --list-providers --apiKey $ASC_API_KEY_ID --apiIssuer $ASC_API_ISSUER_ID --apiKeyPath $ASC_API_KEY_PATH
```

# Authentication Key Setup
1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click the "+" button to generate a new API key
3. Give it a name (e.g., "AlerteSecours Build Key")
4. Download the .p8 file when prompted
5. Store the .p8 file in a secure location (recommended: `/Users/devthejo/Documents/as-app/ios/AuthKey.p8`)
6. Note down the Key ID and Issuer ID shown on the website
7. Set up environment variables:
```sh
export ASC_API_KEY_ID="YOUR_KEY_ID"
export ASC_API_ISSUER_ID="YOUR_ISSUER_ID"
export ASC_API_KEY_PATH="/Users/devthejo/Documents/as-app/ios/AuthKey.p8"
```

# check build commands
```sh
cd ios
codesign -dvvv build/extracted/Payload/AlerteSecours.app
codesign --verify --deep --strict --verbose=2 build/extracted/Payload/AlerteSecours.app
xcrun altool --validate-app --type ios --file build/AlerteSecours.ipa --apiKey $ASC_API_KEY_ID --apiIssuer $ASC_API_ISSUER_ID
