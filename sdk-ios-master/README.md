# StreamLayer iOS SDK

## General integration

### SDK configuration
```Swift
@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    initiateStreamLayer()
    return true
  }

  // Pefrom inital SDK configuration
  // Only most useful options in this example and not all of them needs to be configured
  // Choose based on your needs
  func initiateStreamLayer() {
    /// isAlwaysOpen: Sub menu of SL can be opened by default.
    /// Set this flag to true, and the menu will always be showed in portrait orientation.
    StreamLayer.config.isAlwaysOpened = false
    
    // whoIsWatchingEnabled: WW Button functionality. If set to true, ww button will show. Default is true.
    StreamLayer.config.whoIsWatchingEnabled = true
    
    /// Is profile overlay visible in the menu
    StreamLayer.config.isUserProfileOverlayHidden = true
    
    /// Styling functionality. Default is blue.
    StreamLayer.config.appStyle = .blue
    
    /// Visible notification mode. You can combine/disable/enable different modes as you need.
    StreamLayer.config.notificationsMode = [.all]
    
    /// A boolean value that determines whether tutorials should appear or not. Default: true
    StreamLayer.config.tooltipsEnabled = true
    
    /// Determine if LBar feature enabled to show overlays in LBar by default
    /// `mainContainerViewController` and `lbarDelegate` must be passed in the `createOverlay` or `showOverlay` methods in order to enable other features to apper in the LBar
    /// even if `isLBarEnabled == false`
    StreamLayer.config.isLBarEnabled = false
    
    /// Lbar modes:
    /// – full - all sides of lbar will appear
    /// – fullFlexible - bottom side will appear only if there is content in it
    StreamLayer.config.lbarMode = .full
    
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

    // OPTIONAL
    // Not needed for only ads integrations
    // Authorisation using host bypass token. 
    // Should be placed where host can obtain the token.
    // https://docs.streamlayer.io/docs/ios_authentication-forwarding
    try await StreamLayer.setAuthorizationBypass(token: "", schema: "")
  }
}
```

### UI Configuration

#### Base example

Main feature of the SDK is the overlay. 
Overlay implemented with a `UIViewController` and the host must place this `UIViewController` above of it's UIViewController hierarchy where SDK will be implemented.

```Swift
class ViewController: UIViewController {

    ...

    // A widgetsViewController is a SDK UIViewController
    // This controller will manage overlays on the current screen
    private lazy var widgetsViewController: SLRWidgetsViewController = {
        let viewController = StreamLayer.createOverlay(
            mainContainerViewController: self,
            overlayDelegate: self,
            overlayDataSource: self,
            // Optional, see LBar implementation if needed.
            lbarDelegate: self
        )
        viewController.view.translatesAutoresizingMaskIntoConstraints = false
        return viewController
    }()

    private var widgetsViewControllerView: UIView {
        widgetsViewController.view
    }

  ...

    override func viewDidLoad() {
        super.viewDidLoad()
        setup()
        // Create the session to make connections with events in the StreamLayer studio
        // Must be switched with stream/event change
        StreamLayer.createSession(for: "YOUR_SESSION_ID")
    }

    // Call StreamLayer.setNeedsLayout() when the parent is layouted
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        StreamLayer.setNeedsLayout()
    }
    
    // Call StreamLayer.setNeedsLayout() when the parent is layouted
    override func viewWillTransition(to size: CGSize, with coordinator: any UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        coordinator.animate { [weak self] _ in
            self?.updateLayout()
        } completion: { _ in
            StreamLayer.setNeedsLayout()
        }
    }

    private func setup() {
        */ Host app configuration code */

        // In the end of the configuration add widgetsViewController

        widgetsViewController.willMove(toParent: self)
        addChild(widgetsViewController)
        view.addSubview(widgetsViewControllerView)
        widgetsViewController.didMove(toParent: self)

        NSLayoutConstraint.activate([
            widgetsViewControllerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            widgetsViewControllerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            widgetsViewControllerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            widgetsViewControllerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
    }
}

extension ViewController: SLROverlayDataSource {
    // Example overlay height calculation
    // It will depend on your final confuguration and where the overlay should be placed in the vertical orientation.
    func overlayHeight() -> CGFloat {
        return UIScreen.main.bounds.height - playerView.frame.height - view.safeAreaInsets.top - view.safeAreaInsets.bottom
    }
}
```

#### With LBar

LBar is a feature that will show some or all overlays inside the box that doesn't cover main screen in horizontal orientation. 

If lbar is configured by the host, but the config property is set to `false` then overlays will be presented in default behaviour as overlays, but some types of configurable cards from the studio that have lbar type will be shown as lbar.

Previous configuration is required.

