// Section 45/85: a plain YouTube iframe embed. No autoplay, no API key, no
// scraping — just the official embed URL for one video id at a time.
export function VideoEmbed({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
