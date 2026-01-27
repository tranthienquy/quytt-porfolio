
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string; 
  role?: string;
  logoUrl?: string;
  gallery?: string[]; 
  videoUrl?: string;
  projectUrl?: string; 
}

export interface SocialLinks {
  phone: string;
  email: string;
  facebook: string;
  tiktok: string;
}

export interface NavItem {
  label: string;
  targetId: string;
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
  heroLayoutSwapped: boolean; 
  versionText: string; 
  navItems: NavItem[]; 
  labelPortrait: string;
  labelIntro: string;
  labelHighlights: string;
  labelQuote: string;
  contactHeading: string;
  // Cursor Customization
  cursorSize: number;
  cursorGlowSize: number;
}

export interface HighlightItem {
  text: string;
  url: string;
  label?: string; // New field for titles like "EMAIL" in the image
}

export interface CustomTextStyle {
  color?: string;
  fontSize?: string; 
  fontFamily?: string;
  fontWeight?: string; 
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  lineHeight?: string;
}

export interface ProfileData {
  logoText: string;
  logoImageUrl?: string; 
  thumbnailUrl?: string; // Ảnh thumbnail khi share link
  faviconUrl?: string;   // Icon trên tab trình duyệt
  name: string;
  role: string;
  dob: string;
  currentWork: string;
  bioTitle: string;
  bioContent: string;
  avatarUrl: string;
  highlights: HighlightItem[]; 
  portfolio: PortfolioItem[];
  social: SocialLinks;
  config: SiteConfig;
  textStyles: Record<string, CustomTextStyle>; 
}