```Swift
class ViewController: UIViewController {

    // The container for all of the content on the screen
    // Host should call `containerView.addSubview` instead of `view.addSubview`
    private lazy var containerView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private var trailingContstraint: NSLayoutConstraint?
    private var bottomConstraint: NSLayoutConstraint?

    private func setup() {
        // If set true all overlays will appear in the lbar
        // If set false then only cards from studio that were setup for lbar UI will appear in lbar
        StreamLayer.config.isLBarEnabled = true/false
        ...
        view.addSubview(containerView)
        let trailingContstraint = containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        let bottomConstraint = containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        self.trailingContstraint = trailingContstraint
        self.bottomConstraint = bottomConstraint
    
        NSLayoutConstraint.activate([
            containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            trailingContstraint,
            bottomConstraint
        ])
        ...
    }
}

// Changes right and bottom constraint 
// Also, any other layout method could be used
extension ViewController: SLRLBarDelegate {
    func moveRightSide(for points: CGFloat) {
        trailingContstraint?.constant = -points
    }
  
    func moveBottomSide(for points: CGFloat) {
        bottomConstraint?.constant = -points
    }
}
```

#### Reference view mode

Reference view mode could be useful if host needs the overlay to be placed in particular place in the hosts hierarchy, also it supports UIScrollView, so the overlay could be scrolled too.

Previous configuration is required.

```Swift
class ViewController: UIViewController {

    ...

    private lazy var widgetsReferenceView: UIView = {
        let view = UIView()
        view.translatesAutoresizingMaskIntoConstraints = false
        return view
    }()

    private func setup() {
        /// Sets custom positioning of the overlay based on referenceView position and mode
        /// Must be called before `createOverlay` or `showOverlay` calls
        /// - Parameters:
        ///   - mode: Choose where overlay will be handled as a reference
        ///   - view: Reference view for the overlay to be presented over or in
        ///   - scrollView: Needed to move overlay on scroll when in reference mode without moving to the parent, won't be handled if no scrollView is passes
        ///   - shouldMoveToParentViewController: Determine whether overlay must be placed in host hierarchy, might be usefull in some cases with complex layouts
        StreamLayer.setReferenceViewMode(
            .all/.vertical/.horizontal,
            view: widgetsReferenceView,
            scrollView: scrollView,
            shouldMoveToParentViewController: false
        )

      ...

        scrollView.addSubview(widgetsReferenceView)

        NSLayoutConstraint.activate([
            widgetsReferenceView.topAnchor.constraint(equalTo: playerView.topAnchor, constant: 16),
            widgetsReferenceView.leadingAnchor.constraint(equalTo: playerView.leadingAnchor, constant: 16),
            widgetsReferenceView.bottomAnchor.constraint(equalTo: playerView.bottomAnchor, constant: -16),
            widgetsReferenceView.widthAnchor.constraint(equalToConstant: 450)
        ])
    }

    ...
}
```

#### Show overlay without menu

SDK is able to show any overlay without adding its menu to the host.

Previous configuration is required.

```Swift
class ViewController: UIViewController {

    ...

    private lazy var showOverlayButton: UIButton = {
        let button = UIButton()
        button.setTitle("Show overlay", for: .normal)
        button.addTarget(self, action: #selector(showOverlayAction), for: .touchUpInside)
        button.translatesAutoresizingMaskIntoConstraints = false
        return button
    }()

    private func setup() {
        // Disable controlls and add showOverlayButton.
        // For hide launchButton configure StreamLayer.config.isAlwaysOpened = true
        widgetsViewController.hideControls = true
        ...
    }

    @objc
    private func showOverlayAction() {
        do {
            try StreamLayer.showOverlay(
                overlayType: .games,
                mainContainerViewController: self,
                overlayDataSource: self,
                lbarDelegate: self,
                dataOptions: ["eventId": ""]
            )
        } catch {
            // handle error
        }
  }

    ...

}
```

### Plugins

Plugins are optional. 

Install only if you need the feature they implement.

#### Watch Party Plugin

Steps to integrate Watch Party plugin into the app:

