// Sarvam AI Voice Service for Indian Languages
const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;
const SARVAM_API_BASE = 'https://api.sarvam.ai';

/**
 * Convert any audio blob to 16kHz mono WAV (PCM) — required by Sarvam STT
 */
async function convertToWav(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();

  // Decode the source audio using a fresh AudioContext
  let decoded;
  const decodeCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    // decodeAudioData needs a copy — slice to detach
    decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch (e) {
    await decodeCtx.close();
    // Fallback: send raw blob as-is wrapped in WAV if decode fails
    // (handles edge cases where browser gives incomplete container)
    throw new Error('Failed to decode recorded audio: ' + e.message);
  }
  await decodeCtx.close();

  // Resample to 16kHz mono via OfflineAudioContext
  const targetSampleRate = 16000;
  const numFrames = Math.ceil(decoded.duration * targetSampleRate);

  const offlineCtx = new OfflineAudioContext(1, numFrames, targetSampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start(0);

  const resampled = await offlineCtx.startRendering();
  const pcmData = resampled.getChannelData(0); // Float32Array

  return encodeWav(pcmData, targetSampleRate);
}

function encodeWav(samples, sampleRate) {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, sampleRate, true);  // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Convert Float32 → Int16
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

class SarvamVoiceService {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
  }

  // Start recording audio
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      this.stream = stream;
      
      // Pick a MIME type that browsers can both record AND decode back
      // Priority: ogg/opus (Firefox) → webm/opus (Chrome) → mp4 (Safari)
      let mimeType = '';
      const candidates = [
        'audio/ogg;codecs=opus',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ];
      for (const candidate of candidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }
      
      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(250); // 250ms chunks — larger = more complete container
      this.isRecording = true;
      
      console.log('Recording started with mimeType:', mimeType);
      
      // Return stream for visualization
      return stream;
    } catch (error) {
      console.error('Microphone access error:', error);
      throw new Error('Unable to access microphone. Please check permissions.');
    }
  }

  // Stop recording and return audio blob
  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder.mimeType;
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.isRecording = false;
        
        console.log('Recording stopped. Blob size:', audioBlob.size, 'Type:', mimeType);
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('MediaRecorder error:', error);
        reject(error);
      };

      this.mediaRecorder.stop();
    });
  }

  // Convert audio to text using Sarvam AI
  async speechToText(audioBlob, language = 'hi-IN') {
    try {
      if (!SARVAM_API_KEY) {
        throw new Error('Sarvam API key not configured');
      }

      console.log('Converting speech to text. Language:', language, 'Blob size:', audioBlob.size, 'Type:', audioBlob.type);

      // Sarvam STT requires 16kHz mono WAV — convert regardless of source format
      console.log('Converting audio to 16kHz mono WAV...');
      const wavBlob = await convertToWav(audioBlob);
      console.log('WAV conversion done. Size:', wavBlob.size);

      const formData = new FormData();
      const audioFile = new File([wavBlob], 'audio.wav', { type: 'audio/wav' });

      formData.append('file', audioFile);
      formData.append('language_code', language);
      formData.append('model', 'saarika:v2.5');

      console.log('Sending request to Sarvam AI STT...', {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type,
        language
      });

      const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
        method: 'POST',
        headers: {
          'API-Subscription-Key': SARVAM_API_KEY
        },
        body: formData
      });

      console.log('Sarvam API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sarvam API error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(`Sarvam API error (${response.status}): ${errorData.error?.message || errorData.message || errorText}`);
      }

      const data = await response.json();
      console.log('Sarvam API response:', data);
      
      return data.transcript || '';
    } catch (error) {
      console.error('Speech to text error:', error);
      throw new Error(error.message || 'Failed to convert speech to text');
    }
  }

  // Convert text to speech using Sarvam AI
  async textToSpeech(text, language = 'hi-IN', speaker = 'ratan') {
    try {
      if (!SARVAM_API_KEY) {
        throw new Error('Sarvam API key not configured');
      }

      console.log('Converting text to speech. Text length:', text.length, 'Language:', language, 'Speaker:', speaker);

      const response = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: language,
          speaker: speaker,
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v3'
        })
      });

      console.log('TTS API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sarvam TTS API error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(`Sarvam TTS API error (${response.status}): ${errorData.error?.message || errorData.message || errorText}`);
      }

      const data = await response.json();
      console.log('TTS response received, audios count:', data.audios?.length);
      
      // Sarvam returns base64 encoded audio
      if (data.audios && data.audios.length > 0) {
        const audioBase64 = data.audios[0];
        const audioBlob = this.base64ToBlob(audioBase64, 'audio/wav');
        console.log('Audio blob created, size:', audioBlob.size);
        return audioBlob;
      }
      
      throw new Error('No audio data received');
    } catch (error) {
      console.error('Text to speech error:', error);
      throw error;
    }
  }

  // Play audio blob
  playAudio(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = reject;
      audio.play();
    });
  }

  // Helper: Convert base64 to blob
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Get language code for Sarvam AI
  getLanguageCode(lang) {
    const langMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'kn': 'kn-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'mr': 'mr-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'pa': 'pa-IN',
      'ml': 'ml-IN',
      'or': 'or-IN',
      'as': 'as-IN'
    };
    return langMap[lang] || 'hi-IN';
  }

  // Get speaker for language
  getSpeaker(lang) {
    const speakerMap = {
      'en': 'ratan',      // Male voice with sharp articulation
      'hi': 'ratan',
      'kn': 'ratan',
      'ta': 'ratan',
      'te': 'ratan',
      'mr': 'ratan',
      'bn': 'ratan',
      'gu': 'ratan',
      'pa': 'ratan',
      'ml': 'ratan',
      'or': 'ratan',
      'as': 'ratan'
    };
    return speakerMap[lang] || 'ratan';
  }
}

export default new SarvamVoiceService();
