// Ad blocking service
// Filters out ads based on title keywords and short duration detection

class AdBlockService {
  private enabled: boolean = true;

  constructor() {
    // Load config
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isAd(track: any): boolean {
    if (!this.enabled) return false;

    const title = (track.title || '').toLowerCase();

    // Known ad keywords in titles (whole word match to avoid false positives like "Madonna")
    const adKeywords = [
      /\bad\b/, /\bads\b/, /\badvert/, /\bsponsored\b/,
      /\bcommercial\b/, /\bpromo\b/, /\badvertisement\b/
    ];
    const hasAdKeyword = adKeywords.some(kw => kw.test(title));

    // Very short tracks (<15s) with ad keywords are almost certainly ads
    if (track.duration && track.duration < 15 && hasAdKeyword) {
      return true;
    }

    // Short tracks (<6s) are almost always pre-roll ads
    if (track.duration && track.duration < 6 && track.duration > 0) {
      return true;
    }

    // Check if it's a known ad video ID (would need a list)
    return false;
  }

  public filterResponse(response: any): any {
    if (!this.enabled) return response;

    // If response is a list of tracks, filter out ads
    if (Array.isArray(response)) {
      return response.filter(item => !this.isAd(item));
    }

    return response;
  }
}

export const adBlocker = new AdBlockService();
