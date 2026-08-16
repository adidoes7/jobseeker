// ISO 3166-1 alpha-2 region codes, used to build a country-name → code
// lookup via Intl.DisplayNames so we're not stuck with a partial hand-typed
// country list (which was the earlier bug: any country not in that list
// fell through and rendered in full instead of shortened).
const REGION_CODES =
  "AD,AE,AF,AG,AI,AL,AM,AO,AQ,AR,AS,AT,AU,AW,AX,AZ,BA,BB,BD,BE,BF,BG,BH,BI,BJ,BL,BM,BN,BO,BQ,BR,BS,BT,BV,BW,BY,BZ,CA,CC,CD,CF,CG,CH,CI,CK,CL,CM,CN,CO,CR,CU,CV,CW,CX,CY,CZ,DE,DJ,DK,DM,DO,DZ,EC,EE,EG,EH,ER,ES,ET,FI,FJ,FK,FM,FO,FR,GA,GB,GD,GE,GF,GG,GH,GI,GL,GM,GN,GP,GQ,GR,GS,GT,GU,GW,GY,HK,HM,HN,HR,HT,HU,ID,IE,IL,IM,IN,IO,IQ,IR,IS,IT,JE,JM,JO,JP,KE,KG,KH,KI,KM,KN,KP,KR,KW,KY,KZ,LA,LB,LC,LI,LK,LR,LS,LT,LU,LV,LY,MA,MC,MD,ME,MF,MG,MH,MK,ML,MM,MN,MO,MP,MQ,MR,MS,MT,MU,MV,MW,MX,MY,MZ,NA,NC,NE,NF,NG,NI,NL,NO,NP,NR,NU,NZ,OM,PA,PE,PF,PG,PH,PK,PL,PM,PN,PR,PS,PT,PW,PY,QA,RE,RO,RS,RU,RW,SA,SB,SC,SD,SE,SG,SH,SI,SJ,SK,SL,SM,SN,SO,SR,SS,ST,SV,SX,SY,SZ,TC,TD,TF,TG,TH,TJ,TK,TL,TM,TN,TO,TR,TT,TV,TW,TZ,UA,UG,UM,US,UY,UZ,VA,VC,VE,VG,VI,VN,VU,WF,WS,YE,YT,ZA,ZM,ZW".split(
    ","
  );

// Colloquial names/abbreviations that don't match Intl.DisplayNames' output
// exactly (or where we prefer a different short code than the raw ISO one).
const MANUAL_ALIASES: Record<string, string> = {
  usa: "USA",
  "u.s.": "USA",
  "u.s.a.": "USA",
  "united states": "USA",
  "united states of america": "USA",
  uk: "UK",
  "u.k.": "UK",
  "united kingdom": "UK",
  "great britain": "UK",
  britain: "UK",
  england: "UK",
  scotland: "UK",
  wales: "UK",
  "northern ireland": "UK",
  "czech republic": "CZ",
  "south korea": "KR",
  "north korea": "KP",
  russia: "RU",
  uae: "AE",
  "united arab emirates": "AE",
};

let nameToCode: Map<string, string> | null = null;

function getNameToCode(): Map<string, string> {
  if (nameToCode) return nameToCode;

  const map = new Map<string, string>();
  if (typeof Intl !== "undefined" && "DisplayNames" in Intl) {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    for (const code of REGION_CODES) {
      const name = displayNames.of(code);
      if (name && name !== code) {
        map.set(name.toLowerCase(), code === "GB" ? "UK" : code);
      }
    }
  }
  for (const [name, code] of Object.entries(MANUAL_ALIASES)) {
    map.set(name, code);
  }

  nameToCode = map;
  return map;
}

/** Turns an unrecognized multi-word name into a short initials-based tag, e.g. "Costa Rica" -> "CR". */
function abbreviate(text: string): string {
  const initials = text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return initials.length >= 2 ? initials.slice(0, 3) : text.slice(0, 3).toUpperCase();
}

function resolveCountryCode(text: string): string {
  const known = getNameToCode().get(text.trim().toLowerCase());
  if (known) return known;
  if (text.length <= 3) return text.toUpperCase();
  return abbreviate(text);
}

/**
 * Job locations come from free-text AI extraction, so this is a best-effort
 * shortener for a table cell, not a real geocoder: first comma segment as
 * the city, remainder always resolved to a short code — either a known
 * country code or a synthesized abbreviation, never the raw full name.
 * Pass the original `location` string as a tooltip/title for the full text.
 */
export function formatLocationShort(location: string | null): string {
  if (!location) return "—";

  const parts = location
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return location;

  if (parts.length === 1) {
    const only = parts[0];
    const known = getNameToCode().get(only.toLowerCase());
    return known ?? only;
  }

  const city = parts[0];
  const rest = parts[parts.length - 1];
  return `${city} (${resolveCountryCode(rest)})`;
}
