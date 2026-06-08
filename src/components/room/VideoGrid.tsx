import {
  GridLayout,
  ParticipantTile,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

export default function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <RoomAudioRenderer />
      <GridLayout
        tracks={tracks}
        style={{ height: '100%' }}
      >
        <ParticipantTile />
      </GridLayout>
    </div>
  )
}
