import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Layout from "@/components/Layout";
import { ArrowRight, Store } from "lucide-react";

const mediaOptions = [
  "Googleビジネスプロフィール",
  "Instagram",
  "X（Twitter）",
  "LINE公式アカウント",
  "チラシ・ポスティング",
  "Web広告（Google/Meta）",
  "食べログ・ホットペッパー等",
];

export default function StoreInput() {
  const navigate = useNavigate();
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  const toggleMedia = (m: string) => {
    setSelectedMedia((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/diagnosis");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Store className="w-4 h-4" />
            店舗情報入力
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            店舗の情報を教えてください
          </h1>
          <p className="text-muted-foreground">
            入力内容をもとに、AIが集客診断と施策を提案します。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>
              できるだけ詳しく入力いただくと、より精度の高い診断が可能です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">店舗名 *</Label>
                <Input id="storeName" placeholder="例：カフェ モカ 渋谷店" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">業種 *</Label>
                <Input id="industry" placeholder="例：カフェ・喫茶店" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">住所 *</Label>
                <Input id="address" placeholder="例：東京都渋谷区道玄坂1-2-3" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station">最寄駅</Label>
                <Input id="station" placeholder="例：渋谷駅 徒歩5分" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">ターゲット層</Label>
                <Input id="target" placeholder="例：20〜30代 会社員・フリーランス" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strengths">店の強み</Label>
                <Textarea id="strengths" placeholder="例：自家焙煎コーヒー、Wi-Fi完備、電源あり" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="concerns">現在の悩み</Label>
                <Textarea id="concerns" placeholder="例：平日昼間の集客が弱い、SNS活用ができていない" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">月の広告・販促予算</Label>
                <Input id="budget" placeholder="例：5万円〜10万円" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitors">競合店舗</Label>
                <Textarea id="competitors" placeholder="例：スターバックス渋谷店、タリーズ道玄坂店" rows={2} />
              </div>

              <div className="space-y-3">
                <Label>利用したい媒体（複数選択可）</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mediaOptions.map((m) => (
                    <label
                      key={m}
                      className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedMedia.includes(m)}
                        onCheckedChange={() => toggleMedia(m)}
                      />
                      <span className="text-sm">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 text-base">
                診断を開始する
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
