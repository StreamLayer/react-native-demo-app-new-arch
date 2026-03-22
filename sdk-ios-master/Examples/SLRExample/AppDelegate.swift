//
//  AppDelegate.swift
//  SLRExamples
//
//  Created by Vadim Vitvitskii on 27.02.2025.
//

import UIKit
import StreamLayerSDK

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    initiateStreamLayer()
    return true
  }
  
  // MARK: UISceneSession Lifecycle
  
  func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
    return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
  }
  
  func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {}
  
  // Pefrom inital SDK configuration
  // Only most useful options in this example and not all of them needs to be configured
  // Choose based on your needs
  func initiateStreamLayer() {
    /// isAlwaysOpen: Sub menu of SL can be opened by default for some reasons.
    /// Set this flag to true, and the menu will always be showed in portrait orientation.
    StreamLayer.config.isAlwaysOpened = false
    
    /// phoneContactsSyncEnabled: For disable access to contacts from SL SDK, you can set this flag to false
    StreamLayer.config.phoneContactsSyncEnabled = true
    
    // whoIsWatchingEnabled: WW Button functionality. If set to true, ww button will show. Default is true.
    StreamLayer.config.whoIsWatchingEnabled = true
    
    /// Is profile overlay visible in the menu
    StreamLayer.config.isUserProfileOverlayHidden = false
    
    /// Styling functionality. Default is blue.
    StreamLayer.config.appStyle = .blue
    
    /// Visible notification mode. You can combine/disable/enable different modes as you need.
    StreamLayer.config.notificationsMode = [.all]
    
    /// A boolean value that determines whether tutorials should appear or not. Default: true
    StreamLayer.config.tooltipsEnabled = true
    
    /// Sidebar modes:
    /// – overlay - always show overlays
    /// – sidebar - always show sidebar
    StreamLayer.config.overlayMode = .sidebar

    /// Should safe areas for sidebar be enabled
    /// Adds more insets on the sides
    StreamLayer.config.isSideBarSafeAreasEnabled = false

    /// Is ability to expand overlay enabled
    StreamLayer.config.isExpandableOverlayEnabled = true
    
    /// Enabled accessibility fonts in SDK
    /// Will use Apple font system and reflect Accessibility settings for fonts
    /// Need to restart the app to have an effect
    StreamLayer.config.isAccessibilityFontsEnabled = false
    
    /// The setting that overrides autoclose behavour of the promotion from the studio
    /// If set `true` after timer ends with enabled autoclose in the card from studio
    /// will always show X instead of closing the overlay
    StreamLayer.config.alwaysXToClose = false
    
    /// Enable SLChat feature
    /// With this flag such features as invites, friends, leaderboards will be enabled or disabled.
    StreamLayer.config.isChatFeatureEnable = true
    
    // Set your api key and check other options
    // delegate: - used for handling invites and custom auth screen
    // loggerDelegate: - if logs from sdk are needed, useful for debug
    StreamLayer.initSDK(with: "YOUR_API_KEY", delegate: self, loggerDelegate: self)
    
    // Authorisation using host bypass token.
    // Should be placed where host can obtain it.
    // try await StreamLayer.setAuthorizationBypass(token: "", schema: "")
    
    // Auth for testing
    Task.detached {
      do {
        try await StreamLayer.useAnonymousAuth()
      } catch {
        print(error)
      }
    }
  }
}


extension AppDelegate: SLROverlayLoggerDelegate {
  func receiveLogs(userInfo: String) {
    print("app_log: \(#function), INFO: \(userInfo)")
  }
  
  func sendLogdata(userInfo: String) {
    print("app_log: \(#function), INFO: \(userInfo)")
  }
}

extension AppDelegate {
  func application(_ application: UIApplication,
                   supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    .allButUpsideDown
  }
}

extension AppDelegate: StreamLayerDelegate {
  func inviteHandled(invite: StreamLayerSDK.SLRInviteData, completion: @escaping (Bool) -> Void) {}
  
  func requireAuthentication(nameInputOptions: StreamLayerSDK.StreamLayer.Auth.SLRRequireAuthOptions, completion: @escaping (Bool) -> Void) {}
}
