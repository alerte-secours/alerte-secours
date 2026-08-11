# Extra keep rules applied ONLY for Detox e2e builds (see -PdetoxE2E=true).
# The Detox instrumentation runs inside the app process and reflects on the
# Kotlin stdlib/coroutines; R8 full mode strips them from the release app.
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.coroutines.**
