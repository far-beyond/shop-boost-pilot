import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Upload, MapPin, Filter, BarChart3, Loader2, X, FileUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const SOURCE_COLORS: Record<string, string> = {
  flyer: "#ef4444",
  web: "#3b82f6",
  referral: "#22c55e",
  sns: "#a855f7",
  walk_in: "#f59e0b",
  other: "#6b7280",
};

function getSourceColor(source: string): string {
  const normalized = source.toLowerCase().trim();
  if (normalized.includes("チラシ") || normalized.includes("flyer")) return SOURCE_COLORS.flyer;
  if (normalized.includes("web") || normalized.includes("ウェブ") || normalized.includes("hp") || normalized.includes("ホームページ")) return SOURCE_COLORS.web;
  if (normalized.includes("紹介") || normalized.includes("referral")) return SOURCE_COLORS.referral;
  if (normalized.includes("sns") || normalized.includes("instagram") || normalized.includes("twitter") || normalized.includes("facebook")) return SOURCE_COLORS.sns;
  if (normalized.includes("通りがかり") || normalized.includes("walk")) return SOURCE_COLORS.walk_in;
  return SOURCE_COLORS.other;
}

function getSourceKey(source: string): string {
  const normalized = source.toLowerCase().trim();
  if (normalized.includes("チラシ") || normalized.includes("flyer")) return "flyer";
  if (normalized.includes("web") || normalized.includes("ウェブ") || normalized.includes("hp") || normalized.includes("ホームページ")) return "web";
  if (normalized.includes("紹介") || normalized.includes("referral")) return "referral";
  if (normalized.includes("sns") || normalized.includes("instagram") || normalized.includes("twitter") || normalized.includes("facebook")) return "sns";
  if (normalized.includes("通りがかり") || normalized.includes("walk")) return "walk_in";
  return "other";
}

interface ResponseRow {
  name: string;
  address: string;
  phone: string;
  date: string;
  source: string;
  notes: string;
  lat?: number;
  lng?: number;
  geocoded?: boolean;
  geocodeError?: boolean;
}

// Geocode using Nominatim with rate limiting
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "User-Agent": "MapBoostAI/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function parseCSV(text: string): ResponseRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => h === "name" || h === "名前" || h === "氏名");
  const addrIdx = headers.findIndex((h) => h === "address" || h === "住所");
  const phoneIdx = headers.findIndex((h) => h === "phone" || h === "電話" || h === "電話番号" || h === "tel");
  const dateIdx = headers.findIndex((h) => h === "date" || h === "日付" || h === "問合せ日");
  const sourceIdx = headers.findIndex((h) => h === "source" || h === "経路" || h === "流入経路" || h === "媒体");
  const notesIdx = headers.findIndex((h) => h === "notes" || h === "備考" || h === "メモ");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    return {
      name: nameIdx >= 0 ? cols[nameIdx] || "" : "",
      address: addrIdx >= 0 ? cols[addrIdx] || "" : "",
      phone: phoneIdx >= 0 ? cols[phoneIdx] || "" : "",
      date: dateIdx >= 0 ? cols[dateIdx] || "" : "",
      source: sourceIdx >= 0 ? cols[sourceIdx] || "" : "",
      notes: notesIdx >= 0 ? cols[notesIdx] || "" : "",
    };
  }).filter((r) => r.address.trim() !== "");
}

