const COUNTRY_CODES: Record<string, string> = {
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "u.s.": "US",
  "u.s.a.": "US",
  "united kingdom": "UK",
  uk: "UK",
  "u.k.": "UK",
  england: "UK",
  scotland: "UK",
  wales: "UK",
  germany: "DE",
  france: "FR",
  spain: "ES",
  italy: "IT",
  netherlands: "NL",
  "the netherlands": "NL",
  ireland: "IE",
  portugal: "PT",
  belgium: "BE",
  switzerland: "CH",
  austria: "AT",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  poland: "PL",
  "czech republic": "CZ",
  czechia: "CZ",
  greece: "GR",
  romania: "RO",
  hungary: "HU",
  canada: "CA",
  mexico: "MX",
  brazil: "BR",
  argentina: "AR",
  australia: "AU",
  "new zealand": "NZ",
  japan: "JP",
  "south korea": "KR",
  china: "CN",
  india: "IN",
  singapore: "SG",
  "hong kong": "HK",
  "united arab emirates": "AE",
  uae: "AE",
  israel: "IL",
  "south africa": "ZA",
};

/**
 * Job locations come from free-text AI extraction, so this is a best-effort
 * shortener for a table cell, not a real geocoder: first comma segment as
 * the city, remainder resolved to a short code (via a common-country lookup,
 * or passed through if it already looks like a 2-3 letter code/state).
 */
export function formatLocationShort(location: string | null): string {
  if (!location) return "—";

  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return location;
  if (parts.length === 1) return parts[0];

  const city = parts[0];
  const rest = parts[parts.length - 1];
  const code = COUNTRY_CODES[rest.toLowerCase()] ?? (rest.length <= 3 ? rest.toUpperCase() : rest);

  return `${city} (${code})`;
}
