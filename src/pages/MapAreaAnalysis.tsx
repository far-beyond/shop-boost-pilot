import { useState, useEffect, useMemo } from "react";
import { MapPin, Users, Home, TrendingUp, Loader2, Search, Building2, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  fetchMapAreaAnalysis,
  type MapAreaAnalysisResult,
  type PopulationZone,
  type CompetitorStore,
} from "@/lib/mapAreaService";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const storeIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const competitorIcon = new L.DivIcon({
  html: `<div style="background:#ef4444;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const RADIUS_OPTIONS = [
  { label: "1km", value: "1km", meters: 1000 },
  { label: "3km", value: "3km", meters: 3000 },
  { label: "5km", value: "5km", meters: 5000 },
];

const DENSITY_COLORS: Record<string, string> = {
  high: "rgba(239, 68, 68, 0.25)",
  medium: "rgba(245, 158, 11, 0.20)",
  low: "rgba(34, 197, 94, 0.15)",
};

const DENSITY_BORDERS: Record<string, string> = {
  high: "rgba(239, 68, 68, 0.5)",
  medium: "rgba(245, 158, 11, 0.4)",
  low: "rgba(34, 197, 94, 0.3)",
};

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

export default function MapAreaAnalysis() {
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [radius, setRadius] = useState<string>("3km");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapAreaAnalysisResult | null>(null);

  const radiusMeta = RADIUS_OPTIONS.find((r) => r.value === radius)!;
  const mapCenter = result?.center || [35.6812, 139.7671] as [number, number];
  const mapZoom = radius === "1km" ? 15 : radius === "3km" ? 13 : 12;

  const handleAnalyze = async () => {
    if (!address.trim()) {
      toast.error("住所を入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMapAreaAnalysis(address, radius, industry || undefined);
      setResult(data);
      toast.success("分析が完了しました");
    } catch (e: any) {
      const msg = e?.message || "分析中にエラーが発生しました";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative min-h-[400px]">
          {/* Search bar overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1000] lg:right-auto lg:w-[420px]">
            <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="住所を入力（例：東京都渋谷区道玄坂1-1）"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  />
                  <Button size="sm" onClick={handleAnalyze} disabled={loading} className="shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="業種（任意）"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="text-sm flex-1"
                  />
                  <div className="flex bg-muted rounded-md p-0.5">
                    {RADIUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRadius(opt.value)}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                          radius === opt.value
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legend overlay */}
          {result && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 凡例
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-full bg-red-400/60 border border-red-500/50" /> 高密度
                    <span className="w-3 h-3 rounded-full bg-yellow-400/50 border border-yellow-500/40 ml-2" /> 中密度
                    <span className="w-3 h-3 rounded-full bg-green-400/40 border border-green-500/30 ml-2" /> 低密度
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white" /> 競合店舗
                    <MapPin className="w-3 h-3 text-primary ml-2" /> 候補地
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />

            {/* Trade area circle */}
            <Circle
              center={mapCenter}
              radius={radiusMeta.meters}
              pathOptions={{
                color: "hsl(217, 91%, 55%)",
                fillColor: "hsl(217, 91%, 55%)",
                fillOpacity: 0.08,
                weight: 2,
                dashArray: "6 4",
              }}
            />

            {/* Store candidate pin */}
            {result && <Marker position={mapCenter} icon={storeIcon}>
              <Popup>
                <strong>候補地</strong><br />{address}
              </Popup>
            </Marker>}

            {/* Population density zones */}
            {result?.populationZones.map((zone) => (
              <Circle
                key={zone.id}
                center={zone.center}
                radius={zone.radius}
                pathOptions={{
                  color: DENSITY_BORDERS[zone.density],
                  fillColor: DENSITY_COLORS[zone.density],
                  fillOpacity: 1,
                  weight: 1,
                }}
              >
                <Popup>
                  <strong>{zone.label}</strong><br />
                  推定人口: {zone.population.toLocaleString()}人<br />
                  密度: {zone.density === "high" ? "高" : zone.density === "medium" ? "中" : "低"}
                </Popup>
              </Circle>
            ))}

            {/* Competitor markers */}
            {result?.competitors.map((comp) => (
              <Marker key={comp.id} position={[comp.lat, comp.lng]} icon={competitorIcon}>
                <Popup>
                  <strong>{comp.name}</strong><br />
                  業種: {comp.industry}<br />
                  距離: {comp.distance}m
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Analysis side panel */}
        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border/60 bg-card overflow-y-auto">
          {loading ? (
            <SidePanelSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={handleAnalyze} />
          ) : result ? (
            <AnalysisPanel result={result} radius={radius} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <MapPin className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">地図商圏分析</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">
        住所を入力して分析を開始してください。商圏内の人口分布・競合状況を地図上に可視化します。
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">エラーが発生しました</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[260px]">{message}</p>
      <Button size="sm" onClick={onRetry}>再試行</Button>
    </div>
  );
}

function SidePanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-32 rounded-lg" />
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-lg" />
      ))}
    </div>
  );
}

function AnalysisPanel({ result, radius }: { result: MapAreaAnalysisResult; radius: string }) {
  const { summary, competitors } = result;

  return (
    <motion.div
      className="p-4 space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base text-foreground">分析結果</h2>
        <Badge variant="secondary" className="text-xs">半径 {radius}</Badge>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users className="w-4 h-4 text-primary" />} label="総人口" value={summary.totalPopulation.toLocaleString()} unit="人" />
        <StatCard icon={<Home className="w-4 h-4 text-primary" />} label="世帯数" value={(summary.householdTypes.reduce((s, h) => s + h.count, 0) || Math.round(summary.totalPopulation / 2.3)).toLocaleString()} unit="世帯" />
        <StatCard icon={<Building2 className="w-4 h-4 text-amber-500" />} label="競合店舗" value={String(summary.competitorCount)} unit="店" />
        <div className="rounded-lg border border-border/60 bg-background p-3 flex flex-col items-center justify-center gap-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> 商圏スコア
          </span>
          <ScoreGauge score={summary.tradeAreaScore} />
        </div>
      </div>

      {/* Age distribution */}
      {summary.ageDistribution.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">年齢構成</h3>
          <div className="space-y-2">
            {summary.ageDistribution.map((ag) => (
              <div key={ag.ageGroup} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{ag.ageGroup}</span>
                  <span className="text-muted-foreground">{ag.percentage}% ({ag.count.toLocaleString()}人)</span>
                </div>
                <Progress value={ag.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Household types */}
      {summary.householdTypes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">世帯構成</h3>
          <div className="space-y-2">
            {summary.householdTypes.map((ht) => (
              <div key={ht.type} className="flex justify-between items-center text-xs bg-muted/40 rounded-md px-3 py-2">
                <span className="text-foreground">{ht.type}</span>
                <div className="text-right">
                  <span className="font-medium text-foreground">{ht.percentage}%</span>
                  <span className="text-muted-foreground ml-1">({ht.count.toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Competitors list */}
      {competitors.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            競合店舗 ({competitors.length}件)
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {competitors.map((c) => (
              <div key={c.id} className="flex justify-between items-center text-xs bg-muted/40 rounded-md px-3 py-2">
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground ml-1.5">{c.industry}</span>
                </div>
                <span className="text-muted-foreground">{c.distance}m</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">推奨施策</h3>
          <div className="space-y-2">
            {summary.recommendations.map((rec, i) => (
              <div key={i} className="text-xs bg-primary/5 border border-primary/10 rounded-md px-3 py-2 text-foreground">
                {rec}
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background p-3 space-y-1">
      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
        {icon} {label}
      </span>
      <div>
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
      </div>
    </div>
  );
}
