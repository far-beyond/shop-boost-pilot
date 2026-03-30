import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, CheckCircle2, Target, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { dummyDiagnosis } from "@/lib/dummyData";

export default function Diagnosis() {
  const d = dummyDiagnosis;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <Target className="w-4 h-4" />
            診断結果
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            カフェ モカ 渋谷店の集客診断
          </h1>
          <p className="text-muted-foreground">AIが分析した結果をもとに、最適な施策を提案します。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                店舗の強み
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {d.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-accent mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                弱み・課題
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {d.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-0.5">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Target Customers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                狙うべき客層
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{d.targetCustomers}</p>
            </CardContent>
          </Card>

          {/* Differentiation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                差別化ポイント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {d.differentiationPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">◆</span>
                    {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Bottlenecks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>集客ボトルネック</CardTitle>
            <CardDescription>現在の集客を妨げている主な要因</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {d.bottlenecks.map((b, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                  {b}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <h2 className="text-xl font-bold text-foreground mb-4">今すぐやるべき施策 3つ</h2>
        <div className="space-y-4 mb-10">
          {d.actions.map((a, i) => (
            <Card key={i} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </span>
                  {a.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{a.reason}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">概算コスト</span>
                    <span className="font-medium">{a.estimatedCost}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">難易度</span>
                    <span className="font-medium">{a.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">効果の目安</span>
                    <span className="font-medium">{a.expectedEffect}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/promo">
            <Button size="lg" className="gap-2 text-base px-8">
              販促文を作る
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
