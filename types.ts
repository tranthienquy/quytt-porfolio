
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // Used as main thumbnail or fallback
  role?: string;
  logoUrl?: string;
  gallery?: string[]; // Array of 12 images
  videoUrl?: string;
}

export interface SocialLinks {
  phone: string;
  email: string;
  facebook: string;
  tiktok: string;
}

export interface SiteConfig {
  heroBackgroundText: string;
  tocTitle: string;
  tocSubtitle: string;
  workTitleMain: string;
  workTitleSub: string;
  workDescription: string;
  quoteContent: string;
  quoteAuthor: string;
  heroLayoutSwapped: boolean; // Control layout direction
  versionText: string; // New: Editable version text
}

export interface HighlightItem {
  text: string;
  url: string;
}

export interface ProfileData {
  logoText: string;
  logoImageUrl?: string; // New: Optional Logo Image
  name: string;
  role: string;
  dob: string;
  currentWork: string;
  bioTitle: string;
  bioContent: string;
  avatarUrl: string;
  highlights: HighlightItem[]; // Changed from string[] to object array
  portfolio: PortfolioItem[];
  social: SocialLinks;
  config: SiteConfig;
}
