// AA fixture - account aggregator consent flow data.
// Used by AASim.

// ── AA consent benefits ────────────────────────────────────────

export const AA_BENEFITS = [
  {
    title: "Deeper spending insights",
    subtitle: "Let Ryan analyse your full transaction history across accounts",
  },
  {
    title: "All your accounts, one place",
    subtitle: "Track balances and patterns across every bank you use",
  },
  {
    title: "100% secure process",
    subtitle: "RBI-licensed system ensures safe and consent-based access",
    cta: "Learn more",
  },
];

// ── AA Consent cards ────────────────────────────────────────────

export const AA_CONSENT_CARDS = [
  {
    title: "Consent details",
    subtitle: "Consumer spending patterns, budget or other reportings",
    details: [
      { label: "Purpose", value: "Personal finance management" },
      { label: "Frequency", value: "Up to 45x/month" },
      { label: "Time period", value: "While active" },
    ],
  },
];

// ── AA Consent detail rows ──────────────────────────────────────

export const AA_CONSENT_DETAILS = [
  {
    title: "Consent details",
    rows: [
      { label: "Purpose", value: "Personal finance management" },
      { label: "Consent type", value: "Profile, summary, transactions" },
      { label: "Time period", value: "13 Jan '25 to 14 Mar '25", hasInfo: true, tooltipKey: "Statement period" },
      { label: "Frequency", value: "Up to 45x per month" },
      { label: "Consent validity", value: "While active", hasInfo: true, tooltipKey: "Consent validity" },
      { label: "Data life", value: "1 month", hasInfo: true },
    ],
  },
];

// ── AA Learn More (detail screen) ───────────────────────────────

export const AA_LEARN_MORE = {
  title: "Understanding account aggregator",
  subtitle: "Account aggregator is an RBI-regulated, consent-based financial data sharing system.",
  benefits: [
    { title: "Safe", subtitle: "Your information is encrypted end-to-end and only used for your financial insights." },
    { title: "Trust", subtitle: "The AA framework is jointly created by RBI, SEBI, IRDAI & PFRDA" },
    { title: "Privacy", subtitle: "You are in charge of your data and can choose to share it" },
    { title: "Ease of access", subtitle: "AA allows you to manage all banking data in one place" },
  ],
  supportedBanks: [
    { id: "sbi", label: "SBI", logo: "/icons/banks/sbi.png" },
    { id: "axis", label: "Axis", logo: "/icons/banks/axis.png" },
    { id: "hdfc", label: "HDFC", logo: "/icons/banks/hdfc.png" },
    { id: "kotak", label: "Kotak", logo: "/icons/banks/kotak.png" },
    { id: "icici", label: "ICICI", logo: "/icons/banks/icici.png" },
  ],
  aggregators: [
    { id: "perfios", label: "Perfios", logo: "/icons/aggregators/perfios.png" },
    { id: "finvu", label: "FINVU", logo: "/icons/aggregators/finvu.png" },
    { id: "saafe", label: "saafe", logo: "/icons/aggregators/saafe.png" },
    { id: "nadl", label: "N@DL", logo: "/icons/aggregators/nadl.png" },
    { id: "onemoney", label: "Onemoney", logo: "/icons/aggregators/onemoney.png" },
  ],
};

// ── Banks ───────────────────────────────────────────────────────

export const BANKS = [
  { id: "hdfc", label: "HDFC Bank", logo: "/icons/banks/hdfc.png" },
  { id: "axis", label: "Axis Bank", logo: "/icons/banks/axis.png" },
  { id: "ippb", label: "India Post Payments Bank", logo: "/icons/banks/ippb.png" },
  { id: "kotak", label: "Kotak Mahindra Bank", logo: "/icons/banks/kotak.png" },
  { id: "kvb", label: "Karur Vyasa Bank", logo: "/icons/banks/kvb.png" },
  { id: "other", label: "Other bank", logo: "/icons/banks/other.svg" },
];

// ── AA Info tooltips (bottom sheet) ─────────────────────────────

export const AA_INFO_TOOLTIPS: Record<string, { title: string; body: string }> = {
  "Statement period": {
    title: "What is statement period?",
    body: "It refers to the specific duration of your bank transactions we'll fetch, such as 6 months or 1 year, for verification purpose.",
  },
  "Data life": {
    title: "What is data life?",
    body: "The duration for which we securely store your bank statements.",
  },
  "Consent validity": {
    title: "What is consent validity?",
    body: "Your consent stays active until you revoke it, so Ryan can keep your insights up to date.",
  },
};

// ── Onemoney brand ──────────────────────────────────────────────

export const ONEMONEY_LOGO = "/icons/aggregators/onemoney.png";

// ── AA Phone number screen ──────────────────────────────────────

export const AA_PHONE = {
  title: "Phone number",
  subtitle: "Linked to your bank account",
  prefix: "+91-",
  placeholder: "Phone number",
  length: 10,
};

// ── AA No accounts found ────────────────────────────────────────

export const AA_NO_ACCOUNTS = {
  title: "No accounts found",
  subtitle: "Couldn't find any accounts linked to 9987654321 in HDFC Bank",
  illustration: "/icons/illustrations/aa-no-accounts.svg",
  // Original Figma frame is 198.97 × 124.52 - preserve aspect ratio when sizing.
  illustrationAspect: 198.97 / 124.52,
  primaryCta: "Change phone number",
  alternatesHeading: "Other accounts found",
  alternatesSubtitle: "Choose your salary account",
  alternates: [
    { id: "axis", bankLabel: "Axis Bank", logo: "/icons/banks/axis.png", accountMasked: "xx1234", accountType: "Current" },
    { id: "ippb", bankLabel: "India Post Payments Bank", logo: "/icons/banks/ippb.png", accountMasked: "xx1234", accountType: "Current" },
  ],
};

// ── AA Fetched accounts (Select bank accounts screen) ───────────
// Accounts discovered after the discovery OTP. Two share a bank (HDFC).

export const AA_FETCHED_ACCOUNTS = [
  { id: "hdfc-sav", bankLabel: "HDFC Bank", logo: "/icons/banks/hdfc.png", accountMasked: "xx6543", accountType: "Savings" },
  { id: "hdfc-cur", bankLabel: "HDFC Bank", logo: "/icons/banks/hdfc.png", accountMasked: "xx1188", accountType: "Current" },
  { id: "axis-cur", bankLabel: "Axis Bank", logo: "/icons/banks/axis.png", accountMasked: "xx1234", accountType: "Current" },
  { id: "kotak-sav", bankLabel: "Kotak Mahindra Bank", logo: "/icons/banks/kotak.png", accountMasked: "xx7790", accountType: "Savings" },
  { id: "ippb-cur", bankLabel: "India Post Payments Bank", logo: "/icons/banks/ippb.png", accountMasked: "xx0042", accountType: "Current" },
];

// ── AA OTP error state ──────────────────────────────────────────

export const AA_OTP_ERROR = "Out of attempts";
