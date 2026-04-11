import { Link } from "react-router-dom";
import { Target, ArrowRight, CheckCircle2, Star, Play, MapPin, BarChart3, TrendingUp, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function LP2() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-600 to-cyan-500">
              <Target className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">MapBoost AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/free-analysis">
              <Button variant="ghost" size="sm">無料分析</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">ログイン</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero - Full width photo */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img
          src="/images/lp2/hero.png"
          alt="MapBoost AI"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-sm font-medium mb-6 border border-white/20">
              <MapPin className="w-4 h-4" />
              エリアマーケティングをAIで自動化
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              あなたの店の<br />
              <span className="text-cyan-400">集客力</span>を、<br />
              劇的に変える。
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              住所を入力するだけ。AIが商圏を分析し、<br />
              最適な集客プランを自動で提案します。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/free-analysis">
                <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 py-6 text-base shadow-xl">
                  無料で商圏分析する
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base backdrop-blur"
                onClick={() => setShowVideo(true)}
              >
                <Play className="mr-2 w-5 h-5 fill-white" />
                デモを見る
              </Button>
            </div>
            <p className="text-sm text-white/50 mt-4">クレカ不要 ・ 30秒で結果表示</p>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="MapBoost AI デモ動画"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <div className="p-4 text-center">
              <Button variant="ghost" onClick={() => setShowVideo(false)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}

      {/* Trust bar */}
      <section className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: "30秒", label: "で分析完了" },
              { value: "全47", label: "都道府県対応" },
              { value: "¥0", label: "から利用可能" },
              { value: "国勢調査", label: "データ活用" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-blue-600">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data screen section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">AREA ANALYTICS</div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight">
                プロ級の商圏分析を、<br />
                <span className="text-blue-600">たった30秒</span>で。
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                国勢調査データ・競合情報・人口動態をAIがリアルタイムに分析。
                これまで専門家に依頼していた商圏分析が、住所を入力するだけで完了します。
              </p>
              <div className="space-y-4">
                {[
                  "半径1〜5kmの人口・世帯数を自動集計",
                  "競合店舗を地図上にマッピング",
                  "エリアごとのポテンシャルをスコア化",
                  "AIが最適な集客戦略を提案",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-cyan-50 rounded-3xl -z-10" />
              <img
                src="/images/lp2/data-screen.png"
                alt="商圏分析ダッシュボード"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">FEATURES</div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">すべてをワンストップで</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">商圏分析からチラシ配布、Web広告、MEO対策まで。集客に必要なすべてをひとつのプラットフォームで。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MapPin, title: "AI商圏分析", desc: "人口・世帯・競合を30秒で可視化", color: "bg-blue-50 text-blue-600" },
              { icon: BarChart3, title: "チラシ配布プラン", desc: "最適エリア・部数をAIが算出", color: "bg-green-50 text-green-600" },
              { icon: TrendingUp, title: "Web広告提案", desc: "Google/Meta広告を自動プランニング", color: "bg-purple-50 text-purple-600" },
              { icon: Shield, title: "MEO対策", desc: "Googleマップ上位表示をサポート", color: "bg-orange-50 text-orange-600" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Photo section - team */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="/images/lp2/team-meeting.png"
                alt="チームでデータ分析"
                className="w-full rounded-2xl shadow-xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">FOR YOUR TEAM</div>
              <h2 className="text-3xl font-black mb-6">
                データドリブンな<br />意思決定を、全員で。
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                直感に頼らない。データに基づく集客戦略を、チーム全員で共有。
                月次レポートの自動生成で、成果を見える化します。
              </p>
              <Link to="/free-analysis">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  無料で試してみる
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Success photo */}
      <section className="relative py-32 overflow-hidden">
        <img
          src="/images/lp2/busy-restaurant.png"
          alt="繁盛店"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            「お客さんが来ない」を、<br />
            「席が足りない」に。
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            MapBoost AIを導入した店舗の平均集客数は、3ヶ月で142%に向上。
            データに基づく集客で、あなたのお店も繁盛店へ。
          </p>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">COMPARISON</div>
            <h2 className="text-3xl font-black">広告代理店の1/10のコスト</h2>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left py-4 px-5 font-medium text-gray-500">比較項目</th>
                  <th className="text-center py-4 px-5 text-blue-600 font-bold">MapBoost AI</th>
                  <th className="text-center py-4 px-5 text-gray-400">広告代理店</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["月額費用", "¥9,800〜", "¥100,000〜"],
                  ["初期費用", "¥0", "¥50,000〜"],
                  ["分析スピード", "30秒", "1〜2週間"],
                  ["広告プラン提案", "AI自動生成", "担当者次第"],
                  ["MEO対策", "AI分析込み", "別途料金"],
                  ["レポート", "毎日自動更新", "月1回"],
                  ["解約", "いつでも可能", "違約金あり"],
                ].map(([item, ours, theirs]) => (
                  <tr key={item} className="border-t border-gray-100">
                    <td className="py-3.5 px-5 font-medium text-gray-700">{item}</td>
                    <td className="py-3.5 px-5 text-center text-blue-600 font-semibold bg-blue-50/50">{ours}</td>
                    <td className="py-3.5 px-5 text-center text-gray-400">{theirs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">TESTIMONIALS</div>
            <h2 className="text-3xl font-black">導入企業の声</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "焼肉店オーナー", area: "東京都 新宿区", text: "チラシの配布エリアをAIに任せたら、来店数が1.5倍に。今まで勘でやっていたのがバカらしくなりました。" },
              { name: "美容室オーナー", area: "大阪府 心斎橋", text: "MEO分析で改善点を教えてもらい、Googleマップの表示順位が3位から1位に。予約が30%増えました。" },
              { name: "整骨院 院長", area: "福岡県 博多区", text: "月9,800円でこの機能は破格。広告代理店に払っていた月15万円が浮いて、その分をスタッフの給与に回せました。" },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{t.text}"</p>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-gray-400">{t.area}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">PRICING</div>
            <h2 className="text-3xl font-black mb-4">シンプルな料金体系</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "¥0", period: "月額", features: ["月3回 商圏分析", "基本エリアマップ", "CSV出力"], highlight: false },
              { name: "Standard", price: "¥9,800", period: "月額（税別）", features: ["月30回 商圏分析", "競合マッピング", "チラシ配布プラン", "AI広告提案", "発注書PDF"], highlight: true },
              { name: "Pro", price: "¥29,800", period: "月額（税別）", features: ["無制限 商圏分析", "MEO分析", "月次レポート自動化", "店舗比較（5店舗）", "統合媒体プラン"], highlight: false },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-6 border transition-all hover:shadow-lg ${plan.highlight ? "border-blue-500 bg-blue-50/30 shadow-lg scale-105" : "border-gray-200 bg-white"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">POPULAR</div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black">{plan.price}</span>
                  <span className="text-sm text-gray-400">/ {plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button className={`w-full ${plan.highlight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
                    {plan.highlight ? "7日間無料トライアル" : "無料で始める"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beauty salon section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-4">MULTI-INDUSTRY</div>
              <h2 className="text-3xl font-black mb-6">
                飲食店だけじゃない。<br />
                あらゆる業種に対応。
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                美容室、整骨院、歯科医院、学習塾、不動産...
                地域密着型のビジネスなら、業種を問わずご活用いただけます。
              </p>
              <div className="flex flex-wrap gap-2">
                {["飲食店", "美容室", "整骨院", "歯科医院", "学習塾", "不動産", "クリーニング", "フィットネス"].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <img
                src="/images/lp2/beauty-salon.png"
                alt="美容室での活用"
                className="w-full rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-cyan-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            今すぐ、あなたの商圏を<br />分析しませんか？
          </h2>
          <p className="text-lg text-white/80 mb-8">
            30秒で結果が出ます。クレジットカードは不要です。
          </p>
          <Link to="/free-analysis">
            <Button size="lg" className="bg-white text-blue-600 font-bold px-10 py-7 text-lg shadow-2xl hover:shadow-xl transition-all hover:scale-105">
              無料で商圏分析する
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-gray-400 space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white bg-gradient-to-br from-blue-600 to-cyan-500">
              <Target className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-gray-800">MapBoost AI</span>
          </div>
          <p>AI搭載エリアマーケティングプラットフォーム</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/tokushoho" className="hover:text-gray-700 transition-colors">特定商取引法</Link>
            <span className="text-gray-200">|</span>
            <Link to="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link>
            <span className="text-gray-200">|</span>
            <Link to="/contact" className="hover:text-gray-700 transition-colors">お問い合わせ</Link>
          </div>
          <p>&copy; 2026 Far Beyond Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
