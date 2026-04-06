import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Language = "ja" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ja: {
    // Nav & Layout
    "nav.home": "トップ",
    "nav.analysis": "分析",
    "nav.promotion": "販促",
    "nav.management": "管理",
    "nav.diagnosis": "診断",
    "nav.areaAnalysis": "商圏・出店分析",
    "nav.locationMatch": "エリア適性",
    "nav.storeCandidates": "出店候補地管理",
    "nav.mediaPlan": "統合媒体プラン",
    "nav.adProposal": "広告提案",
    "nav.flyerPlan": "チラシ設計",
    "nav.agencyDashboard": "案件管理",
    "nav.report": "統合レポート",
    "nav.diagnosisList": "診断一覧",
    "nav.storeInput": "店舗入力（診断）",
    "nav.logout": "ログアウト",
    "nav.login": "ログイン",
    "footer.copyright": "© 2024 MapBoost AI",
    "footer.description": "ローカルマーケティング分析ツール — 地域分析・出店分析・広告提案・チラシ配布設計",

    // Index / Hero
    "hero.badge": "マップ連動型 店舗集客AI",
    "hero.title1": "あなたのお店に合う",
    "hero.title2": "集客施策を、",
    "hero.title3": "数分で提案",
    "hero.description": "店舗情報を入力するだけで、商圏・客層・競合をふまえた集客プランをAIが作成します。",
    "hero.cta": "無料で診断する",
    "hero.loginBtn": "ログイン",
    "hero.visitRate": "来店率",
    "hero.awareness": "認知度",

    // Features
    "features.badge": "主な機能",
    "features.title": "MapBoost AI でできること",
    "features.description": "店舗情報を入力するだけで、6つの分析・提案を自動で行います。",
    "feature.diagnosis.title": "集客診断",
    "feature.diagnosis.desc": "商圏・客層・競合を分析し、店舗の強み・弱みを可視化します。",
    "feature.area.title": "商圏分析",
    "feature.area.desc": "半径1〜5kmの人口統計・年齢構成・世帯構成をAIが分析。",
    "feature.candidates.title": "出店候補地管理",
    "feature.candidates.desc": "出店候補地を登録・管理し、商圏スコアで比較評価できます。",
    "feature.media.title": "媒体プラン",
    "feature.media.desc": "Meta・Google・チラシの最適な予算配分とターゲットをAIが提案。",
    "feature.agency.title": "案件管理ダッシュボード",
    "feature.agency.desc": "クライアント・店舗の分析案件を一覧で管理。ステータスも一目瞭然。",
    "feature.report.title": "統合レポート",
    "feature.report.desc": "商圏分析・施策・広告・チラシを1ページに集約。PDF出力も対応。",

    // Steps
    "steps.title": "かんたん4ステップ",
    "steps.description": "入力から施策実行まで、わずか数分で完了します。",
    "step1.title": "店舗情報を入力",
    "step1.desc": "業種・住所・強み・悩みなどを入力",
    "step2.title": "AIが分析・提案",
    "step2.desc": "数秒で診断結果と施策を表示",
    "step3.title": "販促文を生成",
    "step3.desc": "各媒体向けの文面をワンクリック作成",
    "step4.title": "実行 & 改善",
    "step4.desc": "KPIを見ながら施策を実行・改善",

    // CTA
    "cta.title": "まずは無料で診断してみましょう",
    "cta.description": "所要時間は約3分。登録後すぐに始められます。",

    // Auth
    "auth.title": "MapBoost AI",
    "auth.subtitle": "アカウントにログインまたは新規登録",
    "auth.loginTab": "ログイン",
    "auth.signupTab": "新規登録",
    "auth.email": "メールアドレス",
    "auth.password": "パスワード",
    "auth.passwordHint": "パスワード（6文字以上）",
    "auth.loginBtn": "ログイン",
    "auth.signupBtn": "アカウント作成",
    "auth.processing": "処理中…",
    "auth.or": "または",
    "auth.googleLogin": "Googleでログイン",
    "auth.googleSignup": "Googleでアカウント作成",
    "auth.loginFailed": "ログインに失敗しました。メールアドレスとパスワードをご確認ください。",
    "auth.signupSuccess": "確認メールを送信しました。メールをご確認ください。",
    "auth.googleFailed": "Googleログインに失敗しました",

    // Loading
    "loading": "読み込み中...",

    // Store Input
    "store.title": "店舗情報を入力",
    "store.description": "AIが最適な集客施策を提案するための情報を入力してください。",
    "store.name": "店舗名",
    "store.industry": "業種",
    "store.address": "住所",
    "store.station": "最寄り駅",
    "store.target": "ターゲット層",
    "store.strengths": "強み",
    "store.concerns": "お悩み・課題",
    "store.budget": "月間広告予算",
    "store.competitors": "競合店舗",
    "store.media": "利用中の媒体",
    "store.submit": "AI診断を実行",
    "store.submitting": "診断中…",
  },
  en: {
    // Nav & Layout
    "nav.home": "Home",
    "nav.analysis": "Analysis",
    "nav.promotion": "Promotion",
    "nav.management": "Management",
    "nav.diagnosis": "Diagnosis",
    "nav.areaAnalysis": "Trade Area Analysis",
    "nav.locationMatch": "Location Match",
    "nav.storeCandidates": "Store Candidates",
    "nav.mediaPlan": "Integrated Media Plan",
    "nav.adProposal": "Ad Proposal",
    "nav.flyerPlan": "Flyer Planning",
    "nav.agencyDashboard": "Agency Dashboard",
    "nav.report": "Integrated Report",
    "nav.diagnosisList": "Diagnosis List",
    "nav.storeInput": "Store Input (Diagnosis)",
    "nav.logout": "Logout",
    "nav.login": "Login",
    "footer.copyright": "© 2024 MapBoost AI",
    "footer.description": "Local Marketing Analysis Tool — Area Analysis, Store Analysis, Ad Proposals, Flyer Distribution",

    // Index / Hero
    "hero.badge": "Map-Driven Store Marketing AI",
    "hero.title1": "Find the best",
    "hero.title2": "marketing strategy for",
    "hero.title3": "your store in minutes",
    "hero.description": "Simply enter your store info and AI will create a marketing plan based on your trade area, customers, and competitors.",
    "hero.cta": "Start Free Diagnosis",
    "hero.loginBtn": "Login",
    "hero.visitRate": "Visit Rate",
    "hero.awareness": "Awareness",

    // Features
    "features.badge": "Key Features",
    "features.title": "What MapBoost AI Can Do",
    "features.description": "Enter your store info and get 6 automated analyses and recommendations.",
    "feature.diagnosis.title": "Marketing Diagnosis",
    "feature.diagnosis.desc": "Analyze trade area, customers, and competitors to visualize your store's strengths and weaknesses.",
    "feature.area.title": "Trade Area Analysis",
    "feature.area.desc": "AI analyzes demographics, age distribution, and household composition within 1-5km radius.",
    "feature.candidates.title": "Store Candidate Management",
    "feature.candidates.desc": "Register and manage potential store locations with trade area scoring.",
    "feature.media.title": "Media Plan",
    "feature.media.desc": "AI recommends optimal budget allocation for Meta, Google, and flyers.",
    "feature.agency.title": "Agency Dashboard",
    "feature.agency.desc": "Manage client and store analysis projects at a glance with status tracking.",
    "feature.report.title": "Integrated Report",
    "feature.report.desc": "Consolidate area analysis, strategies, ads, and flyers into one page. PDF export supported.",

    // Steps
    "steps.title": "4 Easy Steps",
    "steps.description": "From input to execution in just a few minutes.",
    "step1.title": "Enter Store Info",
    "step1.desc": "Input industry, address, strengths, and concerns",
    "step2.title": "AI Analyzes & Suggests",
    "step2.desc": "Get diagnosis results and strategies in seconds",
    "step3.title": "Generate Promo Copy",
    "step3.desc": "Create copy for each channel with one click",
    "step4.title": "Execute & Improve",
    "step4.desc": "Run and refine strategies using KPI tracking",

    // CTA
    "cta.title": "Try a free diagnosis today",
    "cta.description": "Takes about 3 minutes. Start right after signing up.",

    // Auth
    "auth.title": "MapBoost AI",
    "auth.subtitle": "Login or create a new account",
    "auth.loginTab": "Login",
    "auth.signupTab": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.passwordHint": "Password (6+ characters)",
    "auth.loginBtn": "Login",
    "auth.signupBtn": "Create Account",
    "auth.processing": "Processing…",
    "auth.or": "or",
    "auth.googleLogin": "Login with Google",
    "auth.googleSignup": "Sign up with Google",
    "auth.loginFailed": "Login failed. Please check your email and password.",
    "auth.signupSuccess": "Confirmation email sent. Please check your inbox.",
    "auth.googleFailed": "Google login failed",

    // Loading
    "loading": "Loading...",

    // Store Input
    "store.title": "Enter Store Information",
    "store.description": "Provide details so AI can recommend the best marketing strategies.",
    "store.name": "Store Name",
    "store.industry": "Industry",
    "store.address": "Address",
    "store.station": "Nearest Station",
    "store.target": "Target Audience",
    "store.strengths": "Strengths",
    "store.concerns": "Concerns / Challenges",
    "store.budget": "Monthly Ad Budget",
    "store.competitors": "Competitors",
    "store.media": "Currently Used Channels",
    "store.submit": "Run AI Diagnosis",
    "store.submitting": "Diagnosing…",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved === "en" || saved === "ja") ? saved : "ja";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
