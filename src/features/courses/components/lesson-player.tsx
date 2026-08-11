"use client";

import { useEffect, useRef } from "react";
import { MediaCommunitySkin, MediaOutlet, MediaPlayer, useMediaStore } from "@vidstack/react";
import type { MediaPlayerElement } from "vidstack";
import "vidstack/styles/base.css";
import "vidstack/styles/community-skin/video.css";

type Props = {
  lessonId: number;
  videoUrl: string;
  title: string;
  initialPositionSeconds: number;
};

const SAVE_INTERVAL_MS = 10_000;

// vidstack 0.6's exported MediaPlayerElement type doesn't surface the
// underlying Player class's imperative API (currentTime setter,
// addEventListener) through its generic inference chain, even though both
// exist at runtime (confirmed in node_modules/vidstack/dist/types/player).
// This narrow cast is the pragmatic way to call them until a version with
// better types is available.
function setCurrentTime(player: MediaPlayerElement, seconds: number) {
  (player as unknown as { currentTime: number }).currentTime = seconds;
}

export function LessonPlayer({ lessonId, videoUrl, title, initialPositionSeconds }: Props) {
  const playerRef = useRef<MediaPlayerElement>(null);
  const { canPlay, currentTime, duration, ended } = useMediaStore(playerRef);
  const lastSavedRef = useRef(0);
  const didSeekRef = useRef(false);

  useEffect(() => {
    if (!canPlay || didSeekRef.current || initialPositionSeconds <= 0) return;
    const player = playerRef.current;
    if (!player) return;

    didSeekRef.current = true;
    setCurrentTime(player, initialPositionSeconds);
  }, [canPlay, initialPositionSeconds]);

  useEffect(() => {
    if (!currentTime || Math.abs(currentTime - lastSavedRef.current) < SAVE_INTERVAL_MS / 1000) {
      return;
    }
    lastSavedRef.current = currentTime;

    fetch("/api/progress/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        positionSeconds: Math.floor(currentTime),
        completed: false,
      }),
      keepalive: true,
    }).catch(() => {
      // Progress tracking is best-effort — a failed save shouldn't interrupt playback.
    });
  }, [currentTime, lessonId]);

  useEffect(() => {
    if (!ended) return;
    fetch("/api/progress/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        positionSeconds: Math.floor(duration || 0),
        completed: true,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [ended, duration, lessonId]);

  return (
    <MediaPlayer
      ref={playerRef}
      title={title}
      src={videoUrl}
      crossorigin=""
      playsinline=""
      className="aspect-video w-full overflow-hidden rounded-xl bg-black"
    >
      <MediaOutlet />
      <MediaCommunitySkin />
    </MediaPlayer>
  );
}
