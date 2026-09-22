// Single source of truth for the name; swap here to rename the product.
export const BRAND = {
  name: "Daju",
  display: "dájú",
  meaning: "Yoruba: dájú, to be sure, to be certain",
  tagline: "Is this sender on file?",
  domainHint: "daju.africa",
  description: "Check a job ad, recruiter message or offer letter against the licensed-agency registers of Nigeria, Kenya, Uganda and Ghana before you reply.",
  markMeaning: "The two high-tone marks that turn d-a-j-u into dájú, certain, impressed in stamp ink inside a double-ring seal. The tone is the certainty; the seal is the register that earns it.",
};

// Lowercase key used in DNS records and storage keys.
export const BRAND_KEY = BRAND.name.toLowerCase().replace(/[^a-z0-9]/g, "");
