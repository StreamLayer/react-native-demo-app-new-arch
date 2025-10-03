/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { useState } from 'react';

import {StyleSheet, Dimensions} from 'react-native';

import { 
  PlayerConfiguration, 
  PlayerEventType, 
  THEOplayer, 
  THEOplayerView 
} from 'react-native-theoplayer';

import {
  CenteredControlBar,
  DEFAULT_THEOPLAYER_THEME,
  PlayButton,
  SkipButton,
  UiContainer,
} from '@theoplayer/react-native-ui';

import { SafeAreaView } from 'react-native-safe-area-context';

import { SOURCES } from './custom/SourceMenuButton';

function App() {

  const [player, setPlayer] = useState<THEOplayer | undefined>(undefined);

  const onPlayerReady = (player: THEOplayer) => {
    setPlayer(player);
    player.addEventListener(PlayerEventType.SOURCE_CHANGE, console.log);
    player.addEventListener(PlayerEventType.LOADED_DATA, console.log);
    player.addEventListener(PlayerEventType.LOADED_METADATA, console.log);
    player.addEventListener(PlayerEventType.READYSTATE_CHANGE, console.log);
    player.addEventListener(PlayerEventType.PLAY, console.log);
    player.addEventListener(PlayerEventType.PLAYING, console.log);
    player.addEventListener(PlayerEventType.PAUSE, console.log);
    player.addEventListener(PlayerEventType.SEEKING, console.log);
    player.addEventListener(PlayerEventType.SEEKED, console.log);
    player.addEventListener(PlayerEventType.ENDED, console.log);
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

  const playerConfig: PlayerConfiguration = {
    license: undefined,
  };

  return (
    <SafeAreaView style={styles.container}  edges={['top']} >
              <THEOplayerView config={playerConfig} onPlayerReady={onPlayerReady}
              style={{
                  width: '100%',
                  height: 350
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
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  eventTitle: {
      color: 'white',
      fontSize: 24,
      margin: 4
  },
  eventRowTitle: {
      flex: 1,
      color: 'white',
      fontSize: 16,
      margin: 4
  },
  eventRow: {
      flexDirection: 'row',
      margin: 4,
      padding: 4,
      height: 58,
      justifyContent: 'flex-start',
      alignItems: 'center',

  },
  eventRowImage: {
      width: 100,
      height: 50
  },
  portrait: {
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    position: 'absolute'
  },
  landscape: {
      flex: 1
  },
  player: {
      backgroundColor: 'black',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'green'
  },
  playButton: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 50, 
      borderLeftColor: 'white', 
      borderTopWidth: 25, 
      borderTopColor: 'transparent',
      borderBottomWidth: 25, 
      borderBottomColor: 'transparent',
}
}
);
export default App;
