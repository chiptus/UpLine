interface SoundCloudBadgeProps {
  soundcloudUrl?: string | null;
  onClick?: ((e: React.MouseEvent) => void) | undefined;
}

export function SoundCloudBadge({
  soundcloudUrl,
  onClick,
}: SoundCloudBadgeProps) {
  const soundCloudIcon = (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-4 13.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm2 6c-.276 0-.5-.224-.5-.5V9c0-.276.224-.5.5-.5s.5.224.5.5v6c0 .276-.224.5-.5.5zm2-1c-.276 0-.5-.224-.5-.5V8c0-.276.224-.5.5-.5s.5.224.5.5v8c0 .276-.224.5-.5.5z" />
    </svg>
  );

  if (soundcloudUrl) {
    return (
      <a
        href={soundcloudUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 hover:bg-orange-500/30 transition-colors text-xs"
        onClick={onClick}
      >
        {soundCloudIcon}
        SoundCloud
      </a>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface border border-border text-subtle-foreground text-xs">
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="currentColor"
        opacity="0.4"
      >
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-4 13.5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm1-2c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm2 6c-.276 0-.5-.224-.5-.5V9c0-.276.224-.5.5-.5s.5.224.5.5v6c0 .276-.224.5-.5.5zm2-1c-.276 0-.5-.224-.5-.5V8c0-.276.224-.5.5-.5s.5.224.5.5v8c0 .276-.224.5-.5.5z" />
      </svg>
      No SoundCloud
    </div>
  );
}
