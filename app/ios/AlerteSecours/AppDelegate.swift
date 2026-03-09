import EXUpdates
import FirebaseCore
import React
import TSBackgroundFetch
import UIKit

@objc(AppDelegate)
class AppDelegate: RCTAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    NSLog("[AppDelegate] didFinishLaunchingWithOptions (RCTAppDelegate)")

    // Configure Firebase (react-native-firebase).
    FirebaseApp.configure()

    // Transistorsoft background fetch bootstrap.
    TSBackgroundFetch.sharedInstance().didFinishLaunching()
    NSLog("[AppDelegate] TSBackgroundFetch didFinishLaunching")

    // Initialize expo-updates controller so AppController.sharedInstance can be used safely.
    AppController.initializeWithoutStarting()

    let updatesController = AppController.sharedInstance
    if updatesController.isActiveController {
      updatesController.start()
    } else {
      NSLog("[AppDelegate] Skipping AppController.start(): isActiveController is false (dev client or disabled updates)")
    }

    // Configure React Native root module.
    self.moduleName = "main"
    self.initialProps = [:]

    let result = super.application(application, didFinishLaunchingWithOptions: launchOptions)
    NSLog("[AppDelegate] super.application(...) -> %@", result ? "true" : "false")
    return result
  }

  // MARK: - RCTBridgeDelegate / JS bundle location

  @objc
  override func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
      let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry",
        fallbackExtension: nil
      )
      NSLog("[AppDelegate] sourceURL(for:) (DEBUG) -> %@", url?.absoluteString ?? "nil")
      return url
    #else
      let url = self.bundleURL()
      NSLog("[AppDelegate] sourceURL(for:) (RELEASE) -> %@", url?.absoluteString ?? "nil")
      return url
    #endif
  }

  @objc
  override func bundleURL() -> URL! {
    #if DEBUG
      let url = RCTBundleURLProvider.sharedSettings().jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry",
        fallbackExtension: nil
      )
      NSLog("[AppDelegate] bundleURL() (DEBUG) -> %@", url?.absoluteString ?? "nil")
      return url
    #else
      if let updatesURL = AppController.sharedInstance.launchAssetUrl() {
        NSLog("[AppDelegate] bundleURL() (RELEASE) -> %@", updatesURL.absoluteString)
        return updatesURL
      }
      let url = Bundle.main.url(forResource: "main", withExtension: "jsbundle")
      if let url = url {
        NSLog("[AppDelegate] bundleURL() (RELEASE fallback) -> %@", url.absoluteString)
      } else {
        NSLog("[AppDelegate] bundleURL() (RELEASE fallback) -> nil (main.jsbundle not found)")
      }
      return url
    #endif
  }
}
