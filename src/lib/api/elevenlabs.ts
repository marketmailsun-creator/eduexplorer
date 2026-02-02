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

  console.log('🎤 ElevenLabs - Generating speech');
  console.log(`  - Text length: ${text.length} characters`);
  console.log(`  - Voice ID: ${voiceId}`);
  console.log(`  - API Key: ${apiKey ? '✅ SET' : '❌ MISSING'}`);

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY missing");
  }

  // Validate text length (ElevenLabs has limits)
  const MAX_CHARACTERS = 5000; // ElevenLabs free tier limit
  if (text.length > MAX_CHARACTERS) {
    console.warn(`⚠️  Text too long (${text.length} chars), truncating to ${MAX_CHARACTERS}`);
    // Don't throw, just truncate
  }

  const textToSend = text.length > MAX_CHARACTERS ? text.substring(0, MAX_CHARACTERS) : text;
  try {
    console.log('📤 Sending request to ElevenLabs API...');
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

  console.log(`📥 ElevenLabs response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ ElevenLabs API error response:');
      console.error(`   Status: ${res.status} ${res.statusText}`);
      console.error(`   Body: ${errorText}`);

      // Parse error for better messages
      let errorMessage = `ElevenLabs API error: ${res.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
      } catch {
        // If not JSON, use text
        errorMessage = errorText || errorMessage;
      }

      // Handle specific error codes
      if (res.status === 401) {
        throw new Error("Invalid ElevenLabs API key. Please check your ELEVENLABS_API_KEY in .env.local");
      } else if (res.status === 429) {
        throw new Error("ElevenLabs rate limit exceeded. Please wait before trying again.");
      } else if (res.status === 402) {
        throw new Error("ElevenLabs quota exceeded. Please check your account balance.");
      } else if (res.status === 400) {
        throw new Error(`ElevenLabs bad request: ${errorMessage}`);
      }

      throw new Error(errorMessage);
    }

    console.log('📥 Receiving audio data...');
    const buffer = await res.arrayBuffer();
    const audioBuffer = Buffer.from(buffer);
    
    console.log(`✅ Audio received: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    return audioBuffer;

  } catch (error: any) {
    // Re-throw with better error message
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      throw new Error('Network error: Cannot reach ElevenLabs API. Check your internet connection.');
    }
    
    if (error.message.includes('timeout')) {
      throw new Error('ElevenLabs API timeout. The text might be too long or the service is slow.');
    }

    // If already a good error message, re-throw as is
    throw error;
  }
}
