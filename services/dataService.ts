
import { ProfileData, PortfolioItem } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { firebaseConfig } from '../firebaseConfig';

const STORAGE_KEY = 'quy_portfolio_data_v3';
const FIRESTORE_COLLECTION = 'site_content';
const FIRESTORE_DOC_ID = 'main_portfolio';

let db: any = null;
try {
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "PROJECT_ID") {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
    }
} catch (e) {
    console.error("Firestore Init Error:", e);
}

const DEFAULT_DATA: ProfileData = {
  logoText: "TQ.",
  logoImageUrl: "", 
  thumbnailUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&h=630&q=80",
  faviconUrl: "https://placehold.co/32x32/000000/FFFFFF/png?text=TQ",
  name: "Trần Thiên Quý",
  role: "Event Producer",
  dob: "08/11/1998",
  currentWork: "Event",
  bioTitle: "Xin chào, mình là Quý!",
  bioContent: "Mình làm việc trong lĩnh vực tổ chức sự kiện – đạo diễn sân khấu, nơi mỗi ngày đều là một hành trình sáng tạo mới. Mình thích tạo ra những khoảnh khắc khiến khán giả phải “wow” – không phải vì hoành tráng, mà vì chạm được cảm xúc thật.",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  highlights: [
    { label: "AWARD", text: "Top 24 cuộc thi Én Sinh Viên 2024 - Sân chơi MC miền Nam.", url: "" },
    { label: "EXPERIENCE", text: "Phát thanh phường Bình Thuận, Quận 7, TP.HCM và Đà Nẵng", url: "" },
    { label: "SCHOLARSHIP", text: "Học bổng 100% đại học FPT TP.HCM", url: "" },
    { label: "ACHIEVEMENT", text: "Giải ba \"Tôi làm phát thanh viên 2023\" - Đà Nẵng", url: "" },
    { label: "LEADERSHIP", text: "Leader MC Team tại Câu Lạc Club Truyền Thông Cóc Sài Gòn", url: "" },
    { label: "MILESTONE", text: "MC hàng trăm chương trình, sự kiện lớn nhỏ tại FPT", url: "" }
  ],
  portfolio: [
    {
      id: '1',
      title: 'FES-Camp 4: Thang Âm Việt',
      description: 'Chuỗi 4 chương trình biểu diễn và 4 khóa học âm nhạc truyền thống tại Hà Nội, Đà Nẵng, TP.HCM, Cần Thơ.',
      role: 'Project Manager / Art Director',
      imageUrl: 'https://picsum.photos/seed/fes1/800/800',
      logoUrl: 'https://placehold.co/400x100/000000/FFFFFF/png?text=THANG+AM+VIET',
      videoUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ', 
      projectUrl: 'https://example.com/project-1',
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
      videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
      projectUrl: 'https://example.com/project-2',
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
    ],
    labelPortrait: "PORTRAIT_AVATAR",
    labelIntro: "INTRODUCTION",
    labelHighlights: "GRID_LAYOUT",
    labelQuote: "ART_DIRECTION",
    contactHeading: "Let's Create Together",
    cursorSize: 24,
    cursorGlowSize: 120
  },
  textStyles: {}
};

const mergeData = (loaded: any): ProfileData => {
    const migratedHighlights = Array.isArray(loaded.highlights) 
    ? loaded.highlights.map((h: any) => ({
        label: h.label || "HIGHLIGHT",
        text: typeof h === 'string' ? h : (h.text || ""),
        url: h.url || ""
    }))
    : DEFAULT_DATA.highlights;
    
    const migratedConfig = { 
        ...DEFAULT_DATA.config, 
        ...(loaded.config || {}),
        navItems: loaded.config?.navItems || DEFAULT_DATA.config.navItems,
        cursorSize: loaded.config?.cursorSize || DEFAULT_DATA.config.cursorSize,
        cursorGlowSize: loaded.config?.cursorGlowSize || DEFAULT_DATA.config.cursorGlowSize,
        contactHeading: loaded.config?.contactHeading || DEFAULT_DATA.config.contactHeading
    };

    return { 
        ...DEFAULT_DATA, 
        ...loaded,
        highlights: migratedHighlights,
        config: migratedConfig,
        textStyles: loaded.textStyles || {},
        thumbnailUrl: loaded.thumbnailUrl || DEFAULT_DATA.thumbnailUrl,
        faviconUrl: loaded.faviconUrl || DEFAULT_DATA.faviconUrl
    };
};

export const getData = async (): Promise<ProfileData> => {
  if (db) {
      try {
          const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const cloudData = docSnap.data();
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
              return mergeData(cloudData);
          } 
      } catch (error) {
          console.error("Failed to load from Cloud:", error);
      }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return mergeData(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  }

  return DEFAULT_DATA;
};

export const saveData = async (data: ProfileData): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  if (db) {
      try {
          const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
          await setDoc(docRef, data);
      } catch (error) {
          console.error("Failed to save to Cloud:", error);
          throw error;
      }
  }
};

export const resetData = (): ProfileData => {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_DATA;
}
