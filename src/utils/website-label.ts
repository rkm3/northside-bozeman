/** Hostname for display, without a leading www. */
export function getWebsiteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return 'Website';
  }
}
