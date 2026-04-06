import { Layers, Map, MousePointer, BarChart3, Users, Home, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { HeatmapMode, LayerMode } from "@/lib/mapGeoData";

interface MapControlsProps {
  heatmapMode: HeatmapMode;
  onHeatmapModeChange: (mode: HeatmapMode) => void;
  activeLayer: LayerMode;
  onLayerChange: (layer: LayerMode) => void;
  flyerMode: boolean;
  onFlyerModeToggle: () => void;
  multiPinMode: boolean;
  onMultiPinModeToggle: () => void;
}

const HEATMAP_OPTIONS: { value: HeatmapMode; label: string; icon: React.ReactNode }[] = [
  { value: "population", label: "人口密度", icon: <Users className="w-3 h-3" /> },
  { value: "households", label: "世帯数", icon: <Home className="w-3 h-3" /> },
  { value: "age", label: "年齢層", icon: <Calendar className="w-3 h-3" /> },
];

const LAYER_OPTIONS: { value: LayerMode; label: string }[] = [
  { value: "density", label: "人口密度" },
  { value: "competitors", label: "競合分布" },
  { value: "recommended", label: "推奨エリア" },
];

export default function MapControls({
  heatmapMode,
  onHeatmapModeChange,
  activeLayer,
  onLayerChange,
  flyerMode,
  onFlyerModeToggle,
  multiPinMode,
  onMultiPinModeToggle,
}: MapControlsProps) {
  return (
    <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur-sm">
      <CardContent className="p-2.5 space-y-2">
        {/* Heatmap mode */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> ヒートマップ
          </p>
          <div className="flex gap-1">
            {HEATMAP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onHeatmapModeChange(opt.value)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                  heatmapMode === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer switch */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> レイヤー
          </p>
          <div className="flex gap-1">
            {LAYER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onLayerChange(opt.value)}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors ${
                  activeLayer === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggles */}
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant={flyerMode ? "default" : "outline"}
            onClick={onFlyerModeToggle}
            className="h-7 text-[11px] gap-1"
          >
            <Map className="w-3 h-3" />
            チラシ配布
          </Button>
          <Button
            size="sm"
            variant={multiPinMode ? "default" : "outline"}
            onClick={onMultiPinModeToggle}
            className="h-7 text-[11px] gap-1"
          >
            <MousePointer className="w-3 h-3" />
            候補地比較
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
