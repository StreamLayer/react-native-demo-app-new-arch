//
//  ViewController.swift
//  SLRExamples
//
//  Created by Vadim Vitvitskii on 27.02.2025.
//

import UIKit

import StreamLayerSDK
import StreamLayerSDKPluginsWatchParty
import StreamLayerSDKPluginsGooglePAL


class ViewController: UIViewController {
  
  // The container for all of the content on the screen
  // Host should call `containerView.addSubview` instead of `view.addSubview`
  private lazy var containerView: UIView = {
    let view = UIView()
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }()
  
  private lazy var scrollView: UIScrollView = {
    let view = UIScrollView()
    view.contentInsetAdjustmentBehavior = .never
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }()
  
  private lazy var playerView: UIView = {
    let view = UIView()
    view.backgroundColor = .systemBlue
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }()
  
  private lazy var channelsView: UIView = {
    let view = UIView()
    view.backgroundColor = .systemMint
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }()
  
  // A widgetsViewController is a SDK UIViewController
  // This controller will manage overlays on the current screen
  private lazy var widgetsViewController: SLRWidgetsViewController = {
    let viewController = StreamLayer.createOverlay(
      mainContainerViewController: self,
      overlayDelegate: self,
      overlayDataSource: self,
      sideBarDelegate: self
    )
    viewController.view.translatesAutoresizingMaskIntoConstraints = false
    return viewController
  }()
  
  private var widgetsViewControllerView: UIView {
    widgetsViewController.view
  }
  
  private lazy var widgetsReferenceView: UIView = {
    let view = UIView()
    view.backgroundColor = .systemRed.withAlphaComponent(0.3)
    view.translatesAutoresizingMaskIntoConstraints = false
    return view
  }()
  
  private lazy var showOverlayButton: UIButton = {
    let button = UIButton()
    button.setTitle("Show overlay", for: .normal)
    button.addTarget(self, action: #selector(showOverlayAction), for: .touchUpInside)
    button.translatesAutoresizingMaskIntoConstraints = false
    return button
  }()

  private var topConstraint: NSLayoutConstraint?
  private var bottomConstraint: NSLayoutConstraint?
  private var trailingConstraint: NSLayoutConstraint?
  private var leadingConstraint: NSLayoutConstraint?

  override func viewDidLoad() {
    super.viewDidLoad()
    configureSLWatchPartyPlugin()
    configureSLGooglePALPlugin()
    setup()
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
    if isPad() {
      StreamLayer.setReferenceViewMode(
        .horizontal,
        view: widgetsReferenceView,
        scrollView: scrollView,
        shouldMoveToParentViewController: true
      )
    }
    
    view.addSubview(containerView)
    containerView.addSubview(scrollView)
    scrollView.addSubview(playerView)
    scrollView.addSubview(channelsView)
    scrollView.addSubview(widgetsReferenceView)
    
    widgetsViewController.willMove(toParent: self)
    addChild(widgetsViewController)
    view.addSubview(widgetsViewControllerView)
    widgetsViewController.didMove(toParent: self)

    let topConstraint = containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor)
    let leadingConstraint = containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor)
    let trailingConstraint = containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
    let bottomConstraint = containerView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
    self.topConstraint = topConstraint
    self.leadingConstraint = leadingConstraint
    self.trailingConstraint = trailingConstraint
    self.bottomConstraint = bottomConstraint
    
    NSLayoutConstraint.activate([
      topConstraint,
      leadingConstraint,
      trailingConstraint,
      bottomConstraint
    ])
    
    NSLayoutConstraint.activate([
      widgetsViewControllerView.topAnchor.constraint(equalTo: containerView.topAnchor),
      widgetsViewControllerView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
      widgetsViewControllerView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
      widgetsViewControllerView.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
    ])
    
