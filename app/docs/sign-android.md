```sh
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 4096 -validity 10000 -alias android-key
```

put keystore file in `~/.lab/alertesecours/my-release-key.jks`


put key's password in ~/.gradle/gradle.properties like

```gradle
RELEASE_STORE_FILE=keys/my-release-key.jks
RELEASE_STORE_PASSWORD=*****
RELEASE_KEY_ALIAS=android-key
RELEASE_KEY_PASSWORD=$same_as_store_password_by_default
```
put encryption_public_key.pem from google in `~/.lab/alertesecours/`

Create public key
```sh
keytool -export -rfc -keystore my-release-key.jks -alias android-key -file upload_certificate.pem

java -jar scripts/pepk.jar --keystore=~/.lab/alertesecours/my-release-key.jks --alias=android-key --output=~/.lab/alertesecours/output.zip --include-cert --rsa-aes-encryption --encryption-key-path=~/.lab/alertesecours/encryption_public_key.pem
```