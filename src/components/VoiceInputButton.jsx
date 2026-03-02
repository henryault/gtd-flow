import { useEffect, useRef } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export function VoiceInputButton({ onCapture }) {
  const {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const wasListeningRef = useRef(false);

  useEffect(() => {
    if (wasListeningRef.current && !isListening && transcript.trim()) {
      onCapture(transcript.trim());
    }
    wasListeningRef.current = isListening;
  }, [isListening, transcript, onCapture]);

  if (!isSupported) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        className="p-2.5 rounded-lg bg-gray-100 text-gray-300 cursor-not-allowed"
      >
        <MicIcon />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-2.5 rounded-lg transition-colors ${
          isListening
            ? 'bg-red-100 text-red-600 animate-pulse'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        <MicIcon />
      </button>
      {isListening && transcript && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-48 bg-white border border-gray-200 rounded-lg p-2 text-sm text-gray-600 shadow-lg z-10">
          {transcript}
        </div>
      )}
      {error && (
        <div className="absolute top-full mt-2 left-0 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 003-3V5a3 3 0 00-6 0v7a3 3 0 003 3z" />
    </svg>
  );
}
