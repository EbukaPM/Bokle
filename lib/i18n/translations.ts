// Lightweight dictionary-based i18n (PRD P2: "Multi-language support —
// Pidgin English toggle"). Not a full i18n framework — just enough keys to
// cover primary navigation and common actions; add keys here as more of
// the app gets translated.

export type Language = "en" | "pcm"; // pcm = Nigerian Pidgin (ISO 639-3)

export const translations = {
  // Navigation
  nav_home: { en: "Home", pcm: "Home" },
  nav_requests: { en: "Requests", pcm: "My Requests" },
  nav_check_am: { en: "Check Am", pcm: "Check Am" },
  nav_wallet: { en: "Wallet", pcm: "Wallet" },
  nav_profile: { en: "Profile", pcm: "Profile" },
  nav_dashboard: { en: "Dashboard", pcm: "Dashboard" },
  nav_jobs: { en: "Jobs", pcm: "Work" },
  nav_reports: { en: "Reports", pcm: "Reports" },
  nav_earnings: { en: "Earnings", pcm: "Money Wey You Don Make" },

  // Role toggle
  role_client: { en: "I need help", pcm: "I need help" },
  role_provider: { en: "I offer help", pcm: "I dey offer help" },

  // Dashboard
  dashboard_welcome: { en: "Welcome back", pcm: "Welcome back" },
  dashboard_subtitle: { en: "What would you like to do today?", pcm: "Wetin you wan do today?" },
  post_request: { en: "Post a service request", pcm: "Post wetin you need" },
  post_request_desc: { en: "Domestic help, errands, caregiving & more", pcm: "House help, errand, care, and more" },
  active_requests: { en: "Active requests", pcm: "Requests wey still dey run" },
  no_active_requests: { en: "You have no active requests yet.", pcm: "You no get any request wey still dey run." },
  jobs_available_near_you: { en: "Jobs available near you", pcm: "Work wey dey near you" },
  manage_provider_profile: { en: "Manage your provider profile", pcm: "Manage your provider profile" },

  // Common actions
  save: { en: "Save", pcm: "Save" },
  cancel: { en: "Cancel", pcm: "Cancel" },
  confirm: { en: "Confirm", pcm: "Confirm am" },
  loading: { en: "Loading…", pcm: "E dey load…" },
  view_all: { en: "View all", pcm: "See all" },
  log_in: { en: "Log in", pcm: "Log in" },
  log_out: { en: "Log out", pcm: "Log out" },
  sign_up: { en: "Sign up", pcm: "Sign up" },

  // Wallet
  available_balance: { en: "Available balance", pcm: "Money wey you fit use" },
  top_up: { en: "Top Up", pcm: "Add Money" },
  withdraw: { en: "Withdraw", pcm: "Withdraw" },

  // Check Am
  check_am_title: { en: "Help Me Check Am", pcm: "Help Me Check Am" },
  check_am_premium_notice: {
    en: "Help Me Check Am is a Premium feature",
    pcm: "Help Me Check Am na Premium feature",
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function translate(key: TranslationKey, lang: Language): string {
  return translations[key][lang] ?? translations[key].en;
}
