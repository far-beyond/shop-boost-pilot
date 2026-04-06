import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Loader2, Plus, Trash2, Building2, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  fetchStoreCandidates,
  createStoreCandidate,
  deleteStoreCandidate,
  type StoreCandidate,
} from "@/lib/storeCandidateService";

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const schema = z.object({
  store_name: z.string().trim().min(1, "店舗名を入力してください").max(100),
  industry: z.string().trim().min(1, "業種を入力してください").max(100),
  address: z.string().trim().min(1, "住所を入力してください").max(200),
  latitude: z.string().optional().default(""),
  longitude: z.string().optional().default(""),
  memo: z.string().max(1000).optional().default(""),
});

type FormValues = z.infer<typeof schema>;

export default function StoreCandidateInput() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ["store-candidates"],
    queryFn: fetchStoreCandidates,
  });

  const createMutation = useMutation({
    mutationFn: createStoreCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-candidates"] });
      toast.success("出店候補地を登録しました");
      setShowForm(false);
      form.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStoreCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-candidates"] });
      toast.success("候補地を削除しました");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { store_name: "", industry: "", address: "", latitude: "", longitude: "", memo: "" },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate({
      store_name: data.store_name,
      industry: data.industry,
      address: data.address,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      memo: data.memo || null,
    });
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-4xl">
          {/* Header */}
          <motion.div className="mb-8" {...fadeUp}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-2">
              <Building2 className="w-3.5 h-3.5" />
              出店候補地管理
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">出店候補地の登録</h1>
            <p className="text-sm text-muted-foreground mt-1">
              出店を検討しているエリアを登録し、商圏分析や媒体プランに活用できます。
            </p>
          </motion.div>

          {/* Add Button */}
          <motion.div {...fadeUp} className="mb-6">
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              {showForm ? "フォームを閉じる" : "新しい候補地を追加"}
            </Button>
          </motion.div>

          {/* Form */}
          {showForm && (
            <motion.div {...fadeUp} className="mb-8">
              <Card className="border border-border/60">
                <CardHeader>
                  <CardTitle className="text-base">候補地情報を入力</CardTitle>
                  <CardDescription>できるだけ詳しく入力すると、分析精度が向上します。</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="store_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>店舗名 <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="例: カフェ モカ 渋谷店" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="industry" render={({ field }) => (
                          <FormItem>
                            <FormLabel>業種 <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input placeholder="例: カフェ・喫茶店" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>住所 <span className="text-destructive">*</span></FormLabel>
                          <FormControl><Input placeholder="例: 東京都渋谷区道玄坂1-2-3" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="latitude" render={({ field }) => (
                          <FormItem>
                            <FormLabel>緯度（任意）</FormLabel>
                            <FormControl><Input placeholder="例: 35.6595" type="number" step="any" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="longitude" render={({ field }) => (
                          <FormItem>
                            <FormLabel>経度（任意）</FormLabel>
                            <FormControl><Input placeholder="例: 139.7004" type="number" step="any" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={form.control} name="memo" render={({ field }) => (
                        <FormItem>
                          <FormLabel>出店候補地メモ（任意）</FormLabel>
                          <FormControl>
                            <Textarea placeholder="例: 駅前ロータリー正面、人通り多い。近隣に競合カフェ2店舗あり。" rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {createMutation.isPending ? "登録中..." : "候補地を登録"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="py-12 text-center">
                <p className="text-destructive font-medium">データの取得に失敗しました</p>
                <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
              </CardContent>
            </Card>
          ) : !candidates?.length ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-1">候補地がまだありません</h3>
                <p className="text-sm text-muted-foreground mb-6">出店を検討しているエリアを登録しましょう。</p>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  最初の候補地を追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((c: StoreCandidate, i: number) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border border-border/60 hover:border-primary/20 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-foreground">{c.store_name}</h3>
                          <Badge variant="secondary" className="text-[10px] mt-1">{c.industry}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                          onClick={() => deleteMutation.mutate(c.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{c.address}</span>
                        </div>
                        {(c.latitude || c.longitude) && (
                          <div className="flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 shrink-0" />
                            <span>{c.latitude}, {c.longitude}</span>
                          </div>
                        )}
                        {c.memo && (
                          <p className="text-xs text-muted-foreground/80 mt-2 line-clamp-2">{c.memo}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                        <Badge variant="outline" className="text-[10px]">{c.status === "draft" ? "下書き" : c.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
