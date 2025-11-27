
import { ProfileData, PortfolioItem } from '../types';

const STORAGE_KEY = 'quy_portfolio_data_v3'; // Bumped version to v3 for structure changes

const DEFAULT_DATA: ProfileData = {
  logoText: "TQ.",
  logoImageUrl: "", // Default empty
  name: "Trần Thiên Quý",
  role: "Event Producer",
  dob: "08/11/1998",
  currentWork: "Event",
  bioTitle: "Xin chào, mình là Quý!",
  bioContent: "Mình làm việc trong lĩnh vực tổ chức sự kiện – đạo diễn sân khấu, nơi mỗi ngày đều là một hành trình sáng tạo mới. Mình thích tạo ra những khoảnh khắc khiến khán giả phải “wow” – không phải vì hoành tráng, mà vì chạm được cảm xúc thật.",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  highlights: [
    { text: "Top 24 cuộc thi Én Sinh Viên 2024 - Sân chơi dành cho tài năng dẫn chương trình chuyên nghiệp miền Nam.", url: "" },
    { text: "Phát thanh phường Bình Thuận, Quận 7, TP.HCM và phường Bình Thuận, Quận Hải Châu, TP. Đà Nẵng", url: "" },
    { text: "Học bổng 100% đại học FPT TP.HCM", url: "" },
    { text: "Giải ba \"Tôi làm phát thanh viên 2023\" - Quận Đoàn Hải Châu, Thành phố Đà Nẵng", url: "" },
    { text: "Leader MC Team tại Câu Lạc Bộ Truyền Thông Cóc Sài Gòn", url: "" },
    { text: "MC hàng trăm chương trình, sự kiện tại FPT", url: "" }
  ],
  portfolio: [
    {
      id: '1',
      title: 'FES-Camp 4: Thang Âm Việt',
      description: 'Chuỗi 4 chương trình biểu diễn và 4 khóa học âm nhạc truyền thống tại Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ.',
      role: 'Project Manager / Art Director',
      imageUrl: 'https://picsum.photos/seed/fes1/800/800',
      logoUrl: 'https://placehold.co/400x100/000000/FFFFFF/png?text=THANG+AM+VIET',
      videoUrl: 'https://youtube.com',
      gallery: [
        'https://picsum.photos/seed/g1/400/400', 'https://picsum.photos/seed/g2/400/400', 'https://picsum.photos/seed/g3/400/400', 'https://picsum.photos/seed/g4/400/400',
        'https://picsum.photos/seed/g5/400/400', 'https://picsum.photos/seed/g6/400/400', 'https://picsum.photos/seed/g7/400/400', 'https://picsum.photos/seed/g8/400/400',
        'https://picsum.photos/seed/g9/400/400', 'https://picsum.photos/seed/g10/400/400', 'https://picsum.photos/seed/g11/400/400', 'https://picsum.photos/seed/g12/400/400'
      ]
    },
    {
      id: '2',
      title: 'Talkshow "Gen Z & AI"',
      description: 'MC dẫn dắt chương trình với sự tham gia của 500 sinh viên. Khai thác góc nhìn đa chiều về công nghệ.',
      role: 'MC / Host',
      imageUrl: 'https://picsum.photos/seed/event1/800/600',
      logoUrl: 'https://placehold.co/400x100/000000/FFFFFF/png?text=GENZ+AI',
      videoUrl: 'https://youtube.com',
      gallery: [
         'https://picsum.photos/seed/ai1/400/400', 'https://picsum.photos/seed/ai2/400/400', 'https://picsum.photos/seed/ai3/400/400', 'https://picsum.photos/seed/ai4/400/400',
         'https://picsum.photos/seed/ai5/400/400', 'https://picsum.photos/seed/ai6/400/400', 'https://picsum.photos/seed/ai7/400/400', 'https://picsum.photos/seed/ai8/400/400',
         'https://picsum.photos/seed/ai9/400/400', 'https://picsum.photos/seed/ai10/400/400', 'https://picsum.photos/seed/ai11/400/400', 'https://picsum.photos/seed/ai12/400/400'
      ]
    }
  ],
  social: {
    phone: "0335657532",
    email: "tranthienquy98@gmail.com",
    facebook: "https://www.facebook.com/md7xd8j3ax",
    tiktok: "https://www.tiktok.com/@quymeevent"
  },
  config: {
    heroBackgroundText: "PORTFOLIO",
    tocTitle: "Contents",
    tocSubtitle: "TABLE OF",
    workTitleMain: "WORK",
    workTitleSub: "Folio",
    workDescription: "A collection of events, productions, and creative directions curated over the years.",
    quoteContent: "\"Making moments that matter.\"",
    quoteAuthor: "Trần Thiên Quý",
    heroLayoutSwapped: false,
    versionText: "PORTFOLIO V.1.0",
    navItems: [
        { label: "Home", targetId: "home" },
        { label: "Highlight", targetId: "highlights" },
        { label: "My Work", targetId: "work" },
        { label: "Contact", targetId: "contact" }
    ]
  }
};

export const getData = (): ProfileData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Helper to migrate old highlight strings to objects if needed
      const migratedHighlights = Array.isArray(parsed.highlights) 
        ? parsed.highlights.map((h: any) => typeof h === 'string' ? { text: h, url: '' } : h)
        : DEFAULT_DATA.highlights;
      
      // Helper to migrate config with missing navItems
      const migratedConfig = { 
          ...DEFAULT_DATA.config, 
          ...(parsed.config || {}),
          navItems: parsed.config?.navItems || DEFAULT_DATA.config.navItems
      };

      return { 
          ...DEFAULT_DATA, 
          ...parsed,
          highlights: migratedHighlights,
          config: migratedConfig
      };
    } catch (e) {
      console.error("Failed to parse stored data", e);
      return DEFAULT_DATA;
    }
  }
  return DEFAULT_DATA;
};

export const saveData = (data: ProfileData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetData = (): ProfileData => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_DATA;
}
