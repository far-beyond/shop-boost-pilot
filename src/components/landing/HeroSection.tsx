import { Link } from "react-router-dom";
import { ArrowRight, Play, MapPin, BarChart3, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const { t, language } = useLanguage();
  const isEn = language === "en";

  const highlights = [
    { icon: MapPin, text: isEn ? "Trade Area Analysis" : "商圏分析" },
    { icon: BarChart3, text: isEn ? "Census Data" : "国勢調査データ" },
    { icon: Target, text: isEn ? "Competitor Mapping" : "競合マッピング" },
    { icon: Zap, text: isEn ? "AI Proposals" : "AI施策提案" },
  ];

  return (
    <section className="relative py-24 md:py-36 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      {/* Faint grid background to evoke map analysis */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(217 91% 55%)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              {isEn ? "AI-Powered Local Marketing Platform" : "AI搭載ローカルマーケティングプラットフォーム"}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.15] tracking-tight mb-6">
              {isEn ? (
                <>
                  <span className="text-gradient">Map × AI</span> —
                  <br />
                  Smarter Local
                  <br />
                  Marketing
                </>
              ) : (
                <>
                  <span className="text-gradient">地図 × AI</span> で、
                  <br />
                  集客を、もっと
                  <br />
                  <span className="text-gradient">賢く。</span>
                </>
              )}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "Enter your address. Get instant trade area analysis, competitor insights, ad proposals, and flyer distribution plans — powered by real census data and AI."
                : "住所を入力するだけ。国勢調査の実データとAIが、商圏分析・競合調査・広告提案・チラシ配布プランを瞬時に作成します。"}
            </p>
          </motion.div>

          {/* Highlight chips */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-background/80 border border-border/60 rounded-full px-3 py-1.5 text-sm text-muted-foreground shadow-sm">
                <h.icon className="w-3.5 h-3.5 text-primary" />
                {h.text}
              </div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/map-analysis">
              <Button size="lg" className="text-base px-10 py-7 gap-2 shadow-lg hover:shadow-xl transition-shadow text-lg">
                {isEn ? "Try Free Analysis" : "無料で商圏分析する"}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#demo-video">
              <Button size="lg" variant="outline" className="text-base px-8 py-7 gap-2 text-lg">
                <Play className="w-4 h-4" />
                {isEn ? "Watch Demo" : "デモを見る"}
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            className="mt-6 text-sm text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {isEn
              ? "No credit card required. 10 free analyses per month."
              : "クレジットカード不要。月10回まで無料で分析できます。"}
          </motion.p>
        </div>

        {/* YouTube demo video */}
        <motion.div
          id="demo-video"
          className="mt-20 mx-auto max-w-[800px]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-center text-sm text-muted-foreground mb-4">
            {isEn ? "See MapBoost AI in action — 1 minute overview" : "1分でわかるMapBoost AI"}
          </p>
          <div className="relative w-full rounded-2xl border border-border/60 shadow-2xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/JGuL8-pJTtQ"
              title="MapBoost AI Demo"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
