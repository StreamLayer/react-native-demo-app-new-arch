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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  CenteredControlBar,
  DEFAULT_THEOPLAYER_THEME,
  PlayButton,
  SkipButton,
  UiContainer
} from '@theoplayer/react-native-ui';

import {
  PlayerConfiguration,
  THEOplayer,
  THEOplayerView
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
  useAnonymousAuth
} from 'react-native-streamlayer-new-arch';

import { SOURCES } from './custom/SourceMenuButton';


type StreamLayerDemoEvent = any

class LBarState {
  slideX: number;
  slideY: number;

  constructor(slideX: number, slideY: number) {
      this.slideX = slideX
      this.slideY = slideY
  }
}

const Width = Dimensions.get('screen').width;

export default function HomeScreen() {

  const [isPortrait, setPortrait] = useState<boolean>();
  const [player, setPlayer] = useState<THEOplayer | undefined>(undefined);
  const [lbarState, setLbarState] = useState(new LBarState(0, 0));
  const [events, setEvents] = useState<Array<StreamLayerDemoEvent>>()
  const [currentEventId, setCurrentEventId] = useState<String>()
  const [isInitializedState, setInitializedState] = useState(false);
  const viewRef = useRef<StreamLayerView>(null);

  function isScreenPortrait(): boolean {
    return Dimensions.get('window').height > Dimensions.get('window').width
  }

  useEffect(() => {

      const emitter = new NativeEventEmitter(NativeModules.RCTStreamLayerModuleView);
      emitter.addListener('emitOnLBarStateChanged',(event) => console.log(event));
          
    setPortrait(isScreenPortrait())
    const initialize = async () => {

        try {
            checkInitialized();
        } catch (error) {
            console.error("Error initializing:", error);
        }
    };

    initialize();

  }, []);

  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
        setPortrait(window.height > window.width)
    });

    return () => subscription?.remove()
  });

  useEffect(() => {
      const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
          setPortrait(window.height > window.width)
      });
  
      return () => subscription?.remove()
  });


  const checkInitialized = async () => {
      try {
          await initSdk({
            isLoggingEnabled: true,
            theme: "Green",
            sdkKey: "SDK_API_KEY",
          });
          checkAuth()
          loadDemoEvents()
          setInitializedState(true)
      } catch (e) {
          console.error(e);
      }
  }

  const loadDemoEvents = useCallback(async () => {
      try {
          const events = await getDemoEvents("2022-01-01")
          setEvents(events)
          if (events !== undefined && events !== null && events.length > 0) {
              createEventSess(events[0].id)
          }
      } catch (e) {
          console.error("PlayerScreen loadDemoEvents error", e);
      }
  },[])

  const checkAuth = async () => {
      try {
          if (!isUserAuthorized()) {
              await useAnonymousAuth();
          }
      } catch (e) {
          console.error(e);
      }
  }

  const createEventSess = async (id: string) => {
      try {
          await createEventSession(id);
          console.log(`Created a new event with id ${id}`);
          setCurrentEventId(id)
      } catch (e) {
          console.error(e);
      }
  };

  const playerHeight = isScreenPortrait() ? 300 : Dimensions.get('screen').height;

  const onRequestStream = (id: string) => {
      createEventSess(id)
  }

  const onLBarStateChanged = (slideX: number, slideY: number) => {
      setLbarState(new LBarState(slideX, slideY));
  }

  const onRequestAudioDucking = (level: number) => {
      console.log("onRequestAudioDucking level=" + level)
  }

  const onDisableAudioDucking = () => {
      console.log("onDisableAudioDucking")
  }

  const streamLayerViewPlayer = {
      get volume() {
          return 0.0
      },

      set volume(value) {

      },

  }

  const viewConfig = getViewConfig()

  var scrollItems = new Array<any>();
    if (events !== undefined && isPortrait) {
        events.forEach((event) => {
            scrollItems.push(
                <Pressable key={event.id} onPress={() => createEventSess(event.id)} style={{ width: Width, marginTop: 0}}>
                    <View 
                      style={{width: '100%',flexDirection: 'row', height: 70, alignItems: 'center',justifyContent: 'center',  alignSelf: 'center', marginTop: 5,borderRadius: 10, borderWidth: 0.3}} 
                    >
                      {event.previewUrl !== undefined && (
                        <View style={{marginLeft: 120, height: 50, flexDirection: 'row', gap: 20}}>
                            <Text style={{fontSize: 12}} numberOfLines={1} ellipsizeMode='tail'>{event.title}</Text>
                        </View>
                      )}
                    </View>

                    {event.previewUrl !== undefined && (
                        <View style={{marginLeft: 10, height: 50, flexDirection: 'row', gap: 20, position: 'absolute', top: 15, left: 10}}>
                         <Image source={{ uri: event.previewUrl }}
                             style={styles.eventRowImage} />
                             
                          </View>
                        )}     
                </Pressable>
            )
        })
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


  var currentEvent: StreamLayerDemoEvent | undefined;
  if (events !== undefined && currentEventId !== undefined) {
      currentEvent = events.find((event) => {
          return event.id == currentEventId
      })
  }

  const PortraitView = () => {
    return (
      <View style={{ height: Dimensions.get('screen').height - 258, marginTop: 298, position: 'absolute', width: Dimensions.get('screen').width, alignItems: 'center', backgroundColor: 'lightgrey' }}>
        {currentEvent !== undefined && (
          <View 
            style={{width: '100%',}} 
          >
            <Text style={{fontSize: 25, marginLeft: 10}}>{currentEvent.title}</Text>
          </View>
        )}
        <ScrollView style={{ height: Dimensions.get('screen').height - 388, width: '100%', }}>
            {scrollItems}
            <View style={{height: 100}}>
            </View>
        </ScrollView>
    </View>
      )
  }


  return (
    <SafeAreaView style={styles.container}  edges={['top']} >
      <View style={{...styles.container, backgroundColor: 'lightgrey'}}>
      {(isPortrait) && <PortraitView />}
        {isInitializedState 
          ?  
          <StreamLayerView 
            style={StyleSheet.absoluteFillObject}
            config={viewConfig}
            ref={viewRef}
            applyWindowInsets={false}
            onRequestStream={onRequestStream}
            onLBarStateChanged={onLBarStateChanged}
            onRequestAudioDucking={onRequestAudioDucking}
            onDisableAudioDucking={onDisableAudioDucking}
            player={streamLayerViewPlayer}
            playerView={ 

              <THEOplayerView config={playerConfig} onPlayerReady={onPlayerReady}
              style={{
                  width: Dimensions.get('screen').width - lbarState.slideX,
                  height: playerHeight-lbarState.slideY,
                  paddingTop: 0,
              }}>
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
          }
        />
          : 
            <View style={{flex: 1, backgroundColor: 'green'}}/>
          }

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
          StreamLayerViewNotificationFeature.Custom
      ),
      isGamesPointsEnabled: true,
      isGamesPointsStartSide: false,
      isLaunchButtonEnabled: true,
      isMenuAlwaysOpened: false,
      isMenuLabelsVisible: true,
      isMenuProfileEnabled: true,
      isTooltipsEnabled: true,
      isWatchPartyReturnButtonEnabled: true,
      isWhoIsWatchingViewEnabled: false,
      isOverlayExpandable: true,
      overlayHeightSpace: 300,
      overlayWidth: 0,
      enableAllNotificationsAndroid: true,
      overlayLandscapeMode: StreamLayerViewOverlayLandscapeMode.Start
  }
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  eventRowImage: {
      width: 100,
      height: 50
  },
}
);


