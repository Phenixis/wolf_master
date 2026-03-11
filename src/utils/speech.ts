import * as Speech from "expo-speech";

let queue: string[] = [];
let isSpeaking = false;
let muted = false;

const processQueue = () => {
  if (isSpeaking || queue.length === 0 || muted) return;

  const text = queue.shift()!;
  isSpeaking = true;

  Speech.speak(text, {
    language: "en-US",
    rate: 0.9,
    onDone: () => {
      isSpeaking = false;
      processQueue();
    },
    onStopped: () => {
      isSpeaking = false;
    },
    onError: () => {
      isSpeaking = false;
      processQueue();
    },
  });
};

/** Queue a message to be spoken aloud. */
export const announce = (text: string) => {
  if (muted) return;
  queue.push(text);
  processQueue();
};

/** Stop current speech and clear the queue. */
export const stopAll = () => {
  Speech.stop();
  queue = [];
  isSpeaking = false;
};

/** Toggle mute on/off. Returns the new muted state. */
export const toggleMute = (): boolean => {
  muted = !muted;
  if (muted) stopAll();
  return muted;
};

export const isMuted = () => muted;
