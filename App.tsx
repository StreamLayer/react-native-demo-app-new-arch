/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Dimensions,
  Image,
  NativeEventEmitter,
  NativeModules,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  CenteredControlBar,
  DEFAULT_THEOPLAYER_THEME,
  PlayButton,
  SkipButton,
  UiContainer,
} from '@theoplayer/react-native-ui';

import {
  PlayerConfiguration,
  THEOplayer,
  THEOplayerView,
} from 'react-native-theoplayer';

import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createEventSession,
  getDemoEvents,
  initSdk,
  isUserAuthorized,
  StreamLayerView,
  StreamLayerViewConfiguration,
  StreamLayerViewNotificationFeature,
  StreamLayerViewOverlayLandscapeMode,
  useAnonymousAuth,
} from 'react-native-streamlayer-new-arch';

import { SOURCES } from './custom/SourceMenuButton';

type StreamLayerDemoEvent = any;

const { width } = Dimensions.get('screen');

export default function HomeScreen() {
  const [isPortrait, setPortrait] = useState<boolean>();
  const [player, setPlayer] = useState<THEOplayer | undefined>(undefined);
  const [events, setEvents] = useState<Array<StreamLayerDemoEvent>>();
  const [currentEventId, setCurrentEventId] = useState<string>();
  const [isInitializedState, setInitializedState] = useState(false);
  const viewRef = useRef<StreamLayerView>(null);
  const isPortraitRef = useRef<boolean>(isScreenPortrait());
  const [playerFrame, setPlayerFrame] = useState({
    x: 0,
    y: 0,
    width: width,
    height: 300,
  });

  function isScreenPortrait(): boolean {
    return Dimensions.get('window').height > Dimensions.get('window').width;
  }

  useEffect(() => {
    const emitter = new NativeEventEmitter(
      NativeModules.StreamLayerViewEventEmitter,
    );
    emitter.addListener('onNativeLBarStateChanged', event =>
      console.log('onNativeLBarStateChanged', event),
    );
    emitter.addListener('onNativeSideBarApplyContainerFrame', ev => {
      console.log('React native  sidebar frame event emitter:', ev);
      onSideBarApplyContainerFrame(ev);
    });
    setPortrait(isScreenPortrait());
    const initialize = async () => {
      try {
        checkInitialized();
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log(
        'screen height:',
        window.height,
        'screen width:',
        window.width,
      );
      const portrait = window.height > window.width;
      setPortrait(portrait);
      isPortraitRef.current = portrait;
      if (portrait) {
        setPlayerFrame({ x: 0, y: 0, width: width, height: 300 });
      } else {
        setPlayerFrame({
          x: 0,
          y: 0,
          width: window.width,
          height: window.height,
        });
      }
    });

    return () => subscription?.remove();
  });

  const checkInitialized = async () => {
    try {
      await initSdk({
        isLoggingEnabled: true,
        theme: 'Green',
        sdkKey:
          '68d91ab86f90aff8ec35b46f5553ad08a5f6a96b34fb7b8a83006292b63dc500',
      });
      checkAuth();
      loadDemoEvents();
      setInitializedState(true);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDemoEvents = useCallback(async () => {
    try {
      const events = await getDemoEvents('2022-01-01');
      setEvents(events);
      if (events !== undefined && events !== null && events.length > 0) {
        createEventSess(events[0].id);
      }
    } catch (e) {
      console.error('PlayerScreen loadDemoEvents error', e);
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('isAuth:', isUserAuthorized());
      if (!isUserAuthorized()) {
        console.log('is not authorized');
        await useAnonymousAuth();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createEventSess = async (id: string) => {
    console.log('event id:',id);
    try {
      await createEventSession(id);
      console.log(`Created a new event with id ${id}`);
      setCurrentEventId(id);
    } catch (e) {
      console.error(e);
    }
  };

  const onRequestStream = (id: string) => {
    createEventSess(id);
  };

  const onLBarStateChanged = (slideX: number, slideY: number) => {
    console.log('Lbar state change:', 'slideX', slideX, 'slideY', slideY);
  };

  const onRequestAudioDucking = (level: number) => {
    console.log('onRequestAudioDucking level=' + level);
  };

  const onDisableAudioDucking = () => {
    console.log('onDisableAudioDucking');
  };
  const onSideBarApplyContainerFrame = ({
    frame,
    cornerRadius,
  }: {
    frame: { x: number; y: number; width: number; height: number };
    cornerRadius: number;
  }) => {
    const ratio = PixelRatio.get();
    const frameDp = {
      x: frame.x / ratio,
      y: frame.y / ratio,
      width: frame.width / ratio,
      height: frame.height / ratio,
    };
    const cornerRadiusDp = cornerRadius / ratio;
    console.log(
      'onSideBarApplyContainerFrame react native method side',
      frameDp,
      'cornerRadius=',
      cornerRadiusDp,
    );

    // Guard against stale frames fired during orientation transition:
    // reject frames with zero/negative dimensions or frames whose dimensions
    // exceed the current screen bounds in the wrong axis (portrait frame in landscape).
    const currentWindow = Dimensions.get('window');
    const isCurrentlyPortrait = isPortraitRef.current;
    const frameIsPortraitSized = frameDp.height > frameDp.width;
    if (frameDp.width <= 0 || frameDp.height <= 0) {
      console.log('onSideBarApplyContainerFrame: ignoring invalid frame', frameDp);
      return;
    }
    if (isCurrentlyPortrait !== frameIsPortraitSized) {
      console.log('onSideBarApplyContainerFrame: ignoring stale frame from previous orientation', frameDp);
      return;
    }
    if (frameDp.width > currentWindow.width || frameDp.height > currentWindow.height) {
      console.log('onSideBarApplyContainerFrame: ignoring frame exceeding screen bounds', frameDp);
      return;
    }

    setPlayerFrame(frameDp);
  };

  const onSideBarReset = () => {
    console.log('onSideBarReset');
    const window = Dimensions.get('window');
    if (window.height > window.width) {
      setPlayerFrame({ x: 0, y: 0, width: width, height: 300 });
    } else {
      setPlayerFrame({ x: 0, y: 0, width: window.width, height: window.height });
    }
  };

  const streamLayerViewPlayer = {
    get volume() {
      return 0.0;
    },

    set volume(value) {},
  };

  const viewConfig = getViewConfig();

  const scrollItems: JSX.Element[] = [];
  if (events !== undefined && isPortrait) {
    events.forEach(event => {
      scrollItems.push(
        <Pressable
          key={event.id}
          onPress={() => createEventSess(event.id)}
          style={{ width: width, marginTop: 0 }}
        >
          <View
            style={{
              width: '100%',
              flexDirection: 'row',
              height: 70,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginTop: 5,
              borderRadius: 10,
              borderWidth: 0.3,
            }}
          >
            {event.previewUrl !== undefined && (
              <View
                style={{
                  marginLeft: 120,
                  height: 50,
                  flexDirection: 'row',
                  gap: 20,
                }}
              >
                <Text
                  style={{ fontSize: 12 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {event.title}
                </Text>
              </View>
            )}
          </View>

          {event.previewUrl !== undefined && (
            <View
              style={{
                marginLeft: 10,
                height: 50,
                flexDirection: 'row',
                gap: 20,
                position: 'absolute',
                top: 15,
                left: 10,
              }}
            >
              <Image
                source={{ uri: event.previewUrl }}
                style={styles.eventRowImage}
              />
            </View>
          )}
        </Pressable>,
      );
    });
  }

  const playerConfig: PlayerConfiguration = {
    license: undefined,
  };

  const onPlayerReady = (player: THEOplayer) => {
    setPlayer(player);

    player.autoplay = true;
    player.source = SOURCES[0].source;

    player.backgroundAudioConfiguration = {
      enabled: true,
      shouldResumeAfterInterruption: true,
    };

    player.pipConfiguration = {
      startsAutomatically: true,
      retainPipOnSourceChange: true,
    };
  };

  let currentEvent: StreamLayerDemoEvent | undefined;
  if (events !== undefined && currentEventId !== undefined) {
    currentEvent = events.find(event => {
      return event.id == currentEventId;
    });
  }

  const PortraitView = () => {
    return (
      <View
        style={{
          height: Dimensions.get('screen').height - 258,
          marginTop: 298,
          position: 'absolute',
          width: Dimensions.get('screen').width,
          alignItems: 'center',
          backgroundColor: 'lightgrey',
        }}
      >
        {currentEvent !== undefined && (
          <View style={{ width: '100%' }}>
            <Text style={{ fontSize: 25, marginLeft: 10 }}>
              {currentEvent.title}
            </Text>
          </View>
        )}
        <ScrollView
          style={{
            height: Dimensions.get('screen').height - 388,
            width: '100%',
          }}
        >
          {scrollItems}
          <View style={{ height: 100 }}></View>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ ...styles.container }}>
        {isPortrait && <PortraitView />}
        {isInitializedState ? (
          <View style={{ flex:1, borderWidth: 1, borderColor: 'red', }}>
            <THEOplayerView
              config={playerConfig}
              onPlayerReady={onPlayerReady}
              style={{
                width: playerFrame.width,
                height: playerFrame.height,
                top: playerFrame.y,
                left: playerFrame.x,
                paddingTop: 0,
              }}
            >
              {player !== undefined && (
                <UiContainer
                  theme={DEFAULT_THEOPLAYER_THEME}
                  player={player}
                  center={
                    <CenteredControlBar
                      left={<SkipButton skip={-10} />}
                      middle={<PlayButton />}
                      right={<SkipButton skip={10} />}
                    />
                  }
                />
              )}
            </THEOplayerView>
              <View style={{borderWidth:1,borderColor:'green',flex:1,zIndex:999}} pointerEvents="box-none">
                  <StreamLayerView
                      style={[StyleSheet.absoluteFillObject]}
                      config={viewConfig}
                      ref={viewRef}
                      applyWindowInsets={false}
                      onRequestStream={onRequestStream}
                      onLBarStateChanged={onLBarStateChanged}
                      onRequestAudioDucking={onRequestAudioDucking}
                      onDisableAudioDucking={onDisableAudioDucking}
                      onSideBarApplyContainerFrame={onSideBarApplyContainerFrame}
                      onSideBarReset={onSideBarReset}
                      player={streamLayerViewPlayer}
                  />
              </View>


          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: 'green' }} />
        )}
      </View>
    </SafeAreaView>
  );
}

function getViewConfig(): StreamLayerViewConfiguration {
  return {
    viewNotificationFeatures: new Array(
      StreamLayerViewNotificationFeature.Games,
      StreamLayerViewNotificationFeature.Chat,
      StreamLayerViewNotificationFeature.WatchParty,
      StreamLayerViewNotificationFeature.Twitter,
      StreamLayerViewNotificationFeature.Custom,
    ),
    isGamesPointsEnabled: true,
    isGamesPointsStartSide: true,
    isLaunchButtonEnabled: false,
    isMenuAlwaysOpened: true,
    isMenuLabelsVisible: true,
    isMenuProfileEnabled: true,
    isTooltipsEnabled: true,
    isWatchPartyReturnButtonEnabled: true,
    isWhoIsWatchingViewEnabled: true,
    isOverlayExpandable: true,
    overlayHeightSpace: 300,
    overlayWidth: 0,
    enableAllNotificationsAndroid: true,
    overlayLandscapeMode: StreamLayerViewOverlayLandscapeMode.Start,
    isSideBarForcingEnabled: true,
    isChatFeatureEnable: true,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventRowImage: {
    width: 100,
    height: 50,
  },
});
