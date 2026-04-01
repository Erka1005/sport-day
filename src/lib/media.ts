const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

function toPublicMediaPath(inputPath: string): string {
  let path = inputPath.trim();

  path = path.replace(/\\/g, "/");

  if (path.includes("/mnt/mmse-uploads/sport_day_members/")) {
    path = path.replace(
      /^.*\/mnt\/mmse-uploads\/sport_day_members\//,
      "/media/sport-day-members/"
    );
    return path;
  }

  if (path.startsWith("/mnt/mmse-uploads/sport_day_members/")) {
    return path.replace(
      "/mnt/mmse-uploads/sport_day_members/",
      "/media/sport-day-members/"
    );
  }

  if (path.startsWith("/media/")) {
    return path;
  }

  return path;
}

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;

  const raw = url.trim();
  if (!raw) return null;

  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const parsed = new URL(raw);

      const convertedPath = toPublicMediaPath(parsed.pathname);
      if (convertedPath.startsWith("/media/")) {
        return `${API_BASE}${convertedPath}`;
      }

      return raw;
    }
  } catch {
    // ignore and continue
  }

  const convertedPath = toPublicMediaPath(raw);

  if (convertedPath.startsWith("http://") || convertedPath.startsWith("https://")) {
    return convertedPath;
  }

  if (convertedPath.startsWith("/")) {
    return `${API_BASE}${convertedPath}`;
  }

  return `${API_BASE}/${convertedPath}`;
}