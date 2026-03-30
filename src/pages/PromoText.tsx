import { useState } from "react";
import { Copy, RefreshCw, Heart, Flame, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { dummyPromoTexts } from "@/lib/dummyData";
import { toast } from "sonner";

const tabs = ["Googleビジネスプロフィール", "Instagram", "X", "チラシ", "LINE", "広告見出し"];

export default function PromoText() {
  const [texts, setTexts] = useState(dummyPromoTexts);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("クリップボードにコピーしました");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            販促文の自動生成
          </h1>
          <p className="text-muted-foreground">
            媒体ごとにすぐ使える販促文を生成しました。編集・コピーしてご活用ください。
          </p>
        </div>

        <Tabs defaultValue={tabs[0]}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            {tabs.map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {(texts[tab] || []).map((text, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-sm text-foreground mb-4 leading-relaxed">
                      {text}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleCopy(text)}>
                        <Copy className="w-3.5 h-3.5" />
                        コピー
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("別案を生成中…（デモ）")}>
                        <RefreshCw className="w-3.5 h-3.5" />
                        別案を出す
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("やわらかい表現に調整中…（デモ）")}>
                        <Heart className="w-3.5 h-3.5" />
                        やわらかく
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("力強い表現に調整中…（デモ）")}>
                        <Flame className="w-3.5 h-3.5" />
                        力強く
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => toast.info("ターゲット向けに調整中…（デモ）")}>
                        <Users className="w-3.5 h-3.5" />
                        ターゲット向け
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
