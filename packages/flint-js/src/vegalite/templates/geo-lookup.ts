// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Geographic gazetteer for choropleth maps.
 *
 * Real-world datasets identify regions by *name* ("California", "United
 * States") or by a familiar short code (USPS "CA", ISO alpha-2 "US", alpha-3
 * "USA") — almost never by the numeric ids that TopoJSON feature geometries
 * actually carry (FIPS state codes, ISO 3166-1 *numeric* country codes). This
 * module crosswalks any of those user-facing forms to the numeric id that
 * matches Vega's `us-10m.json` (states) and `world-110m.json` (countries)
 * feature ids, so a choropleth can join on whatever the user happens to have.
 *
 * Lookups are case- and punctuation-insensitive. A value that is already the
 * numeric id passes through unchanged.
 */

/** Normalise a label for matching: lowercased, alphanumerics only. */
function norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ---------------------------------------------------------------------------
// US states — [FIPS, name, USPS code]
// ---------------------------------------------------------------------------

const US_STATES: Array<[number, string, string]> = [
    [1, 'Alabama', 'AL'], [2, 'Alaska', 'AK'], [4, 'Arizona', 'AZ'], [5, 'Arkansas', 'AR'],
    [6, 'California', 'CA'], [8, 'Colorado', 'CO'], [9, 'Connecticut', 'CT'], [10, 'Delaware', 'DE'],
    [11, 'District of Columbia', 'DC'], [12, 'Florida', 'FL'], [13, 'Georgia', 'GA'], [15, 'Hawaii', 'HI'],
    [16, 'Idaho', 'ID'], [17, 'Illinois', 'IL'], [18, 'Indiana', 'IN'], [19, 'Iowa', 'IA'],
    [20, 'Kansas', 'KS'], [21, 'Kentucky', 'KY'], [22, 'Louisiana', 'LA'], [23, 'Maine', 'ME'],
    [24, 'Maryland', 'MD'], [25, 'Massachusetts', 'MA'], [26, 'Michigan', 'MI'], [27, 'Minnesota', 'MN'],
    [28, 'Mississippi', 'MS'], [29, 'Missouri', 'MO'], [30, 'Montana', 'MT'], [31, 'Nebraska', 'NE'],
    [32, 'Nevada', 'NV'], [33, 'New Hampshire', 'NH'], [34, 'New Jersey', 'NJ'], [35, 'New Mexico', 'NM'],
    [36, 'New York', 'NY'], [37, 'North Carolina', 'NC'], [38, 'North Dakota', 'ND'], [39, 'Ohio', 'OH'],
    [40, 'Oklahoma', 'OK'], [41, 'Oregon', 'OR'], [42, 'Pennsylvania', 'PA'], [44, 'Rhode Island', 'RI'],
    [45, 'South Carolina', 'SC'], [46, 'South Dakota', 'SD'], [47, 'Tennessee', 'TN'], [48, 'Texas', 'TX'],
    [49, 'Utah', 'UT'], [50, 'Vermont', 'VT'], [51, 'Virginia', 'VA'], [53, 'Washington', 'WA'],
    [54, 'West Virginia', 'WV'], [55, 'Wisconsin', 'WI'], [56, 'Wyoming', 'WY'],
];

// ---------------------------------------------------------------------------
// Countries — [ISO numeric, name, alpha-2, alpha-3]
// Numeric ids match Vega's world-110m.json `countries` feature ids.
// ---------------------------------------------------------------------------

