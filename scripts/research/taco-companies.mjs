/**
 * Company names as Trump writes them → the US-listed ticker they point at. The candidate stage of
 * `taco-posts.mjs` matches these, and a cheap-model pass then confirms each hit (#4820).
 *
 * WHY A HAND LIST, NOT SEC's 10,434 names. Matching SEC titles against the corpus returns "People"
 * (2,705 hits), "NEWS", "Here", "BILL" — common words that happen to be tickers. A curated list of
 * the names and BRANDS he actually uses ("Tylenol", not "Kenvue"; "Coke", not "Coca-Cola Co")
 * finds more real mentions with far fewer false ones, and the model pass removes the rest
 * ("Ford" the president, "Target" the verb). Over-matching here is cheap; missing a name is not.
 *
 * WHAT IS LEFT OUT, ON PURPOSE. News organisations (CNN, NBC, ABC, CBS, Fox, the Times) are named
 * near-daily as media criticism, not as companies; they would swamp the study with a different
 * question. Private companies (OpenAI, X, Anduril) have no tape. Each `until` marks a ticker that
 * stopped trading (US Steel, acquired 2025-06-18), so a later mention is not priced off a dead line.
 *
 * Offline research tooling: places nothing, touches no trading path.
 */

/** @typedef {{ ticker: string, names: string[], until?: string }} Company */

