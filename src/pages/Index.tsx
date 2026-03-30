import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, FileText, Map, MapPin, MessageSquare, Target, Zap, Store, TrendingUp, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

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

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto h-64 md:h-80">
      {/* Map background blob */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-30"
        style={{ background: "var(--gradient-primary)" }}
        animate={{ scale: [1, 1.04, 1], rotate: [0, 1, -1, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern overlay */}
      <svg className="absolute inset-0 w-full h-full rounded-3xl opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(215 90% 52%)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Map pins */}
      {[
        { x: "22%", y: "25%", delay: 0.4, size: "lg" },
        { x: "68%", y: "35%", delay: 0.6, size: "sm" },
        { x: "45%", y: "72%", delay: 0.8, size: "sm" },
      ].map((pin, i) => (
        <motion.div
          key={`pin-${i}`}
          className="absolute flex flex-col items-center"
          style={{ left: pin.x, top: pin.y }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: pin.delay, type: "spring", stiffness: 200, damping: 12 }}
        >
          <MapPin className={`${pin.size === "lg" ? "w-6 h-6" : "w-4 h-4"} text-primary drop-shadow-sm`} />
          <motion.div
            className={`${pin.size === "lg" ? "w-3 h-1" : "w-2 h-0.5"} rounded-full bg-primary/20 mt-0.5`}
            animate={{ scaleX: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      ))}

      {/* Radius circle around main pin */}
      <motion.div
        className="absolute rounded-full border border-dashed border-primary/20"
        style={{ left: "22%", top: "25%", width: "100px", height: "100px", transform: "translate(-50%, -30%)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
      />

      {/* Central store icon */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-2xl bg-card shadow-lg flex items-center justify-center border border-border"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        <Store className="w-9 h-9 text-primary" />
      </motion.div>

      {/* Orbiting icons */}
      {[
        { Icon: Users, x: "15%", y: "20%", delay: 0.5 },
        { Icon: TrendingUp, x: "75%", y: "15%", delay: 0.7 },
        { Icon: Search, x: "80%", y: "65%", delay: 0.9 },
        { Icon: BarChart3, x: "10%", y: "70%", delay: 1.1 },
      ].map(({ Icon, x, y, delay }, i) => (
        <motion.div
          key={i}
          className="absolute w-12 h-12 rounded-xl bg-card shadow-md flex items-center justify-center border border-border"
          style={{ left: x, top: y }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay, type: "spring", stiffness: 180 }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </motion.div>
      ))}

      {/* Connecting lines (decorative dots) */}
      {[
        { x: "35%", y: "30%", delay: 1.3 },
        { x: "60%", y: "28%", delay: 1.4 },
        { x: "65%", y: "55%", delay: 1.5 },
        { x: "30%", y: "60%", delay: 1.6 },
      ].map((dot, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-2 h-2 rounded-full bg-primary/40"
          style={{ left: dot.x, top: dot.y }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1, 0.6, 1] }}
          transition={{ delay: dot.delay, duration: 0.6 }}
        />
      ))}

      {/* Floating metric cards */}
      <motion.div
        className="absolute right-0 top-4 bg-card rounded-lg shadow-md border border-border px-3 py-2 text-xs"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <span className="text-muted-foreground">来店率</span>
        <span className="block text-primary font-bold text-sm">+32%</span>
      </motion.div>

      <motion.div
        className="absolute left-0 bottom-4 bg-card rounded-lg shadow-md border border-border px-3 py-2 text-xs"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.7, duration: 0.5 }}
      >
        <span className="text-muted-foreground">認知度</span>
        <span className="block text-accent font-bold text-sm">+58%</span>
      </motion.div>

      {/* Pulse ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-primary/20"
        animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
      />
    </div>
  );
}

export default function Index() {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 md:py-28 overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                <Map className="w-4 h-4" />
                マップ連動型 店舗集客AI
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
                あなたのお店に合う集客施策を、
                <br className="hidden sm:block" />
                <span className="text-primary">数分で提案します</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                店舗情報を入力するだけで、商圏・客層・競合をふまえた集客プランをAIが作成します。
              </p>
              <Link to="/input">
                <Button size="lg" className="text-base px-8 gap-2">
                  無料で診断する
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <HeroIllustration />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
              MapBoost AI でできること
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              店舗情報を入力するだけで、4つの分析・提案を自動で行います。
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card className="border border-border shadow-sm hover:shadow-md transition-shadow h-full">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
                      <f.icon className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
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
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                className="text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
              >
                <div className="text-4xl font-bold text-primary/20 mb-2">{s.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </motion.div>
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
