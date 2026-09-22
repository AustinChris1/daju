export type Country = "NG" | "KE" | "UG" | "GH";

export const COUNTRY_CODES: Country[] = ["NG", "KE", "UG", "GH"];

export interface CountryInfo {
  code: Country;
  name: string;
  demonym: string;
  dial: string;
  currency: string;
  currencySymbol: string;
  flag: string;
  registry: { org: string; short: string; url: string; what: string };
  cities: string[];
  tld: string;
}

export const COUNTRIES: Record<Country, CountryInfo> = {
  NG: {
    code: "NG",
    name: "Nigeria",
    demonym: "Nigerian",
    dial: "+234",
    currency: "NGN",
    currencySymbol: "₦",
    flag: "🇳🇬",
    registry: {
      org: "Federal Ministry of Labour and Employment",
      short: "NELEX",
      url: "https://nelex.gov.ng/registered-private-employment-agencies",
      what: "Registered private employment agencies",
    },
    cities: ["lagos", "abuja", "ikeja", "lekki", "port harcourt", "ibadan", "kano", "enugu", "onitsha", "aba", "owerri", "asaba", "benin city", "warri", "uyo", "calabar", "jos", "kaduna"],
    tld: ".ng",
  },
  KE: {
    code: "KE",
    name: "Kenya",
    demonym: "Kenyan",
    dial: "+254",
    currency: "KES",
    currencySymbol: "KSh",
    flag: "🇰🇪",
    registry: {
      org: "National Employment Authority",
      short: "NEA",
      url: "https://neaims.go.ke/#/home/agencies-info",
      what: "Licensed private employment agencies",
    },
    cities: ["nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "thika", "westlands", "kilimani", "ruiru", "kiambu"],
    tld: ".ke",
  },
  UG: {
    code: "UG",
    name: "Uganda",
    demonym: "Ugandan",
    dial: "+256",
    currency: "UGX",
    currencySymbol: "USh",
    flag: "🇺🇬",
    registry: {
      org: "Ministry of Gender, Labour and Social Development",
      short: "EEMIS",
      url: "https://eemis.mglsd.go.ug/companies",
      what: "Licensed external recruitment companies",
    },
    cities: ["kampala", "entebbe", "jinja", "gulu", "mbarara", "wakiso", "mukono", "kawempe", "bukoto", "ntinda", "nakawa"],
    tld: ".ug",
  },
  GH: {
    code: "GH",
    name: "Ghana",
    demonym: "Ghanaian",
    dial: "+233",
    currency: "GHS",
    currencySymbol: "GH₵",
    flag: "🇬🇭",
    registry: {
      org: "Ministry of Employment and Labour Relations",
      short: "GLMIS",
      url: "https://www.glmis.gov.gh/employmentagencies",
      what: "Employment agencies directory",
    },
    cities: ["accra", "kumasi", "tema", "takoradi", "tamale", "cape coast", "east legon", "osu", "madina", "spintex"],
    tld: ".gh",
  },
};

export function isCountry(v: unknown): v is Country {
  return typeof v === "string" && (COUNTRY_CODES as string[]).includes(v);
}
