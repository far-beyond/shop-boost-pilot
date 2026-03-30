export const dummyStoreInput = {
  storeName: "カフェ モカ 渋谷店",
  industry: "カフェ・喫茶店",
  address: "東京都渋谷区道玄坂1-2-3",
  nearestStation: "渋谷駅 徒歩5分",
  targetAudience: "20〜30代 会社員・フリーランス",
  strengths: "自家焙煎コーヒー、Wi-Fi完備、電源あり",
  concerns: "平日昼間の集客が弱い、SNSをうまく活用できていない",
  monthlyBudget: "5万円〜10万円",
  competitors: "スターバックス渋谷店、タリーズ道玄坂店",
  preferredMedia: ["Googleビジネスプロフィール", "Instagram", "LINE"],
};

export const dummyDiagnosis = {
  strengths: [
    "自家焙煎という独自性の高い商品力",
    "Wi-Fi・電源完備でリモートワーカーに最適な環境",
    "渋谷駅から徒歩5分の好立地",
  ],
  weaknesses: [
    "SNS発信が不十分で認知が広がりにくい",
    "平日昼間の集客施策が未実施",
    "Googleビジネスプロフィールの最適化が不十分",
  ],
  targetCustomers: "渋谷周辺で働く20〜30代のリモートワーカー・フリーランス。ランチ後のカフェタイムや午後の作業場所を探している層。",
  differentiationPoints: [
    "「自家焙煎×作業スペース」というポジショニング",
    "大手チェーンにはない落ち着いた雰囲気と個性",
    "豆の産地やロースト方法のストーリー性",
  ],
  bottlenecks: [
    "Googleマップでの露出不足（レビュー数が少ない）",
    "Instagram更新頻度の低さ",
    "リピーター施策（LINE等）が未導入",
  ],
  actions: [
    {
      name: "Googleビジネスプロフィール最適化",
      reason: "地域検索で上位表示されることで、新規来店を効率的に獲得できます。レビュー促進も同時に行うことで信頼性が向上します。",
      estimatedCost: "0円〜5,000円/月",
      difficulty: "★☆☆☆☆",
      expectedEffect: "来店数 +15〜25%（3ヶ月後目安）",
    },
    {
      name: "Instagram運用強化（週3投稿）",
      reason: "ターゲット層がよく利用するプラットフォーム。自家焙煎のビジュアルはInstagramとの親和性が高いです。",
      estimatedCost: "0円〜30,000円/月",
      difficulty: "★★☆☆☆",
      expectedEffect: "フォロワー数 月+100〜200人",
    },
    {
      name: "LINE公式アカウント開設＋クーポン配信",
      reason: "リピーター獲得に最も効果的。平日昼間限定クーポンで閑散時間帯の集客を狙えます。",
      estimatedCost: "5,000円〜15,000円/月",
      difficulty: "★★☆☆☆",
      expectedEffect: "リピート率 +20%（2ヶ月後目安）",
    },
  ],
};

