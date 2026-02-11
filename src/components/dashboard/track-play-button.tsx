"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { useAudio } from "./audio-context";

export function TrackPlayButton({ audioUrl }: { audioUrl: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentAudio, setCurrentAudio } = useAudio();

  useEffect(() => {
    // If another audio is playing, pause this one
    if (currentAudio && currentAudio !== audioRef.current && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentAudio, isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Stop any currently playing audio
        if (currentAudio && currentAudio !== audioRef.current) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }

        // Play this audio
        await audioRef.current.play();
        setCurrentAudio(audioRef.current);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (currentAudio === audioRef.current) {
      setCurrentAudio(null);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  if (!audioUrl) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onPause={handlePause}
        preload="metadata"
      />
      <button
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
      >
        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
          {isPlaying ? (
            <Pause className="w-4 h-4 text-black fill-black" />
          ) : (
            <Play className="w-4 h-4 text-black fill-black ml-0.5" />
          )}
        </div>
      </button>
    </>
  );
}
