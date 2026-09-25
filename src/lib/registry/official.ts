import type { Country } from "@/lib/countries";

// The official company-register search for each country, for a person to run by hand. Only Uganda's accepts the
// name in the URL; the others open the search page and the name is copied for pasting.
export interface OfficialSearch {
  register: string;
  url: string;
  acceptsQuery: boolean;
  note: string;
}

export function officialCompanySearch(country: Country, name: string): OfficialSearch {
  switch (country) {
    case "NG":
      return { register: "CAC public search", url: "https://icrp.cac.gov.ng/public-search/", acceptsQuery: false, note: "Free. Paste the name; the portal shows the RC number, status and registration date." };
    case "KE":
      return { register: "BRS via eCitizen", url: "https://brs.ecitizen.go.ke/", acceptsQuery: false, note: "Needs an eCitizen login. Business name search is under Registrar of Companies." };
    case "UG":
      return { register: "URSB e-registry", url: `https://eregistry.ursb.go.ug/name-search?q=${encodeURIComponent(name)}`, acceptsQuery: true, note: "Free. Opens with the name already searched." };
    case "GH":
      return { register: "ORC name search", url: "https://orc.gov.gh/service-name-search.php", acceptsQuery: false, note: "Free. Paste the name on the Office of the Registrar of Companies page." };
  }
}