export const dummyPromoTexts: Record<string, string[]> = {
  "Googleビジネスプロフィール": [
    "【渋谷駅徒歩5分】自家焙煎コーヒーとWi-Fi完備の作業空間。平日はゆったり過ごせる穴場カフェです。電源席も多数ご用意。お気軽にお立ち寄りください。",
    "渋谷で本格自家焙煎コーヒーを楽しめるカフェ。リモートワークにも最適な落ち着いた空間で、こだわりの一杯をどうぞ。ランチセットも好評です。",
  ],
  Instagram: [
    "☕ 今日の一杯はエチオピア産の浅煎り。\nフルーティーな酸味が特徴です🫧\n\n渋谷駅から歩いてすぐ。\nWi-Fi＆電源完備だから、\n午後の作業カフェにぴったり✨\n\n#渋谷カフェ #自家焙煎 #リモートワーク #カフェ巡り",
    "📍渋谷の隠れ家カフェ\n\n自家焙煎の香りに包まれながら\nゆったり過ごす午後のひととき。\n\n平日は空いていて穴場です🙌\n\n#東京カフェ #コーヒー好き #作業カフェ #渋谷",
  ],
  X: [
    "渋谷で自家焙煎コーヒーが飲めるカフェ☕ Wi-Fi・電源完備で作業にも◎ 平日の午後はゆったり過ごせます。渋谷駅徒歩5分。",
    "平日のカフェ難民に朗報🙌 渋谷駅チカで電源・Wi-Fiありの自家焙煎カフェ。大手チェーンに疲れた方、ぜひ一度お試しを。",
  ],
  チラシ: [
    "【新規オープン記念】\n自家焙煎コーヒー カフェ モカ 渋谷店\n\n━━━━━━━━━━━━\n📍 渋谷区道玄坂1-2-3\n🚶 渋谷駅から徒歩5分\n━━━━━━━━━━━━\n\n✅ 自家焙煎のこだわりコーヒー\n✅ Wi-Fi・電源完備\n✅ ランチセットあり\n\n今なら初回来店でドリンク1杯無料！\nこのチラシをご提示ください。",
    "【平日限定クーポン】\nカフェ モカ 渋谷店\n\n平日14:00〜17:00\nドリンク全品 100円OFF！\n\n静かな午後のひとときを\n自家焙煎コーヒーとともに。",
  ],
  LINE: [
    "🎉 友だち追加ありがとうございます！\n\nカフェ モカ 渋谷店です☕\n\n今すぐ使えるクーポンをプレゼント🎁\n\n▼ ドリンク1杯 100円OFF ▼\n有効期限：登録から2週間\n\nお気軽にご来店ください😊",
    "☕ 今週のおすすめ\n\n「エチオピア イルガチェフェ」\nフルーティーで華やかな香り。\n\n平日14時〜17時は\nおかわり半額キャンペーン中！\n\n📍渋谷駅徒歩5分",
  ],
  広告見出し: [
    "渋谷駅5分｜自家焙煎カフェ｜Wi-Fi電源完備",
    "【渋谷の作業カフェ】自家焙煎コーヒー×快適Wi-Fi空間",
    "平日限定クーポンあり｜渋谷の自家焙煎カフェ",
    "リモートワークに最適｜渋谷駅近の本格カフェ",
  ],
};

export const dummyKPIs = [
  {
    metric: "Googleマップ表示回数",
    target: "月間 3,000回",
    measurement: "Googleビジネスプロフィール インサイト",
    frequency: "週1回",
  },
  {
    metric: "Googleマップ経由の来店数",
    target: "月間 50件",
    measurement: "Googleビジネスプロフィール インサイト（ルート検索数）",
    frequency: "週1回",
  },
  {
    metric: "Instagramフォロワー数",
    target: "3ヶ月後 500人",
    measurement: "Instagramインサイト",
    frequency: "週1回",
  },
  {
    metric: "Instagram投稿エンゲージメント率",
    target: "5%以上",
    measurement: "いいね+コメント数 ÷ フォロワー数",
    frequency: "投稿ごと",
  },
  {
    metric: "LINE友だち数",
    target: "3ヶ月後 200人",
    measurement: "LINE公式アカウント管理画面",
    frequency: "週1回",
  },
  {
    metric: "リピート来店率",
    target: "30%以上",
    measurement: "LINE経由クーポン利用数 ÷ 総来店数",
    frequency: "月1回",
  },
  {
    metric: "平日昼間（14-17時）来店数",
    target: "前月比 +20%",
    measurement: "POSデータまたは手動カウント",
    frequency: "日次",
  },
];

export const dummyDashboardItems = [
  {
    id: "1",
    storeName: "カフェ モカ 渋谷店",
    createdAt: "2024-03-15",
    status: "完了",
  },
  {
    id: "2",
    storeName: "ラーメン大将 新宿本店",
    createdAt: "2024-03-10",
    status: "診断済み",
  },
  {
    id: "3",
    storeName: "美容室 Hair Bloom 恵比寿",
    createdAt: "2024-03-08",
    status: "入力中",
  },
  {
    id: "4",
    storeName: "フィットネスジム POWER 池袋",
    createdAt: "2024-02-28",
    status: "完了",
  },
];
