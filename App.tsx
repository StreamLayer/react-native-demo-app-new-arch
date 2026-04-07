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
  Platform,
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

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

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
import { SDK_KEY } from './config';

type StreamLayerDemoEvent = any;

type StreamLayerViewScreenSize = {
  topMargin: number;
  bottomMargin: number;
  startMargin: number;
  endMargin: number;
  playerMinWidth: number;
  playerHeight: number;
  verticalBias: number;
  playerCornerRadius: number;
};

const { width } = Dimensions.get('screen');

export default function HomeScreen() {
  const [isPortrait, setPortrait] = useState<boolean>();
  const [player, setPlayer] = useState<THEOplayer | undefined>(undefined);
  const [events, setEvents] = useState<Array<StreamLayerDemoEvent>>();
  const [currentEventId, setCurrentEventId] = useState<string>();
  const [isInitializedState, setInitializedState] = useState(false);
  const insets = useSafeAreaInsets();
  const viewRef = useRef<StreamLayerView>(null);
  const isPortraitRef = useRef<boolean>(isScreenPortrait());
  const [playerFrame, setPlayerFrame] = useState({
    x: 0,
    y: 0,
    width: width,
    height: 300,
  });
  const [screenSizeState, setScreenSizeState] =
    useState<StreamLayerViewScreenSize>({
      topMargin: 0,
      bottomMargin: 0,
      startMargin: 0,
      endMargin: 0,
      playerMinWidth: width,
      playerHeight: 300,
      verticalBias: 0,
      playerCornerRadius: 0,
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
        sdkKey: SDK_KEY,
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
    console.log('event id:', id);
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
    const frameDp = {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
    };
    const cornerRadiusDp = cornerRadius;
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
      console.log(
        'onSideBarApplyContainerFrame: ignoring invalid frame',
        frameDp,
      );
      return;
    }
    if (isCurrentlyPortrait !== frameIsPortraitSized) {
      console.log(
        'onSideBarApplyContainerFrame: ignoring stale frame from previous orientation',
        frameDp,
      );
      return;
    }
    if (
      frameDp.width > currentWindow.width ||
      frameDp.height > currentWindow.height
    ) {
      console.log(
        'onSideBarApplyContainerFrame: ignoring frame exceeding screen bounds',
        frameDp,
      );
      return;
    }

    setPlayerFrame(frameDp);
  };
  const onScreenSizeChanged = (size: StreamLayerViewScreenSize) => {
    setScreenSizeState(size);
  };

  const onSideBarReset = () => {
    console.log('onSideBarReset');
    const window = Dimensions.get('window');
    if (window.height > window.width) {
      setPlayerFrame({ x: 0, y: 0, width: width, height: 300 });
    } else {
      setPlayerFrame({
        x: 0,
        y: 0,
        width: window.width,
        height: window.height,
      });
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
          style={styles.eventPressable}
        >
          <View style={styles.eventRow}>
            {event.previewUrl !== undefined && (
              <View style={styles.eventTextContainer}>
                <Text
                  style={styles.eventTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {event.title}
                </Text>
              </View>
            )}
          </View>

          {event.previewUrl !== undefined && (
            <View style={styles.eventImageContainer}>
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
        style={[
          styles.portraitContainer,
          {
            height: Dimensions.get('screen').height - 258,
            width: Dimensions.get('screen').width,
          },
        ]}
      >
        {currentEvent !== undefined && (
          <View style={styles.currentEventContainer}>
            <Text style={styles.currentEventTitle}>{currentEvent.title}</Text>
          </View>
        )}
        <ScrollView
          style={[
            styles.portraitScrollView,
            { height: Dimensions.get('screen').height - 388 },
          ]}
        >
          {scrollItems}
          <View style={styles.scrollViewSpacer} />
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.container}>
        {isPortrait && (
          <SafeAreaView
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
          >
            <PortraitView />
          </SafeAreaView>
        )}
        {isInitializedState ? (
          <>
            <View
              pointerEvents="box-none"
              style={[
                styles.playerContainer,
                Platform.OS === 'android'
                  ? {
                      width: screenSizeState.playerMinWidth,
                      height: screenSizeState.playerHeight,
                      top: screenSizeState.topMargin,
                      left: screenSizeState.startMargin,
                    }
                  : {
                      width: playerFrame.width,
                      height: playerFrame.height,
                      top: playerFrame.y,
                      left: playerFrame.x,
                    },
              ]}
            >
              <THEOplayerView
                config={playerConfig}
                onPlayerReady={onPlayerReady}
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
            </View>
            <View
              style={[
                isPortrait
                  ? [styles.streamLayerPortraitWrapper, { top: insets.top }]
                  : StyleSheet.absoluteFill,
              ]}
            >
              <StreamLayerView
                style={[StyleSheet.absoluteFill]}
                config={viewConfig}
                ref={viewRef}
                applyWindowInsets={false}
                onRequestStream={onRequestStream}
                onLBarStateChanged={onLBarStateChanged}
                onRequestAudioDucking={onRequestAudioDucking}
                onDisableAudioDucking={onDisableAudioDucking}
                onSideBarApplyContainerFrame={onSideBarApplyContainerFrame}
                onScreenSizeChanged={onScreenSizeChanged}
                onSideBarReset={onSideBarReset}
                player={streamLayerViewPlayer}
              />
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer} />
        )}
      </View>
    </View>
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
  portraitContainer: {
    marginTop: 298,
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'lightgrey',
  },
  currentEventContainer: {
    width: '100%',
  },
  currentEventTitle: {
    fontSize: 25,
    marginLeft: 10,
  },
  portraitScrollView: {
    width: '100%',
  },
  scrollViewSpacer: {
    height: 100,
  },
  playerContainer: {
    position: 'absolute',
  },
  streamLayerPortraitWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'green',
  },
  eventPressable: {
    width: width,
    marginTop: 0,
  },
  eventRow: {
    width: '100%',
    flexDirection: 'row',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 5,
    borderRadius: 10,
    borderWidth: 0.3,
  },
  eventTextContainer: {
    marginLeft: 120,
    height: 50,
    flexDirection: 'row',
    gap: 20,
  },
  eventTitle: {
    fontSize: 12,
  },
  eventImageContainer: {
    marginLeft: 10,
    height: 50,
    flexDirection: 'row',
    gap: 20,
    position: 'absolute',
    top: 15,
    left: 10,
  },
  eventRowImage: {
    width: 100,
    height: 50,
  },
});
