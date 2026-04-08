import { useState, useMemo } from "react";
import { FileText, X, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import type { FlyerSelection, TownFeatureCollection } from "@/lib/mapGeoData";

const UNIT_PRICES = [3, 4, 5, 6];

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
  const { t } = useLanguage();
  const [unitPrice, setUnitPrice] = useState(4);

  const selectedTowns = towns.features.filter((f) =>
    selection.townIds.includes(f.properties.id)
  );

  const costs = useMemo(() => {
    const distributionCost = selection.recommendedCopies * unitPrice;
    const printingCost = Math.round(selection.recommendedCopies * 2.5);
    const totalCost = distributionCost + printingCost;
    return { distributionCost, printingCost, totalCost };
  }, [selection.recommendedCopies, unitPrice]);

  if (selection.townIds.length === 0) {
    return (
      <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60 border-dashed">
        <CardContent className="p-3 text-center">
          <FileText className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            {t("map.flyerEmptyMsg")}
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
            <FileText className="w-3.5 h-3.5" /> {t("map.flyerArea")}
          </p>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-5 px-1.5 text-[10px]">
            {t("map.clear")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
          {selectedTowns.map((tw) => (
            <Badge
              key={tw.properties.id}
              variant="secondary"
              className="text-[10px] gap-0.5 pr-1"
            >
              {tw.properties.name}
              <button onClick={() => onRemoveTown(tw.properties.id)} className="ml-0.5 hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-muted/50 rounded-md p-2 text-center">
            <div className="text-muted-foreground">{t("map.totalHouseholds")}</div>
            <div className="font-bold text-foreground text-sm">
              {selection.totalHouseholds.toLocaleString()}
            </div>
          </div>
          <div className="bg-primary/5 rounded-md p-2 text-center border border-primary/10">
            <div className="text-muted-foreground">{t("map.recCopies")}</div>
            <div className="font-bold text-primary text-sm">
              {selection.recommendedCopies.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Unit price selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground">{t("map.unitPrice")}</span>
            <select
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              className="text-[11px] bg-muted/60 border border-border/60 rounded px-1.5 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              {UNIT_PRICES.map((p) => (
                <option key={p} value={p}>
                  {t("map.yenPerUnit").replace("{price}", String(p))}
                </option>
              ))}
            </select>
          </div>

          {/* Cost breakdown */}
          <div className="bg-muted/30 rounded-md p-2 space-y-1 text-[11px]">
            <div className="flex justify-between text-muted-foreground">
              <span>{t("map.printingCost")}</span>
              <span className="font-medium text-foreground">
                {t("map.yen")}{costs.printingCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{t("map.distributionCost")}</span>
              <span className="font-medium text-foreground">
                {t("map.yen")}{costs.distributionCost.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-border/40 pt-1 flex justify-between font-semibold text-foreground">
              <span>{t("map.totalCost")}</span>
              <span className="text-primary">
                {t("map.yen")}{costs.totalCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Order button */}
        <Button
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => {
            window.location.href = `/flyer-plan?towns=${selection.townIds.join(",")}&copies=${selection.recommendedCopies}&unitPrice=${unitPrice}`;
          }}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          {t("map.createOrder")}
        </Button>
      </CardContent>
    </Card>
  );
}
