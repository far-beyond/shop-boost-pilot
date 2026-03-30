import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

const storeSchema = z.object({
  storeName: z.string().trim().min(1, "店舗名を入力してください").max(100, "100文字以内で入力してください"),
  industry: z.string().trim().min(1, "業種を入力してください").max(100, "100文字以内で入力してください"),
  address: z.string().trim().min(1, "住所を入力してください").max(200, "200文字以内で入力してください"),
  station: z.string().trim().max(100, "100文字以内で入力してください").optional().default(""),
  target: z.string().trim().max(200, "200文字以内で入力してください").optional().default(""),
  strengths: z.string().trim().max(500, "500文字以内で入力してください").optional().default(""),
  concerns: z.string().trim().max(500, "500文字以内で入力してください").optional().default(""),
  budget: z.string().trim().max(100, "100文字以内で入力してください").optional().default(""),
  competitors: z.string().trim().max(500, "500文字以内で入力してください").optional().default(""),
  media: z.array(z.string()).optional().default([]),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function StoreInput() {
  const navigate = useNavigate();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "",
      industry: "",
      address: "",
      station: "",
      target: "",
      strengths: "",
      concerns: "",
      budget: "",
      competitors: "",
      media: [],
    },
  });

  const onSubmit = (_data: StoreFormValues) => {
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="storeName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>店舗名 <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="例：カフェ モカ 渋谷店" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="industry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>業種 <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="例：カフェ・喫茶店" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>住所 <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="例：東京都渋谷区道玄坂1-2-3" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="station" render={({ field }) => (
                  <FormItem>
                    <FormLabel>最寄駅</FormLabel>
                    <FormControl><Input placeholder="例：渋谷駅 徒歩5分" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ターゲット層</FormLabel>
                    <FormControl><Input placeholder="例：20〜30代 会社員・フリーランス" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="strengths" render={({ field }) => (
                  <FormItem>
                    <FormLabel>店の強み</FormLabel>
                    <FormControl><Textarea placeholder="例：自家焙煎コーヒー、Wi-Fi完備、電源あり" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="concerns" render={({ field }) => (
                  <FormItem>
                    <FormLabel>現在の悩み</FormLabel>
                    <FormControl><Textarea placeholder="例：平日昼間の集客が弱い、SNS活用ができていない" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>月の広告・販促予算</FormLabel>
                    <FormControl><Input placeholder="例：5万円〜10万円" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="competitors" render={({ field }) => (
                  <FormItem>
                    <FormLabel>競合店舗</FormLabel>
                    <FormControl><Textarea placeholder="例：スターバックス渋谷店、タリーズ道玄坂店" rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="media" render={({ field }) => (
                  <FormItem>
                    <FormLabel>利用したい媒体（複数選択可）</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {mediaOptions.map((m) => (
                        <label
                          key={m}
                          className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={field.value?.includes(m)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked ? [...current, m] : current.filter((x) => x !== m)
                              );
                            }}
                          />
                          <span className="text-sm">{m}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" size="lg" className="w-full gap-2 text-base">
                  診断を開始する
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
