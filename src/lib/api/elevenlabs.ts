import axios from 'axios';

//const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export interface TTSOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
}

// export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
//   console.log("ELEVENLABS_API_KEY:", process.env.ELEVENLABS_API_KEY ? "SET" : "MISSING");
//   const {
//     text,
//     voiceId = '21m00Tcm4TlvDq8ikWAM',
//     stability = 0.75,
//     similarityBoost = 0.75,
//   } = options;
//   const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
//   console.log("ElevenLabs key prefix:", ELEVENLABS_API_KEY?.slice(0, 6));
//   if (!ELEVENLABS_API_KEY) {
//     throw new Error("ELEVENLABS_API_KEY is missing");
//   }
//   try {
//     const response = await axios.post(
//       `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
//       {
//         text,
//         model_id: 'eleven_multilingual_v2',
//         voice_settings: {
//           stability,
//           similarity_boost: similarityBoost,
//           style: 0.5,
//           use_speaker_boost: true,
//         },
//       },
//       {
//         headers: {
//           'xi-api-key': ELEVENLABS_API_KEY,
//           'Content-Type': 'application/json',
//           Accept: "audio/mpeg",
//         },
//         responseType: 'arraybuffer',
//       }
//     );

//     return Buffer.from(response.data);
//   } catch (error) {
//     console.error('ElevenLabs TTS error:', error);
//     throw new Error('Failed to generate speech');
//   }
// }

export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const {
    text,
    voiceId = "21m00Tcm4TlvDq8ikWAM",
    stability = 0.75,
    similarityBoost = 0.75,
  } = options;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY missing");
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("ElevenLabs error:", res.status, err);
    throw new Error("Failed to generate speech");
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}
