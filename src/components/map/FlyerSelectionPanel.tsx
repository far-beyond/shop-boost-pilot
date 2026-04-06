import { FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FlyerSelection, TownFeatureCollection } from "@/lib/mapGeoData";

interface FlyerSelectionPanelProps {
  selection: FlyerSelection;
  towns: TownFeatureCollection;
  onClear: () => void;
  onRemoveTown: (id: string) => void;
}

export default function FlyerSelectionPanel({
  selection,
  towns,
  onClear,
  onRemoveTown,
}: FlyerSelectionPanelProps) {
  const selectedTowns = towns.features.filter((f) =>
    selection.townIds.includes(f.properties.id)
  );

  if (selection.townIds.length === 0) {
    return (
      <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60 border-dashed">
        <CardContent className="p-3 text-center">
          <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            地図上のエリアをクリックして<br />配布エリアを選択してください
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> チラシ配布エリア
          </p>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-5 px-1.5 text-[10px]">
            クリア
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {selectedTowns.map((t) => (
            <Badge
              key={t.properties.id}
              variant="secondary"
              className="text-[10px] gap-0.5 pr-1"
            >
              {t.properties.name}
              <button onClick={() => onRemoveTown(t.properties.id)} className="ml-0.5 hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <div className="text-muted-foreground">合計世帯数</div>
            <div className="font-bold text-foreground text-sm">
              {selection.totalHouseholds.toLocaleString()}
            </div>
          </div>
          <div className="bg-primary/5 rounded-md p-2 text-center border border-primary/10">
            <div className="text-muted-foreground">推奨部数</div>
            <div className="font-bold text-primary text-sm">
              {selection.recommendedCopies.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