    updateLayout()
  }
  
  private func updateLayout() {
    if isVerticalLayout() {
      makeVerticalLayout()
    } else {
      if isPad() {
        makeHorizontalLayoutPad()
      } else {
        makeHorizontalLayoutPhone()
      }
    }
  }

  private func makeVerticalLayout() {
    NSLayoutConstraint.deactivate(scrollView.constraints)
    NSLayoutConstraint.deactivate(playerView.constraints)
    NSLayoutConstraint.deactivate(channelsView.constraints)
    NSLayoutConstraint.deactivate(widgetsReferenceView.constraints)
    
    NSLayoutConstraint.activate([
      scrollView.topAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.topAnchor),
      scrollView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.bottomAnchor)
    ])
    
    NSLayoutConstraint.activate([
      playerView.topAnchor.constraint(equalTo: scrollView.topAnchor),
      playerView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      playerView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      playerView.bottomAnchor.constraint(equalTo: channelsView.topAnchor),
      playerView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
      playerView.heightAnchor.constraint(equalTo: scrollView.heightAnchor, multiplier: 0.4),
    ])
    
    NSLayoutConstraint.activate([
      channelsView.topAnchor.constraint(equalTo: playerView.bottomAnchor),
      channelsView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      channelsView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      channelsView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
      channelsView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
      channelsView.heightAnchor.constraint(equalToConstant: 1200)
    ])
    
    NSLayoutConstraint.activate([
      widgetsReferenceView.topAnchor.constraint(equalTo: playerView.bottomAnchor, constant: 16),
      widgetsReferenceView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -16),
      widgetsReferenceView.widthAnchor.constraint(equalToConstant: 450),
      widgetsReferenceView.centerXAnchor.constraint(equalTo: scrollView.centerXAnchor)
    ])
  }
  
  private func makeHorizontalLayoutPhone() {
    NSLayoutConstraint.deactivate(scrollView.constraints)
    NSLayoutConstraint.deactivate(playerView.constraints)
    NSLayoutConstraint.deactivate(channelsView.constraints)
    NSLayoutConstraint.deactivate(widgetsReferenceView.constraints)
    
    NSLayoutConstraint.activate([
      scrollView.topAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.topAnchor),
      scrollView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.bottomAnchor)
    ])
    
    NSLayoutConstraint.activate([
      playerView.topAnchor.constraint(equalTo: scrollView.topAnchor),
      playerView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      playerView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      playerView.bottomAnchor.constraint(equalTo: channelsView.topAnchor),
      playerView.heightAnchor.constraint(equalTo: scrollView.heightAnchor),
    ])
    
    NSLayoutConstraint.activate([
      channelsView.topAnchor.constraint(equalTo: playerView.bottomAnchor),
      channelsView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      channelsView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      channelsView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
      channelsView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
      channelsView.heightAnchor.constraint(equalToConstant: 1200),
    ])
    
    NSLayoutConstraint.activate([
      widgetsReferenceView.topAnchor.constraint(equalTo: playerView.topAnchor, constant: 16),
      widgetsReferenceView.leadingAnchor.constraint(equalTo: playerView.leadingAnchor, constant: 16),
      widgetsReferenceView.bottomAnchor.constraint(equalTo: playerView.bottomAnchor, constant: -16),
      widgetsReferenceView.widthAnchor.constraint(equalToConstant: 300)
    ])
  }
  
  private func makeHorizontalLayoutPad() {
    NSLayoutConstraint.deactivate(scrollView.constraints)
    NSLayoutConstraint.deactivate(playerView.constraints)
    NSLayoutConstraint.deactivate(channelsView.constraints)
    NSLayoutConstraint.deactivate(widgetsReferenceView.constraints)
    
    NSLayoutConstraint.activate([
      scrollView.topAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.topAnchor),
      scrollView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
      scrollView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
      scrollView.bottomAnchor.constraint(equalTo: containerView.safeAreaLayoutGuide.bottomAnchor)
    ])
    
    NSLayoutConstraint.activate([
      playerView.topAnchor.constraint(equalTo: scrollView.topAnchor),
      playerView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: 180),
      playerView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -180),
      playerView.bottomAnchor.constraint(equalTo: channelsView.topAnchor),
      playerView.heightAnchor.constraint(equalTo: playerView.widthAnchor, multiplier: 9/16),
    ])
    
    NSLayoutConstraint.activate([
      channelsView.topAnchor.constraint(equalTo: playerView.bottomAnchor),
      channelsView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
      channelsView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
      channelsView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
      channelsView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),
      channelsView.heightAnchor.constraint(equalToConstant: 1200),
    ])
    
    NSLayoutConstraint.activate([
      widgetsReferenceView.topAnchor.constraint(equalTo: playerView.topAnchor, constant: 16),
      widgetsReferenceView.leadingAnchor.constraint(equalTo: playerView.leadingAnchor, constant: 16),
      widgetsReferenceView.bottomAnchor.constraint(equalTo: playerView.bottomAnchor, constant: -16),
      widgetsReferenceView.widthAnchor.constraint(equalToConstant: 450)
    ])
  }
  
  private func isPad() -> Bool {
    return UIDevice.current.userInterfaceIdiom == .pad
  }
  
  private func isVerticalLayout() -> Bool {
    return view.bounds.width < view.bounds.height
  }
  
  private func configureSLWatchPartyPlugin() {
    let plugin = SLRWatchPartyPlugin()
    StreamLayer.registerWatchPartyPlugin(plugin)
  }
  
  private func configureSLGooglePALPlugin() {
    let plugin = SLRGooglePALPlugin()
    StreamLayer.registerPALPlugin(plugin)
  }
  
  @objc
  private func showOverlayAction() {
    do {
      try StreamLayer.showOverlay(
        overlayType: .games,
        mainContainerViewController: self,
        overlayDataSource: self,
        sideBarDelegate: self,
        dataOptions: ["eventId": ""]
      )
    } catch {
      // handle error
    }
  }
}