const COUNTRIES: Array<[number, string, string, string]> = [
    [156, 'China', 'CN', 'CHN'], [356, 'India', 'IN', 'IND'], [840, 'United States', 'US', 'USA'],
    [360, 'Indonesia', 'ID', 'IDN'], [586, 'Pakistan', 'PK', 'PAK'], [566, 'Nigeria', 'NG', 'NGA'],
    [76, 'Brazil', 'BR', 'BRA'], [50, 'Bangladesh', 'BD', 'BGD'], [643, 'Russia', 'RU', 'RUS'],
    [484, 'Mexico', 'MX', 'MEX'], [231, 'Ethiopia', 'ET', 'ETH'], [392, 'Japan', 'JP', 'JPN'],
    [608, 'Philippines', 'PH', 'PHL'], [818, 'Egypt', 'EG', 'EGY'], [180, 'DR Congo', 'CD', 'COD'],
    [704, 'Vietnam', 'VN', 'VNM'], [364, 'Iran', 'IR', 'IRN'], [792, 'Turkey', 'TR', 'TUR'],
    [276, 'Germany', 'DE', 'DEU'], [764, 'Thailand', 'TH', 'THA'], [826, 'United Kingdom', 'GB', 'GBR'],
    [250, 'France', 'FR', 'FRA'], [710, 'South Africa', 'ZA', 'ZAF'], [380, 'Italy', 'IT', 'ITA'],
    [404, 'Kenya', 'KE', 'KEN'], [170, 'Colombia', 'CO', 'COL'], [724, 'Spain', 'ES', 'ESP'],
    [32, 'Argentina', 'AR', 'ARG'], [12, 'Algeria', 'DZ', 'DZA'], [124, 'Canada', 'CA', 'CAN'],
    [616, 'Poland', 'PL', 'POL'], [804, 'Ukraine', 'UA', 'UKR'], [682, 'Saudi Arabia', 'SA', 'SAU'],
    [504, 'Morocco', 'MA', 'MAR'], [604, 'Peru', 'PE', 'PER'], [36, 'Australia', 'AU', 'AUS'],
    [398, 'Kazakhstan', 'KZ', 'KAZ'], [152, 'Chile', 'CL', 'CHL'], [752, 'Sweden', 'SE', 'SWE'],
    [578, 'Norway', 'NO', 'NOR'], [528, 'Netherlands', 'NL', 'NLD'], [56, 'Belgium', 'BE', 'BEL'],
    [756, 'Switzerland', 'CH', 'CHE'], [40, 'Austria', 'AT', 'AUT'], [620, 'Portugal', 'PT', 'PRT'],
    [300, 'Greece', 'GR', 'GRC'], [372, 'Ireland', 'IE', 'IRL'], [246, 'Finland', 'FI', 'FIN'],
    [208, 'Denmark', 'DK', 'DNK'], [554, 'New Zealand', 'NZ', 'NZL'], [410, 'South Korea', 'KR', 'KOR'],
    [458, 'Malaysia', 'MY', 'MYS'], [862, 'Venezuela', 'VE', 'VEN'], [218, 'Ecuador', 'EC', 'ECU'],
    [4, 'Afghanistan', 'AF', 'AFG'], [368, 'Iraq', 'IQ', 'IRQ'], [887, 'Yemen', 'YE', 'YEM'],
    [144, 'Sri Lanka', 'LK', 'LKA'], [104, 'Myanmar', 'MM', 'MMR'], [116, 'Cambodia', 'KH', 'KHM'],
    [24, 'Angola', 'AO', 'AGO'], [834, 'Tanzania', 'TZ', 'TZA'], [800, 'Uganda', 'UG', 'UGA'],
    [716, 'Zimbabwe', 'ZW', 'ZWE'], [288, 'Ghana', 'GH', 'GHA'], [384, 'Ivory Coast', 'CI', 'CIV'],
    [686, 'Senegal', 'SN', 'SEN'],
];

/** Extra colloquial names that should resolve to a country numeric id. */
const COUNTRY_ALIASES: Record<string, number> = {
    usa: 840, us: 840, unitedstatesofamerica: 840, america: 840,
    uk: 826, greatbritain: 826, britain: 826, england: 826,
    russianfederation: 643, southkorea: 410, korea: 410, republicofkorea: 410,
    democraticrepublicofthecongo: 180, congokinshasa: 180, drc: 180,
    vietnam: 704, vietnamsocialistrepublic: 704, ivorycoast: 384, cotedivoire: 384,
    iranislamicrepublicof: 364, syrianarabrepublic: 760, tanzaniaunitedrepublicof: 834,
    burma: 104, czechrepublic: 203, czechia: 203, uae: 784, unitedarabemirates: 784,
};

// ---------------------------------------------------------------------------
// Lookup maps (built once)
// ---------------------------------------------------------------------------

function buildMap(entries: Array<[number, string[]]>): Map<string, number> {
    const m = new Map<string, number>();
    for (const [id, keys] of entries) {
        for (const k of keys) {
            const nk = norm(k);
            if (nk && !m.has(nk)) m.set(nk, id);
        }
    }
    return m;
}

const US_STATE_LOOKUP = buildMap(US_STATES.map(([id, name, usps]) => [id, [name, usps]]));

const COUNTRY_LOOKUP = (() => {
    const m = buildMap(COUNTRIES.map(([id, name, a2, a3]) => [id, [name, a2, a3]]));
    for (const [alias, id] of Object.entries(COUNTRY_ALIASES)) {
        if (!m.has(alias)) m.set(alias, id);
    }
    return m;
})();

// ---------------------------------------------------------------------------
// Public resolvers
// ---------------------------------------------------------------------------

/** A choropleth region resolver: user value → TopoJSON numeric feature id. */
export type GeoResolver = (value: unknown) => number | undefined;

function resolveWith(lookup: Map<string, number>, value: unknown): number | undefined {
    if (value == null) return undefined;
    // Already a numeric feature id (or a numeric string like "6" / "06").
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const s = String(value).trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    return lookup.get(norm(s));
}

/** Resolve a US state name / USPS code / FIPS id to its FIPS numeric id. */
export const resolveUsState: GeoResolver = (value) => resolveWith(US_STATE_LOOKUP, value);

/** Resolve a country name / ISO alpha-2 / alpha-3 / numeric to its ISO numeric id. */
export const resolveCountry: GeoResolver = (value) => resolveWith(COUNTRY_LOOKUP, value);
