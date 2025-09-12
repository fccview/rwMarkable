export function getHashFromUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.slice(1);
}

export function setHashInUrl(hash: string | null) {
  if (typeof window === "undefined") return;

  if (!hash || hash.trim() === "") {
    window.history.replaceState(
      null,
      document.title,
      window.location.pathname + window.location.search
    );
  } else {
    window.history.replaceState(
      null,
      document.title,
      window.location.pathname + window.location.search + "#" + hash
    );
  }
}
