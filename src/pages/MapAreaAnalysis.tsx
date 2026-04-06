import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Users, Home, TrendingUp, Loader2, Search, Building2, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  fetchMapAreaAnalysis,
  type MapAreaAnalysisResult,
} from "@/lib/mapAreaService";
import {
  generateTownPolygons,
  resolvePolygonNames,
  getHeatmapColor,
  getHeatmapValue,
  calculateFlyerSelection,
  type HeatmapMode,
  type LayerMode,
  type CandidatePin,
  type TownFeatureCollection,
  type TownPolygonProperties,
} from "@/lib/mapGeoData";
import { Database } from "lucide-react";
import MapControls from "@/components/map/MapControls";
import FlyerSelectionPanel from "@/components/map/FlyerSelectionPanel";
import CandidateComparison from "@/components/map/CandidateComparison";

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

const candidateIcon = new L.DivIcon({
  html: `<div style="background:hsl(217,91%,55%);width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const RADIUS_OPTIONS = [
  { label: "1km", value: "1km", meters: 1000 },
  { label: "3km", value: "3km", meters: 3000 },
  { label: "5km", value: "5km", meters: 5000 },
];

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? "text-green-500" : score >= 50 ? "text-yellow-500" : "text-red-500";
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

// Pure Leaflet map component (no react-leaflet)
function LeafletMap({
  center,
  zoom,
  radiusMeters,
  result,
  address,
  townPolygons,
  geoJsonStyle,
  onTownClick,
  activeLayer,
  candidates,
  onMapClick,
  heatmapMode,
  selectedTownIds,
}: {
  center: [number, number];
  zoom: number;
  radiusMeters: number;
  result: MapAreaAnalysisResult | null;
  address: string;
  townPolygons: TownFeatureCollection;
  geoJsonStyle: (feature: any) => L.PathOptions;
  onTownClick: (townId: string) => void;
  activeLayer: LayerMode;
  candidates: CandidatePin[];
  onMapClick: (lat: number, lng: number) => void;
  heatmapMode: HeatmapMode;
  selectedTownIds: string[];
}) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<{
    tradeCircle?: L.Circle;
    storeMarker?: L.Marker;
    geoJsonLayer?: L.GeoJSON;
    competitorMarkers: L.Marker[];
    candidateMarkers: L.Marker[];
  }>({ competitorMarkers: [], candidateMarkers: [] });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off("click");
    map.on("click", (e) => onMapClick(e.latlng.lat, e.latlng.lng));
  }, [onMapClick]);

  // Update center/zoom
  useEffect(() => {
    mapRef.current?.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  // Trade area circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.tradeCircle?.remove();
    const circle = L.circle(center, {
      radius: radiusMeters,
      color: "hsl(217, 91%, 55%)",
      fillColor: "hsl(217, 91%, 55%)",
      fillOpacity: 0.06,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);
    layersRef.current.tradeCircle = circle;
  }, [center, radiusMeters]);

  // Store marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.storeMarker?.remove();
    if (result) {
      const marker = L.marker(center, { icon: storeIcon })
        .bindPopup(`<strong>候補地</strong><br/>${address}`)
        .addTo(map);
      layersRef.current.storeMarker = marker;
    }
  }, [result, center, address]);

  // GeoJSON polygons
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.geoJsonLayer?.remove();
    if (activeLayer === "density" || activeLayer === "recommended") {
      const layer = L.geoJSON(townPolygons as any, {
        style: geoJsonStyle,
        onEachFeature: (feature, layer) => {
          const props = feature.properties as TownPolygonProperties;
          layer.bindPopup(
            `<strong>${props.name}</strong><br/>人口: ${props.population.toLocaleString()}人<br/>世帯数: ${props.households.toLocaleString()}<br/>平均年齢: ${props.avgAge}歳`
          );
          layer.on("click", () => onTownClick(props.id));
        },
      }).addTo(map);
      layersRef.current.geoJsonLayer = layer;
    }
  }, [townPolygons, activeLayer, geoJsonStyle, onTownClick, heatmapMode, selectedTownIds]);

  // Competitor markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.competitorMarkers.forEach((m) => m.remove());
    layersRef.current.competitorMarkers = [];
    if (activeLayer !== "recommended" && result) {
      for (const comp of result.competitors) {
        const m = L.marker([comp.lat, comp.lng], { icon: competitorIcon })
          .bindPopup(`<strong>${comp.name}</strong><br/>業種: ${comp.industry}<br/>距離: ${comp.distance}m`)
          .addTo(map);
        layersRef.current.competitorMarkers.push(m);
      }
    }
  }, [result, activeLayer]);

  // Candidate markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.candidateMarkers.forEach((m) => m.remove());
    layersRef.current.candidateMarkers = [];
    for (const c of candidates) {
      const m = L.marker([c.lat, c.lng], { icon: candidateIcon })
        .bindPopup(`<strong>${c.label}</strong><br/>スコア: ${c.score}点<br/>人口: ${c.population.toLocaleString()}人`)
        .addTo(map);
      layersRef.current.candidateMarkers.push(m);
    }
  }, [candidates]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default function MapAreaAnalysis() {
  const { t, language } = useLanguage();
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("");
  const [radius, setRadius] = useState<string>("3km");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MapAreaAnalysisResult | null>(null);

  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("population");
  const [activeLayer, setActiveLayer] = useState<LayerMode>("density");
  const [flyerMode, setFlyerMode] = useState(false);
  const [multiPinMode, setMultiPinMode] = useState(false);
  const [selectedTownIds, setSelectedTownIds] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<CandidatePin[]>([]);

  const radiusMeta = RADIUS_OPTIONS.find((r) => r.value === radius)!;
  const mapCenter: [number, number] = result?.center || [35.6812, 139.7671];
  const mapZoom = radius === "1km" ? 15 : radius === "3km" ? 13 : 12;
  const radiusKm = parseFloat(radius.replace("km", ""));

  // Generate polygons after search, then resolve real place names asynchronously
  const [townPolygons, setTownPolygons] = useState<TownFeatureCollection>({ type: "FeatureCollection", features: [] });

  useEffect(() => {
    if (!result) {
      setTownPolygons({ type: "FeatureCollection", features: [] });
      return;
    }
    const censusData = result.censusData
      ? {
          totalPopulation: result.summary.totalPopulation,
          totalHouseholds: result.summary.totalHouseholds,
          avgAge: result.censusData.ageDistribution?.length
            ? Math.round(result.censusData.ageDistribution.reduce((s, a) => s + a.population, 0) / result.censusData.ageDistribution.length)
            : undefined,
        }
      : undefined;
    const base = generateTownPolygons(mapCenter, radiusKm, censusData);
    setTownPolygons(base);
    // Resolve real place names in background
    resolvePolygonNames(base).then((resolved) => setTownPolygons(resolved));
  }, [result, mapCenter[0], mapCenter[1], radiusKm]);

  const flyerSelection = useMemo(
    () => calculateFlyerSelection(selectedTownIds, townPolygons),
    [selectedTownIds, townPolygons]
  );

  const handleAnalyze = async () => {
    if (!address.trim()) {
      toast.error(t("map.enterAddress"));
      return;
    }
    setLoading(true);
    setError(null);
    setSelectedTownIds([]);
    try {
      const data = await fetchMapAreaAnalysis(address, radius, industry || undefined, language);
      setResult(data);
      toast.success(t("map.analysisComplete"));
    } catch (e: any) {
      const msg = e?.message || t("map.analysisError");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (multiPinMode) {
        setCandidates((prev) => [
          ...prev,
          {
            id: `cand-${Date.now()}`,
            label: `${t("map.candidateLabel")} ${prev.length + 1}`,
            lat,
            lng,
            score: Math.round(40 + Math.random() * 50),
            population: Math.round(5000 + Math.random() * 30000),
            competitors: Math.round(2 + Math.random() * 10),
          },
        ]);
        toast.success(t("map.candidateAdded"));
      }
    },
    [multiPinMode]
  );

  const handleTownClick = useCallback(
    (townId: string) => {
      if (!flyerMode) return;
      setSelectedTownIds((prev) =>
        prev.includes(townId) ? prev.filter((id) => id !== townId) : [...prev, townId]
      );
    },
    [flyerMode]
  );

  const geoJsonStyle = useCallback(
    (feature: any) => {
      const props = feature.properties as TownPolygonProperties;
      const isSelected = selectedTownIds.includes(props.id);
      const val = getHeatmapValue(props, heatmapMode);

      if (activeLayer === "recommended") {
        const isRec = props.population > 2500 && props.densityRank !== "low";
        return {
          fillColor: isRec ? "hsl(142, 71%, 45%)" : "hsl(0, 0%, 80%)",
          fillOpacity: isSelected ? 0.7 : 0.35,
          color: isSelected ? "hsl(217, 91%, 55%)" : "hsl(0, 0%, 60%)",
          weight: isSelected ? 3 : 1,
        };
      }

      return {
        fillColor: getHeatmapColor(val, heatmapMode),
        fillOpacity: isSelected ? 0.7 : 0.4,
        color: isSelected ? "hsl(217, 91%, 55%)" : "rgba(0,0,0,0.2)",
        weight: isSelected ? 3 : 1,
      };
    },
    [heatmapMode, activeLayer, selectedTownIds]
  );

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
                    placeholder={t("map.searchPh")}
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
                    placeholder={t("map.industryPh")}
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

          {/* Controls overlay */}
          <div className="absolute top-4 right-4 z-[1000] hidden lg:block lg:w-[280px]">
            <MapControls
              heatmapMode={heatmapMode}
              onHeatmapModeChange={setHeatmapMode}
              activeLayer={activeLayer}
              onLayerChange={setActiveLayer}
              flyerMode={flyerMode}
              onFlyerModeToggle={() => setFlyerMode((f) => !f)}
              multiPinMode={multiPinMode}
              onMultiPinModeToggle={() => setMultiPinMode((m) => !m)}
            />
          </div>

          {/* Flyer selection panel */}
          {flyerMode && (
            <div className="absolute bottom-4 left-4 z-[1000] w-[260px]">
              <FlyerSelectionPanel
                selection={flyerSelection}
                towns={townPolygons}
                onClear={() => setSelectedTownIds([])}
                onRemoveTown={(id) => setSelectedTownIds((prev) => prev.filter((t) => t !== id))}
              />
            </div>
          )}

          {/* Candidate comparison */}
          {multiPinMode && (
            <div className="absolute bottom-4 right-4 z-[1000] w-[260px]">
              <CandidateComparison
                candidates={candidates}
                onRemove={(id) => setCandidates((prev) => prev.filter((c) => c.id !== id))}
                onClear={() => setCandidates([])}
              />
            </div>
          )}

          {/* Legend */}
          {result && !flyerMode && !multiPinMode && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> {t("map.legend")}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-sm" style={{ background: getHeatmapColor(5000, heatmapMode) }} /> {t("map.high")}
                    <span className="w-3 h-3 rounded-sm" style={{ background: getHeatmapColor(2500, heatmapMode) }} /> {t("map.medium")}
                    <span className="w-3 h-3 rounded-sm" style={{ background: getHeatmapColor(500, heatmapMode) }} /> {t("map.low")}
                  </div>
                  {activeLayer !== "recommended" && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-3 h-3 rounded-full bg-destructive border-2 border-white" /> {t("map.competitors")}
                      <MapPin className="w-3 h-3 text-primary ml-2" /> {t("map.candidateLabel")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <LeafletMap
            center={mapCenter}
            zoom={mapZoom}
            radiusMeters={radiusMeta.meters}
            result={result}
            address={address}
            townPolygons={townPolygons}
            geoJsonStyle={geoJsonStyle}
            onTownClick={handleTownClick}
            activeLayer={activeLayer}
            candidates={candidates}
            onMapClick={handleMapClick}
            heatmapMode={heatmapMode}
            selectedTownIds={selectedTownIds}
          />
        </div>

        {/* Analysis side panel */}
        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border/60 bg-card overflow-y-auto">
          {/* Mobile controls */}
          <div className="lg:hidden p-3 border-b border-border/40">
            <MapControls
              heatmapMode={heatmapMode}
              onHeatmapModeChange={setHeatmapMode}
              activeLayer={activeLayer}
              onLayerChange={setActiveLayer}
              flyerMode={flyerMode}
              onFlyerModeToggle={() => setFlyerMode((f) => !f)}
              multiPinMode={multiPinMode}
              onMultiPinModeToggle={() => setMultiPinMode((m) => !m)}
            />
          </div>

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

// --- Sub-components ---

function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <MapPin className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{t("map.emptyTitle")}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">
        {t("map.emptyDesc")}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{t("map.errorTitle")}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[260px]">{message}</p>
      <Button size="sm" onClick={onRetry}>{t("map.retry")}</Button>
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
    </div>
  );
}

function AnalysisPanel({ result, radius }: { result: MapAreaAnalysisResult; radius: string }) {
  const { t } = useLanguage();
  const { summary, competitors, censusData, isOverseas, countryCode } = result;
  const isRealData = !!censusData?.dataAvailable;

  const getBadgeInfo = () => {
    if (!isRealData && isOverseas) return { label: t("map.estimateOverseas"), variant: "outline" as const, icon: "🌍" };
    if (countryCode === "jp" && isRealData) return { label: t("map.censusJp"), variant: "default" as const, icon: "📊" };
    if (countryCode === "us" && isRealData) return { label: t("map.censusUs"), variant: "default" as const, icon: "🇺🇸" };
    if (isRealData) return { label: t("map.censusWorldpop"), variant: "default" as const, icon: "🌐" };
    return { label: t("map.aiEstimate"), variant: "secondary" as const, icon: "" };
  };
  const badge = getBadgeInfo();

  return (
    <motion.div
      className="p-4 space-y-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base text-foreground">{t("map.resultTitle")}</h2>
        <div className="flex items-center gap-1.5">
          <Badge variant={badge.variant} className="text-xs flex items-center gap-1">
            {badge.icon && <span>{badge.icon}</span>}
            {countryCode === "jp" && isRealData && <Database className="w-3 h-3" />}
            {badge.label}
          </Badge>
          <Badge variant="outline" className="text-xs">{t("map.radius")} {radius}</Badge>
        </div>
      </div>

      {censusData && (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border/40">
          {isOverseas ? "🌐" : "📊"} {censusData.source}（{censusData.areaName}）
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users className="w-4 h-4 text-primary" />} label={t("map.totalPop")} value={summary.totalPopulation.toLocaleString()} unit={t("map.popUnit")} />
        <StatCard icon={<Home className="w-4 h-4 text-primary" />} label={t("map.households")} value={summary.totalHouseholds.toLocaleString()} unit={t("map.householdUnit")} />
        <StatCard icon={<Building2 className="w-4 h-4 text-amber-500" />} label={t("map.competitors")} value={String(summary.competitorCount)} unit={t("map.storeUnit")} />
        <div className="rounded-lg border border-border/60 bg-background p-3 flex flex-col items-center justify-center gap-1">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" /> {t("map.tradeAreaScore")}
          </span>
          <ScoreGauge score={summary.tradeAreaScore} />
        </div>
      </div>

      {summary.ageDistribution.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{t("map.ageComp")}</h3>
          <div className="space-y-2">
            {summary.ageDistribution.map((ag) => (
              <div key={ag.ageGroup} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{ag.ageGroup}</span>
                  <span className="text-muted-foreground">{ag.percentage}% ({ag.count.toLocaleString()}{t("map.popUnit")})</span>
                </div>
                <Progress value={ag.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.householdTypes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{t("map.householdComp")}</h3>
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

      {competitors.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            {t("map.competitorList")} ({competitors.length}{t("map.items")})
          </h3>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {competitors.map((c) => (
              <div key={c.id} className="flex justify-between items-center text-xs bg-muted/40 rounded-md px-3 py-2">
                <div>
                  <span className="font-medium text-foreground">{c.name}</span>
                  <span className="text-muted-foreground ml-1.5">{c.industry}</span>
                </div>
                <span className="text-muted-foreground">{c.distance}{t("map.distanceUnit")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.recommendations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{t("map.recommendations")}</h3>
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
