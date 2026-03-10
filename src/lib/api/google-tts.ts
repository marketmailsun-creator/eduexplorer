export interface TTSOptions {
  text: string;
  voiceId?: string; // ignored — voice configured internally
  stability?: number; // ignored — not applicable to Google TTS
  similarityBoost?: number; // ignored — not applicable to Google TTS
}

/**
 * Generate speech using Google Cloud Text-to-Speech REST API.
 * Returns MP3 audio as a Buffer (same interface as the old ElevenLabs generateSpeech).
 *
 * Requires: GOOGLE_API_KEY env var with "Cloud Text-to-Speech API" enabled
 * in Google Cloud Console (same project as Gemini).
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const { text } = options;

  const apiKey = process.env.GOOGLE_API_KEY;

  console.log('🎤 Google TTS - Generating speech');
  console.log(`  - Text length: ${text.length} characters`);
  console.log(`  - API Key: ${apiKey ? '✅ SET' : '❌ MISSING'}`);

  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY missing — required for Google Cloud TTS');
  }

  // Truncate if needed (Google TTS handles much larger inputs than ElevenLabs,
  // but we keep a reasonable limit for audio duration)
  const MAX_CHARACTERS = 5000;
  const textToSend = text.length > MAX_CHARACTERS
    ? text.substring(0, MAX_CHARACTERS)
    : text;

  if (text.length > MAX_CHARACTERS) {
    console.warn(`⚠️  Text truncated from ${text.length} to ${MAX_CHARACTERS} chars`);
  }

  const requestBody = {
    input: { text: textToSend },
    voice: {
      languageCode: 'en-IN',
      name: 'en-IN-Neural2-D', // female Indian English Neural2 voice
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95, // slightly slower for educational clarity
      pitch: 0,
    },
  };

  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    console.log(`📥 Google TTS response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Google TTS API error:', res.status, errorText);

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          'Google TTS authentication failed. Ensure GOOGLE_API_KEY is valid and Cloud Text-to-Speech API is enabled in Google Cloud Console.'
        );
      }
      if (res.status === 429) {
        throw new Error('Google TTS rate limit exceeded. Please wait before trying again.');
      }
      throw new Error(`Google TTS API error: ${res.status} — ${errorText}`);
    }

    const json = await res.json();
    const audioBase64: string = json.audioContent;

    if (!audioBase64) {
      throw new Error('Google TTS returned empty audio content');
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    console.log(`✅ Audio received: ${audioBuffer.length} bytes (${(audioBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

    return audioBuffer;
  } catch (error: any) {
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      throw new Error('Network error: Cannot reach Google TTS API. Check your internet connection.');
    }
    throw error;
  }
}