extension ViewController: SLROverlayDataSource {
  // Example overlay height calculation
  // It will depend on your final confuguration and where the overlay should be placed in the vertical orientation.
  func overlayHeight() -> CGFloat {
    if isPad() && !isVerticalLayout() {
      return widgetsReferenceView.frame.height
    } else {
      return UIScreen.main.bounds.height - playerView.frame.height - view.safeAreaInsets.top - view.safeAreaInsets.bottom
    }
  }
}

extension ViewController: SLROverlayDelegate {}

// Changes constraints
// Also, any other layout method could be used
extension ViewController: SLRSideBarDelegate {
  func sideBarApplyContainerFrame(_ frame: CGRect, cornerRadius: CGFloat) {
    containerView.clipsToBounds = true
    containerView.layer.masksToBounds = true
    containerView.layer.cornerRadius = cornerRadius
    topConstraint?.constant = frame.minY
    leadingConstraint?.constant = frame.minX
    trailingConstraint?.constant = -(view.frame.width - (frame.minX + frame.width))
    bottomConstraint?.constant = -(view.frame.height - (frame.minY + frame.height))
  }

  func sideBarReset() {
    topConstraint?.constant = 0
    leadingConstraint?.constant = 0
    trailingConstraint?.constant = 0
    bottomConstraint?.constant = 0
  }
}

extension UIView {
  public func removeAllConstraints() {
    var _superview = self.superview
    
    while let superview = _superview {
      for constraint in superview.constraints {
        
        if let first = constraint.firstItem as? UIView, first == self {
          superview.removeConstraint(constraint)
        }
        
        if let second = constraint.secondItem as? UIView, second == self {
          superview.removeConstraint(constraint)
        }
      }
      
      _superview = superview.superview
    }
    
    self.removeConstraints(self.constraints)
    self.translatesAutoresizingMaskIntoConstraints = true
  }
}
