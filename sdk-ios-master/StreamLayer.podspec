Pod::Spec.new do |s|
    s.name         = "StreamLayer"
    s.version      = "8.22.43"
    s.summary      = "StreamLayer SDK"
    s.description  = "StreamLayer SDK public repo"
    s.license          = { :type => 'Proprietary', :text => 'StreamLayer License' }
    s.author           = { 'Kirill Kunst' => 'kirill@streamlayer.io' }
    s.homepage     = "https://github.com/StreamLayer/sdk-ios.git"
    s.source           = { :http => 'https://storage.googleapis.com/ios.streamlayer.io/32517/StreamLayerSDK.xcframework.zip' }
    s.vendored_frameworks = 'xcframeworks/StreamLayerSDK.xcframework'
    s.platform = :ios
    s.swift_version = "5.7"
    s.ios.deployment_target  = '14.0'
    s.ios.frameworks = 'UIKit', 'Foundation'
end
