export type MediaKind = 'image' | 'video' | 'audio';

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
const AUDIO = /\.(mp3|wav|m4a|aac|ogg|oga|flac)$/i;

export function mediaKind(url: string): MediaKind {
  const path = url.split(/[?#]/)[0];
  if (VIDEO.test(path)) return 'video';
  if (AUDIO.test(path)) return 'audio';
  return 'image';
}