/** @type {Company[]} */
export const COMPANIES = [
  // Technology
  { ticker: "AAPL", names: ["Apple", "iPhone", "Tim Cook"] },
  { ticker: "MSFT", names: ["Microsoft"] },
  { ticker: "GOOGL", names: ["Google", "Alphabet", "YouTube"] },
  { ticker: "META", names: ["Facebook", "Meta", "Instagram", "Zuckerberg"] },
  { ticker: "AMZN", names: ["Amazon", "Jassy"] },
  { ticker: "NVDA", names: ["Nvidia", "NVIDIA", "Jensen Huang"] },
  { ticker: "INTC", names: ["Intel", "INTEL", "Lip-Bu Tan"] },
  { ticker: "AMD", names: ["AMD", "Advanced Micro Devices"] },
  { ticker: "TSM", names: ["TSMC", "Taiwan Semiconductor"] },
  { ticker: "MU", names: ["Micron"] },
  { ticker: "AVGO", names: ["Broadcom"] },
  { ticker: "QCOM", names: ["Qualcomm"] },
  { ticker: "IBM", names: ["IBM"] },
  { ticker: "ORCL", names: ["Oracle", "Larry Ellison"] },
  { ticker: "PLTR", names: ["Palantir"] },
  { ticker: "CRWV", names: ["CoreWeave"] },
  { ticker: "DELL", names: ["Dell"] },
  { ticker: "CSCO", names: ["Cisco"] },
  { ticker: "CRM", names: ["Salesforce", "Benioff"] },
  { ticker: "NFLX", names: ["Netflix"] },
  { ticker: "TSLA", names: ["Tesla"] },
  { ticker: "UBER", names: ["Uber"] },
  { ticker: "COIN", names: ["Coinbase"] },
  { ticker: "MSTR", names: ["MicroStrategy", "Michael Saylor"] },
  { ticker: "HOOD", names: ["Robinhood"] },
  { ticker: "RUM", names: ["Rumble"] },
  { ticker: "DJT", names: ["Truth Social", "Trump Media", "TMTG"] },
  { ticker: "NMAX", names: ["Newsmax"] },
  { ticker: "SFTBY", names: ["SoftBank", "Softbank", "Masayoshi Son"] },
  // Autos, industrials, defence
  { ticker: "F", names: ["Ford Motor", "Ford"] },
  { ticker: "GM", names: ["General Motors", "Mary Barra"] },
  { ticker: "STLA", names: ["Stellantis", "Chrysler", "Jeep"] },
  { ticker: "TM", names: ["Toyota"] },
  { ticker: "HMC", names: ["Honda"] },
  { ticker: "HOG", names: ["Harley-Davidson", "Harley Davidson"] },
  { ticker: "BA", names: ["Boeing"] },
  { ticker: "LMT", names: ["Lockheed"] },
  { ticker: "RTX", names: ["Raytheon", "RTX"] },
  { ticker: "NOC", names: ["Northrop"] },
  { ticker: "GD", names: ["General Dynamics"] },
  { ticker: "GE", names: ["General Electric"] },
  { ticker: "GEV", names: ["GE Vernova"] },
  { ticker: "CAT", names: ["Caterpillar"] },
  { ticker: "DE", names: ["John Deere", "Deere"] },
  { ticker: "HON", names: ["Honeywell"] },
  { ticker: "MMM", names: ["3M"] },
  { ticker: "CARR", names: ["Carrier"] },
  // Metals, materials, energy
  { ticker: "X", names: ["U.S. Steel", "US Steel", "United States Steel"], until: "2025-06-18" },
  { ticker: "NUE", names: ["Nucor"] },
  { ticker: "CLF", names: ["Cleveland-Cliffs", "Cleveland Cliffs"] },
  { ticker: "AA", names: ["Alcoa"] },
  { ticker: "MP", names: ["MP Materials"] },
  { ticker: "LAC", names: ["Lithium Americas"] },
  { ticker: "TMQ", names: ["Trilogy Metals"] },
  { ticker: "XOM", names: ["Exxon", "ExxonMobil"] },
  { ticker: "CVX", names: ["Chevron"] },
  { ticker: "COP", names: ["ConocoPhillips"] },
  { ticker: "OXY", names: ["Occidental"] },
  { ticker: "LNG", names: ["Cheniere"] },
  { ticker: "VG", names: ["Venture Global"] },
  { ticker: "SHEL", names: ["Shell"] },
  { ticker: "BP", names: ["BP"] },
  // Health
  { ticker: "PFE", names: ["Pfizer"] },
  { ticker: "LLY", names: ["Eli Lilly", "Lilly"] },
  { ticker: "NVO", names: ["Novo Nordisk", "Ozempic", "Wegovy"] },
  { ticker: "AZN", names: ["AstraZeneca"] },
  { ticker: "MRK", names: ["Merck"] },
  { ticker: "JNJ", names: ["Johnson & Johnson", "Johnson and Johnson"] },
  { ticker: "BMY", names: ["Bristol Myers", "Bristol-Myers"] },
  { ticker: "AMGN", names: ["Amgen"] },
  { ticker: "GILD", names: ["Gilead"] },
  { ticker: "ABBV", names: ["AbbVie"] },
  { ticker: "GSK", names: ["GSK", "GlaxoSmithKline"] },
  { ticker: "SNY", names: ["Sanofi"] },
  { ticker: "NVS", names: ["Novartis"] },
  { ticker: "BAYRY", names: ["Bayer"] },
  { ticker: "BDX", names: ["Becton Dickinson", "Beckton Dickenson", "Becton, Dickinson"] },
  { ticker: "KVUE", names: ["Tylenol", "Kenvue"] },
  { ticker: "UNH", names: ["UnitedHealth", "United Health"] },
  { ticker: "CVS", names: ["CVS"] },
  // Consumer
  { ticker: "WMT", names: ["Walmart"] },
  { ticker: "TGT", names: ["Target"] },
  { ticker: "COST", names: ["Costco"] },
  { ticker: "HD", names: ["Home Depot"] },
  { ticker: "LOW", names: ["Lowe's"] },
  { ticker: "NKE", names: ["Nike"] },
  { ticker: "KO", names: ["Coca-Cola", "Coca Cola", "Coke"] },
  { ticker: "PEP", names: ["Pepsi", "PepsiCo"] },
  { ticker: "MCD", names: ["McDonald's", "McDonalds"] },
  { ticker: "SBUX", names: ["Starbucks"] },
  { ticker: "CBRL", names: ["Cracker Barrel"] },
  { ticker: "BUD", names: ["Anheuser-Busch", "Budweiser", "Bud Light"] },
  { ticker: "MAT", names: ["Mattel"] },
  { ticker: "HAS", names: ["Hasbro"] },
  { ticker: "TSN", names: ["Tyson"] },
  { ticker: "JBS", names: ["JBS"] },
  { ticker: "WHR", names: ["Whirlpool"] },
  { ticker: "LEVI", names: ["Levi's", "Levi Strauss"] },
  { ticker: "DIS", names: ["Disney"] },
  // Travel
  { ticker: "DAL", names: ["Delta Air Lines", "Delta Airlines"] },
  { ticker: "UAL", names: ["United Airlines"] },
  { ticker: "AAL", names: ["American Airlines"] },
  { ticker: "LUV", names: ["Southwest Airlines"] },
  // Finance
  { ticker: "JPM", names: ["JPMorgan", "JP Morgan", "J.P. Morgan", "Jamie Dimon"] },
  { ticker: "BAC", names: ["Bank of America", "Brian Moynihan"] },
  { ticker: "GS", names: ["Goldman Sachs", "Goldman", "David Solomon"] },
  { ticker: "MS", names: ["Morgan Stanley"] },
  { ticker: "C", names: ["Citigroup", "Citibank"] },
  { ticker: "WFC", names: ["Wells Fargo"] },
  { ticker: "BLK", names: ["BlackRock", "Larry Fink"] },
  { ticker: "V", names: ["Visa"] },
  { ticker: "MA", names: ["Mastercard", "MasterCard"] },
  { ticker: "AXP", names: ["American Express"] },
  { ticker: "PYPL", names: ["PayPal"] },
  { ticker: "FNMA", names: ["Fannie Mae", "Fannie"] },
  { ticker: "FMCC", names: ["Freddie Mac", "Freddie"] },
  // Telecom
  { ticker: "T", names: ["AT&T"] },
  { ticker: "VZ", names: ["Verizon"] },
  { ticker: "TMUS", names: ["T-Mobile"] },
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Every company a post's text names, as `{ ticker, matched }`. Case-sensitive on purpose: Trump
 * capitalizes company names, and lowercase "intel" or "target" is almost never the company. His
 * all-caps form ("BOEING", "TRUTH SOCIAL") is matched too; an @handle ("@Rumble", a stream link)
 * is not a mention of the company.
 */
export function companiesIn(text, at) {
  const hits = [];
  for (const c of COMPANIES) {
    if (c.until && at >= c.until) continue;
    for (const name of c.names) {
      const forms = `(?:${escapeRegExp(name)}|${escapeRegExp(name.toUpperCase())})`;
      if (new RegExp(`(?<![\\w@-])${forms}(?![\\w-])`).test(text)) {
        hits.push({ ticker: c.ticker, matched: name });
        break;
      }
    }
  }
  return hits;
}