– Install latest version of [StreamLayer Plugins package](https://github.com/StreamLayer/sdk-ios-plugins) and add into your project

– Add `StreamLayerSDKWatchParty` framework in your project settings under `General` tab in `Frameworks, Libraries and Embedded Content` section

– Add `StreamLayerSDKPluginsWatchParty` framework in your project settings under `General` tab in `Frameworks, Libraries and Embedded Content` section

– Make changes in your code before SDK configuration:

```Swift
import StreamLayerSDKPluginsWatchParty

class ViewController: UIViewController {

    ...

    override func viewDidLoad() {
        super.viewDidLoad()
        configureSLWatchPartyPlugin()
    }

    ...

    private func configureSLWatchPartyPlugin() {
        let plugin = SLRWatchPartyPlugin()
        StreamLayer.registerWatchPartyPlugin(plugin)
    }
}
```

#### Google Ads Manager Plugin

Steps to integrate Google Ads Manager plugin into the app:

– Install latest version of [StreamLayer Plugins package](https://github.com/StreamLayer/sdk-ios-plugins) and add into your project

– Add `StreamLayerSDKGooglePAL` framework in your project settings under `General` tab in `Frameworks, Libraries and Embedded Content` section

– Add `StreamLayerSDKPluginsGooglePAL` framework in your project settings under `General` tab in `Frameworks, Libraries and Embedded Content` section

– Make changes in your code before SDK configuration:

```Swift
import StreamLayerSDKPluginsGooglePAL

class ViewController: UIViewController {

    ...

    override func viewDidLoad() {
        super.viewDidLoad()
        configureSLGooglePALPlugin()
    }

    ...

    private func configureSLGooglePALPlugin() {
        let plugin = SLRGooglePALPlugin()
        StreamLayer.registerPALPlugin(plugin)
    }
}
```

### SDK Configuration Options

#### StreamLayer.config general

Below is a summary table of key configuration properties provided by the StreamLayer SDK.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `isAlwaysOpened` | `Bool` | `false` | Keep submenu permanently visible in portrait orientation. |
| `whoIsWatchingEnabled` | `Bool` | `true` | Enable the "Who is Watching" button functionality. |
| `isUserProfileOverlayHidden` | `Bool` | `true` | Control visibility of user profile overlay. |
| `appStyle` | `enum` | `.blue` | Set the color style for SDK UI elements. |
| `notificationsMode` | `Array` | `[.all]` | Determine types of notifications displayed. |
| `tooltipsEnabled` | `Bool` | `true` | Enable or disable tooltips/tutorials. |
| `isLBarEnabled` | `Bool` | `true` | Enable LBar overlay functionality by default. |
| `lbarMode` | `enum` | `.full` | Set display mode for LBar overlays. |
| `isExpandableOverlayEnabled` | `Bool` | `true` | Enable overlay expansion capabilities. |
| `isAccessibilityFontsEnabled` | `Bool` | `false` | Apply Apple's accessibility font system. |
| `alwaysXToClose` | `Bool` | `false` | Show 'X' button instead of auto-closing overlay after timer expiration. |
| `isChatFeatureEnable` | `Bool` | `false` | Enable or disable chat-related features like friends, invites and leaderboards. Affects games, watch party, deeplinks, who is watching features. |

#### StreamLayer.config Games

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `triviaBalanceButtonVerticalCustomPadding` | `UIEdgeInsets` | `.zero` | Inset for trivia balanse button in vertical orientation |
| `triviaBalanceButtonHorizontalCustomPadding` | `UIEdgeInsets` | `.zero` |  Inset for trivia balanse button in horizontal orientation |
| `gamificationOptions` | `struct` | `SLRGamificationOptions(globalLeaderBoardEnabled: false, invitesEnabled: true, isOnboardingEnabled: true, showGamificationNotificationOnboarding: true)` | General settings for gamification feature |
| `invitesEnable` | `Bool` | `true` | Enables feature for invites, creating invites link and show invites views |

#### StreamLayer.config Watch Party

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enableWatchPartyHistoryList` | `Bool` | `true` | Determines whether watch partys history is available |
| `enableWatchPartyDragAndDrop` | `Bool` | `true` | Determines whether user cells in landscape should be able to move by the user. |
| `wpStatusViewTopOffset` | `CGFloat` | `0` | Offset for Watch Party Status View when WP is collapsed |
| `watchPartyLandscapeInset` | `UIEdgeInsets` | `.zero` | Insets for Watch Party in the landscape mode |
| `watchPartyStatusViewContainerLandscape` | `UIView` | `nil` | Container where Watch Party minified status view will be added, in most cases it's a player view of the host app |

#### SDK Overlay Delegate 

Delegate method might be used by the host according to the final configuration. Some methods are not needed in some cases. All methods are optional.

```Swift
extension ViewController: SLROverlayDelegate {
  /// Invoked to initiate audio-ducking. Expected behaviour is to reduce output volume of the
  /// video player to enable comfortable voice call environment
  func requestAudioDucking(_ mute: Bool)

  /// Invoked to signal that audio ducking is not required. Expected behaviour is to restore volume levels
  /// to where they were at the time of ducking request
  func disableAudioDucking()

  /// Requests host-app to configure shared audio session for
  /// a specific activity. We support voice calls & audio notifications
  /// Each time before audio session is used this method would be called to
  /// notify host application about the need to setup appropriate audio session
  /// When an existing audio session is already active - it must be a noop
  ///
  /// - Parameter type: requested session type
  func prepareAudioSession(for type: SLRAudioSessionType)

  /// When StreamLayer is done playing audio or recording voice this method
  /// would be invoked to provide a hint for the app to change current audio session
  /// settings
  /// - Parameter type: requested session type
  func disableAudioSession(for type: SLRAudioSessionType)

  /// This method must return custom text for a share message that is used
  /// to invite other people to use the app
  func shareInviteMessage() -> String

  /// Used when pinging your friends from who is watching quick access menu
  func waveMessage() -> String

  /// User requested to switch video stream through StreamLayer SDK interface
  /// You are required to react to it by changing video feed
  func switchStream(to streamId: String)

  /// Pause the stream video
  func pauseVideo(_ userInitiated: Bool)

  /// Play the stream video
  func playVideo(_ userInitiated: Bool)

  /// Callback when volume changed not from user interaction WP only
  var onPlayerVolumeChange: (() -> Void)? { get set }

  /// Change video player volume in range from 0.0 to 1.0.
  /// Note that volume of a video player is a value relative to general audio output.
  func setPlayerVolume(_ volume: Float)

  /// Video player volume in range from 0.0 to 1.0.
  func getPlayerVolume() -> Float

  /// Inform the host app to display a custom view of the Return WP badge.  WP only
  func onReturnToWP(isActive: Bool)

  /// It takes an SLRActionClicked parameter and returns a boolean value.
  /// - Parameters:
  ///   - action: An SLRActionClicked object representing the action that was clicked.
  /// - Returns: A boolean value indicating whether the action was handled successfully.
  @MainActor
  func handleActionClicked(_ action: SLRActionClicked) async -> Bool

  /// It takes an SLRActionShown parameter and does not return a value.
  /// - Parameter action: An SLRActionShown object representing the action that was shown.
  func handleActionShown(_ action: SLRActionShown)
}
```

| Method | Purpose | Expected Host Action |
|--------|---------|----------------------|
| `requestAudioDucking(_ mute: Bool)` | Initiate audio-ducking to reduce volume. | Reduce player audio volume to enhance voice call clarity or ad video starts playing. |
| `disableAudioDucking()` | Restore normal audio levels after ducking. | Restore previous audio volume settings. |
| `prepareAudioSession(for type: SLRAudioSessionType)` | Configure audio session for voice calls or notifications. | Set up `AVAudioSession` based on the requested type. |
| `disableAudioSession(for type: SLRAudioSessionType)` | Revert audio session settings after use. | Reset or restore the audio session configuration. |
| `shareInviteMessage() -> String` | Provide custom text for invitation sharing. | Return a custom invitation message. |
| `waveMessage() -> String` | Provide custom message for 'wave' feature. | Return a message used when interacting via "Who is Watching." |
| `switchStream(to streamId: String)` | User selects different video stream. | Load and play the selected stream. |
| `pauseVideo(_ userInitiated: Bool)` | Pause video playback. | Pause currently playing video. |
| `playVideo(_ userInitiated: Bool)` | Resume video playback. | Resume playback if paused. |
| `onPlayerVolumeChange: (() -> Void)?` | Volume changed internally (Watch Party only). | Update internal player state accordingly. |
| `setPlayerVolume(_ volume: Float)` | Change player volume (0.0 to 1.0). | Adjust video player's audio output level. |
| `getPlayerVolume() -> Float` | Get current player volume. | Return the current volume level of the video player. |
| `onReturnToWP(isActive: Bool)` | Manage visibility of "Return to Watch Party" badge. | Show/hide WP badge based on active state. |
| `handleActionClicked(_ action: SLRActionClicked) async -> Bool` | Handle specific user actions. | Implement custom response logic and indicate success. |
| `handleActionShown(_ action: SLRActionShown)` | Track when specific actions are displayed. | Log or track action exposure metrics. |

## Troubleshooting

Here are common issues you might encounter during SDK integration and how to resolve them:

### Overlay not displaying correctly

Ensure `StreamLayer.setNeedsLayout()` is called appropriately after view changes, layout updates, or rotations.

### Authorization issues

Verify that your bypass token and schema are correct and match the values provided by your backend or StreamLayer studio.

### Delegate methods not triggered

Double-check that delegates are properly assigned during SDK initialization or overlay creation.

For further support, please refer to [StreamLayer Support](https://docs.streamlayer.io/docs/).

## Resources and Examples

For practical implementation references and examples, visit:

- [Example code](https://github.com/StreamLayer/sdk-ios/tree/master/Example)
- [StreamLayer GitHub Repository](https://github.com/streamlayer/sdk-ios)
