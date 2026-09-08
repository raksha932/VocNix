import { Room } from 'livekit-client';

async function testLiveKit() {
  console.log('Testing live LiveKit server connection at ws://127.0.0.1:7880...');

  // 1. Request translator token from our Next.js API
  const res = await fetch('http://localhost:3000/api/livekit/translator-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secureRoomToken: '7c229692754d5d91e1a1e0d788fc9cd39d8459cc0c66001f',
      translatorName: 'Automated Tester',
    }),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Failed to get token: ${data.error}`);
  }

  console.log('Obtained token successfully.');
  console.log('Connecting to LiveKit Room:', data.room.livekitRoomName);

  // 2. Connect Room
  const room = new Room();
  await room.connect('ws://127.0.0.1:7880', data.token);

  console.log('Successfully CONNECTED to LiveKit room:', room.name);
  console.log('Connection State:', room.state);
  console.log('Local Participant Identity:', room.localParticipant.identity);

  await room.disconnect();
  console.log('Disconnected cleanly. LIVEKIT WEBRTC SIGNALING VERIFIED 100% OPERATIONAL!');
}

testLiveKit().catch((err) => {
  console.error('LiveKit test failed:', err);
  process.exit(1);
});