// Pure Leaflet map component
function ResponseMap({
  rows,
  center,
  zoom,
}: {
  rows: ResponseRow[];
  center: [number, number];
  zoom: number;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setView(center, zoom, { animate: true });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geocoded = rows.filter((r) => r.lat != null && r.lng != null);
    for (const row of geocoded) {
      const color = getSourceColor(row.source);
      const icon = new L.DivIcon({
        html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([row.lat!, row.lng!], { icon })
        .bindPopup(
          `<strong>${row.name || "-"}</strong><br/>${row.address}<br/>` +
          `${row.source ? `<span style="color:${color}; font-weight:600;">${row.source}</span><br/>` : ""}` +
          `${row.date ? row.date + "<br/>" : ""}` +
          `${row.notes || ""}`
        )
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (geocoded.length > 0) {
      const bounds = L.latLngBounds(geocoded.map((r) => [r.lat!, r.lng!] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [rows]);

  return <div ref={containerRef} className="h-full w-full" />;
}

export default function ResponseAnalysis() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState(0);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error(t("resp.csvEmpty"));
        return;
      }
      setRows(parsed);
      setFilterSource("all");
      setFilterDateFrom("");
      setFilterDateTo("");
      toast.success(t("resp.csvLoaded").replace("{count}", String(parsed.length)));
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [t]);

  const handleGeocode = useCallback(async () => {
    const toGeocode = rows.filter((r) => !r.geocoded && !r.geocodeError);
    if (toGeocode.length === 0) {
      toast.info(t("resp.alreadyGeocoded"));
      return;
    }
    setGeocoding(true);
    setGeocodeProgress(0);
    let done = 0;
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].geocoded || updated[i].geocodeError) continue;
      const result = await geocodeAddress(updated[i].address);
      if (result) {
        updated[i] = { ...updated[i], lat: result.lat, lng: result.lng, geocoded: true };
      } else {
        updated[i] = { ...updated[i], geocodeError: true };
      }
      done++;
      setGeocodeProgress(Math.round((done / toGeocode.length) * 100));
      // Rate limit: 1 request per second for Nominatim
      if (i < updated.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }
    }

    setRows(updated);
    setGeocoding(false);
    const success = updated.filter((r) => r.geocoded).length;
    const failed = updated.filter((r) => r.geocodeError).length;
    toast.success(t("resp.geocodeComplete").replace("{success}", String(success)).replace("{failed}", String(failed)));
  }, [rows, t]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterSource !== "all" && getSourceKey(r.source) !== filterSource) return false;
      if (filterDateFrom && r.date && r.date < filterDateFrom) return false;
      if (filterDateTo && r.date && r.date > filterDateTo) return false;
      return true;
    });
  }, [rows, filterSource, filterDateFrom, filterDateTo]);

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredRows.length;
    const bySource: Record<string, number> = {};
    const byArea: Record<string, number> = {};

    for (const r of filteredRows) {
      const srcKey = r.source || "other";
      bySource[srcKey] = (bySource[srcKey] || 0) + 1;

      // Extract area from address (first portion, e.g. city/ward)
      const area = r.address.split(/[0-9０-９]/).shift()?.trim() || r.address;
      const shortArea = area.length > 15 ? area.slice(0, 15) + "..." : area;
      byArea[shortArea] = (byArea[shortArea] || 0) + 1;
    }

    return { total, bySource, byArea };
  }, [filteredRows]);

  const sourceKeys = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((r) => keys.add(getSourceKey(r.source)));
    return Array.from(keys);
  }, [rows]);

  const mapCenter: [number, number] = [35.6812, 139.7671];

  return (
    <Layout>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden">
        {/* Map area */}
        <div className="flex-1 relative min-h-[400px]">
          {/* Upload / controls overlay */}
          <div className="absolute top-4 left-4 right-4 z-[1000] lg:right-auto lg:w-[360px]">
            <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur-sm">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <BarChart3 className="w-3 h-3" />
                    {t("resp.badge")}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  {t("resp.uploadCsv")}
                </Button>

                {rows.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={handleGeocode}
                      disabled={geocoding}
                    >
                      {geocoding ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t("resp.geocoding")} ({geocodeProgress}%)
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5" />
                          {t("resp.geocodeBtn")}
                        </>
                      )}
                    </Button>

                    {/* Filters */}
                    <div className="space-y-1.5 pt-1 border-t border-border/40">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Filter className="w-3 h-3" />
                        {t("resp.filters")}
                      </div>
                      <div className="flex gap-1.5">
                        <select
                          value={filterSource}
                          onChange={(e) => setFilterSource(e.target.value)}
                          className="text-[11px] bg-muted/60 border border-border/60 rounded px-1.5 py-1 text-foreground flex-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                          <option value="all">{t("resp.allSources")}</option>
                          {sourceKeys.map((k) => (
                            <option key={k} value={k}>{t(`resp.source.${k}`)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="text-[11px] h-7 flex-1"
                          placeholder={t("resp.from")}
                        />
                        <Input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="text-[11px] h-7 flex-1"
                          placeholder={t("resp.to")}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          {rows.length > 0 && (
            <div className="absolute bottom-4 left-4 z-[1000]">
              <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">{t("resp.legend")}</p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    {Object.entries(SOURCE_COLORS).map(([key, color]) => (
                      <span key={key} className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                        {t(`resp.source.${key}`)}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <ResponseMap
            rows={filteredRows}
            center={mapCenter}
            zoom={12}
          />
        </div>

        {/* Summary side panel */}
        <div className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-border/60 bg-card overflow-y-auto">
          {rows.length === 0 ? (
            <EmptyState onUpload={() => fileInputRef.current?.click()} />
          ) : (
            <motion.div
              className="p-4 space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div>
                <h2 className="font-bold text-base text-foreground">{t("resp.summaryTitle")}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t("resp.summaryDesc")}</p>
              </div>

              {/* Total */}
              <Card className="border border-border/60">
                <CardContent className="p-4 text-center">
                  <span className="text-xs text-muted-foreground">{t("resp.totalResponses")}</span>
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <span className="text-xs text-muted-foreground">{t("resp.unit")}</span>
                </CardContent>
              </Card>

              {/* By source */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  {t("resp.bySource")}
                </h3>
                <div className="space-y-1.5">
                  {Object.entries(stats.bySource)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => {
                      const color = getSourceColor(source);
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={source} className="flex items-center gap-2 text-xs bg-muted/40 rounded-md px-3 py-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                          <span className="flex-1 text-foreground truncate">{source}</span>
                          <span className="font-medium text-foreground">{count}</span>
                          <span className="text-muted-foreground">({pct}%)</span>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* By area */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  {t("resp.byArea")}
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Object.entries(stats.byArea)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 20)
                    .map(([area, count]) => {
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={area} className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-3 py-2">
                          <span className="text-foreground truncate flex-1">{area}</span>
                          <div className="text-right shrink-0 ml-2">
                            <span className="font-medium text-foreground">{count}</span>
                            <span className="text-muted-foreground ml-1">({pct}%)</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>

              {/* Geocode status */}
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                  {t("resp.geocodeStatus")}
                </h3>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted/50 rounded-md p-2 text-center">
                    <div className="text-muted-foreground">{t("resp.total")}</div>
                    <div className="font-bold text-foreground">{rows.length}</div>
                  </div>
                  <div className="bg-green-500/10 rounded-md p-2 text-center">
                    <div className="text-muted-foreground">{t("resp.mapped")}</div>
                    <div className="font-bold text-green-600">{rows.filter((r) => r.geocoded).length}</div>
                  </div>
                  <div className="bg-red-500/10 rounded-md p-2 text-center">
                    <div className="text-muted-foreground">{t("resp.failed")}</div>
                    <div className="font-bold text-red-500">{rows.filter((r) => r.geocodeError).length}</div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Upload className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{t("resp.emptyTitle")}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px] mb-4">
        {t("resp.emptyDesc")}
      </p>
      <Button size="sm" onClick={onUpload} className="gap-2">
        <FileUp className="w-4 h-4" />
        {t("resp.uploadCsv")}
      </Button>
    </div>
  );
}
