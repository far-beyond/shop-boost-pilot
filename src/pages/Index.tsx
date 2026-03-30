import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileText, Map, MessageSquare, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";

const features = [
  {
    icon: Target,
    title: "集客診断",
    description: "商圏・客層・競合を分析し、店舗の強み・弱みを可視化します。",
  },
  {
    icon: Zap,
    title: "優先施策の提案",
    description: "今すぐ取り組むべき施策を3つ、根拠付きで提案します。",
  },
  {
    icon: MessageSquare,
    title: "販促文の自動生成",
    description: "Google・Instagram・LINE等の媒体別に、すぐ使える文面を作成します。",
  },
  {
    icon: BarChart3,
    title: "KPI設計",
    description: "集客施策の効果を測るための指標と目標値を自動設計します。",
  },
];

const steps = [
  { step: "01", title: "店舗情報を入力", description: "業種・住所・強み・悩みなどを入力" },
  { step: "02", title: "AIが分析・提案", description: "数秒で診断結果と施策を表示" },
  { step: "03", title: "販促文を生成", description: "各媒体向けの文面をワンクリック作成" },
  { step: "04", title: "実行 & 改善", description: "KPIを見ながら施策を実行・改善" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 md:py-32" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
            <Map className="w-4 h-4" />
            マップ連動型 店舗集客AI
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            あなたのお店に合う集客施策を、
            <br className="hidden sm:block" />
            <span className="text-primary">数分で提案します</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            店舗情報を入力するだけで、商圏・客層・競合をふまえた集客プランをAIが作成します。
          </p>
          <Link to="/input">
            <Button size="lg" className="text-base px-8 gap-2">
              無料で診断する
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
            MapBoost AI でできること
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            店舗情報を入力するだけで、4つの分析・提案を自動で行います。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <Card key={f.title} className="border border-border shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                    <f.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription>{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            導入イメージ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-4xl font-bold text-primary/20 mb-2">{s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            まずは無料で診断してみましょう
          </h2>
          <p className="text-muted-foreground mb-8">所要時間は約3分。登録不要ですぐに始められます。</p>
          <Link to="/input">
            <Button size="lg" className="text-base px-8 gap-2">
              無料で診断する
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
