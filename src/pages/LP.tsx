import { Link } from "react-router-dom";
import { Target, MapPin, BarChart3, FileText, Zap, CheckCircle2, ArrowRight, Star, TrendingUp, Users, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const LP_FEATURES = [
  {
    icon: MapPin,
    title: "AIが30秒で商圏を分析",
    description: "住所を入力するだけで、半径1〜5kmの人口・世帯数・競合店舗を自動分析。国勢調査データとAIで精度の高いエリアマーケティングを実現。",
  },
  {
    icon: BarChart3,
    title: "チラシ・広告プランを自動生成",
    description: "配布エリア・部数・費用をAIが最適化。Google広告・Meta広告の提案書もワンクリックで作成。発注書PDFも自動生成。",
  },
  {
    icon: FileText,
    title: "MEO分析でGoogleマップ上位表示",
    description: "Googleビジネスプロフィールの改善点をAIが診断。口コミ分析・競合比較で、地域検索での上位表示をサポート。",
  },
  {
    icon: TrendingUp,
    title: "月次レポートを自動作成",
    description: "集客施策の効果を自動集計。PDF形式のレポートで、オーナーもスタッフも成果を一目で把握。",
  },
];

const LP_PAIN_POINTS = [
  "チラシを撒いても効果がわからない",
  "広告代理店に頼むと月10万円以上かかる",
  "商圏分析って何から始めればいい？",
  "Googleマップの順位を上げたい",
  "近くに競合が増えて売上が落ちた",
  "集客にかける時間がない",
];

const LP_STEPS = [
  { step: "01", title: "住所を入力", description: "店舗の住所を入力するだけ。登録不要で今すぐ無料分析。" },
  { step: "02", title: "AIが自動分析", description: "30秒で商圏の人口・競合・ポテンシャルをAIが分析。" },
  { step: "03", title: "施策を実行", description: "チラシ配布・Web広告・MEO対策。発注書まで自動作成。" },
];

const LP_TESTIMONIALS = [
  {
    name: "焼肉店オーナー",
    area: "東京都 新宿区",
    text: "チラシの配布エリアをAIに任せたら、来店数が1.5倍に。今まで勘でやっていたのがバカらしくなりました。",
    rating: 5,
  },
  {
    name: "美容室オーナー",
    area: "大阪府 心斎橋",
    text: "MEO分析で改善点を教えてもらい、Googleマップの表示順位が3位から1位に。予約が30%増えました。",
    rating: 5,
  },
  {
    name: "整骨院 院長",
    area: "福岡県 博多区",
    text: "月9,800円でこの機能は破格。広告代理店に払っていた月15万円が浮いて、その分をスタッフの給与に回せました。",
    rating: 5,
  },
];

const LP_PRICING = [
  {
    name: "Free",
    price: "¥0",
    period: "月額",
    features: ["月3回まで商圏分析", "基本エリアマップ", "CSV出力"],
    cta: "無料で始める",
    highlight: false,
  },
  {
    name: "Standard",
    price: "¥9,800",
    period: "月額（税別）",
    features: ["月30回 商圏分析", "競合マッピング", "チラシ配布プラン", "AI広告提案", "発注書PDF"],
    cta: "7日間無料トライアル",
    highlight: true,
  },
  {
    name: "Pro",
    price: "¥29,800",
    period: "月額（税別）",
    features: ["無制限 商圏分析", "MEO分析", "月次レポート自動化", "店舗比較（5店舗）", "統合媒体プラン"],
    cta: "7日間無料トライアル",
    highlight: false,
  },
];

const LP_FAQ = [
  { q: "本当に無料で使えますか？", a: "はい。Freeプランは月3回まで商圏分析が無料で、クレジットカード登録も不要です。" },
  { q: "どんな業種に向いていますか？", a: "飲食店、美容室、整骨院、歯科医院、学習塾など、地域のお客様を集客したいすべての店舗にお使いいただけます。" },
  { q: "解約はいつでもできますか？", a: "はい。いつでもワンクリックで解約でき、違約金もありません。" },
  { q: "データの精度は？", a: "国勢調査（e-Stat）、WorldPopなどの公的データとAIを組み合わせて分析。人力コンサルと同等以上の精度です。" },
  { q: "広告代理店との違いは？", a: "広告代理店は月10〜50万円。MapBoostは月9,800円から同等の分析・提案をAIで自動化します。" },
];

export default function LP() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md"
              style={{ background: "linear-gradient(135deg, hsl(217 91% 55%), hsl(200 85% 52%))" }}
            >
              <Target className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">MapBoost AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/free-analysis">
              <Button variant="ghost" size="sm">無料で分析</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground shadow-md">
                ログイン
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Zap className="w-4 h-4" />
            AIが30秒で商圏を丸裸にする
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6">
            地図 × AI で、
            <br />
            <span className="bg-gradient-to-r from-primary to-primary-foreground bg-clip-text" style={{ WebkitTextFillColor: "transparent", backgroundImage: "linear-gradient(135deg, hsl(217 91% 55%), hsl(200 85% 52%))" }}>
              集客を、もっと賢く。
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            住所を入力するだけ。国勢調査の実データとAIが、
            <br className="hidden sm:block" />
            商圏分析・チラシ配布・Web広告・MEO対策まで
            <br className="hidden sm:block" />
            ワンストップで自動化します。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/free-analysis">
              <Button size="lg" className="text-base px-8 py-6 bg-primary text-white shadow-xl hover:shadow-2xl transition-all">
                無料で商圏分析する
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              クレカ不要 ・ 登録なしで今すぐ使える
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {[
              { value: "30秒", label: "分析完了" },
              { value: "全国", label: "47都道府県対応" },
              { value: "¥0", label: "から始められる" },
              { value: "AI", label: "自動提案" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">こんなお悩みありませんか？</h2>
          <p className="text-center text-muted-foreground mb-12">一つでも当てはまるなら、MapBoost AIがお役に立てます</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {LP_PAIN_POINTS.map((pain) => (
              <div key={pain} className="flex items-start gap-3 p-5 rounded-xl bg-card border border-border/60 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{pain}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">MapBoost AIでできること</h2>
          <p className="text-center text-muted-foreground mb-12">エリアマーケティングに必要なすべてをAIが自動化</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {LP_FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, hsl(217 91% 55% / 0.1), hsl(200 85% 52% / 0.1))" }}>
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">かんたん3ステップ</h2>
          <p className="text-center text-muted-foreground mb-12">難しい設定は一切不要。今すぐ始められます</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {LP_STEPS.map((step, i) => (
              <div key={step.step} className="relative text-center">
                <div className="text-5xl font-black text-primary/15 mb-4">{step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {i < LP_STEPS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-8 -right-5 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">広告代理店との比較</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4"></th>
                  <th className="text-center py-4 px-4 text-primary font-bold">MapBoost AI</th>
                  <th className="text-center py-4 px-4 text-muted-foreground">広告代理店</th>
                  <th className="text-center py-4 px-4 text-muted-foreground">自力（Excel）</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["初期費用", "¥0", "¥50,000〜", "¥0"],
                  ["月額費用", "¥9,800〜", "¥100,000〜", "¥0（人件費大）"],
                  ["分析スピード", "30秒", "1〜2週間", "数日〜数週間"],
                  ["商圏分析", "AI自動", "人力", "手動"],
                  ["広告提案", "AI自動生成", "担当者次第", "なし"],
                  ["MEO対策", "AI診断", "別料金", "自力で勉強"],
                  ["レポート", "自動PDF", "月1回", "手作り"],
                ].map(([item, mapboost, agency, manual]) => (
                  <tr key={item} className="border-b border-border/40">
                    <td className="py-3 px-4 font-medium">{item}</td>
                    <td className="py-3 px-4 text-center text-primary font-semibold">{mapboost}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{agency}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{manual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">導入事例</h2>
          <p className="text-center text-muted-foreground mb-12">MapBoost AIを導入した店舗オーナーの声</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LP_TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.area}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">料金プラン</h2>
          <p className="text-center text-muted-foreground mb-12">広告代理店の1/10以下のコストで、同等以上の分析を</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LP_PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl border shadow-sm ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg scale-105"
                    : "border-border/60 bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold">
                    人気No.1
                  </div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                </div>
                <ul className="space-y-2 my-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-primary text-white shadow-md"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">よくある質問</h2>
          <div className="space-y-4">
            {LP_FAQ.map((faq) => (
              <div key={faq.q} className="p-5 rounded-xl bg-card border border-border/60">
                <h3 className="font-bold text-sm mb-2">Q. {faq.q}</h3>
                <p className="text-sm text-muted-foreground">A. {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="p-12 rounded-3xl shadow-xl" style={{ background: "linear-gradient(135deg, hsl(217 91% 55%), hsl(200 85% 52%))" }}>
            <h2 className="text-3xl font-black text-white mb-4">
              今すぐ、あなたの商圏を分析しませんか？
            </h2>
            <p className="text-white/80 mb-8">
              クレジットカード不要・30秒で結果が出ます
            </p>
            <Link to="/free-analysis">
              <Button size="lg" className="bg-white text-primary font-bold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all">
                無料で商圏分析する
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-muted-foreground space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, hsl(217 91% 55%), hsl(200 85% 52%))" }}
            >
              <Target className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-foreground">MapBoost AI</span>
          </div>
          <p>AI搭載エリアマーケティングプラットフォーム</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/tokushoho" className="hover:text-foreground transition-colors">特定商取引法</Link>
            <span className="text-border">|</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
            <span className="text-border">|</span>
            <Link to="/contact" className="hover:text-foreground transition-colors">お問い合わせ</Link>
          </div>
          <p>&copy; 2026 Far Beyond Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
