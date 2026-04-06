import { MapPin, Trash2, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CandidatePin } from "@/lib/mapGeoData";

interface CandidateComparisonProps {
  candidates: CandidatePin[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CandidateComparison({
  candidates,
  onRemove,
  onClear,
}: CandidateComparisonProps) {
  if (candidates.length === 0) {
    return (
      <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60 border-dashed">
        <CardContent className="p-3 text-center">
          <MapPin className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">
            地図上をクリックして<br />候補地を追加してください
          </p>
        </CardContent>
      </Card>
    );
  }

  const bestScore = Math.max(...candidates.map((c) => c.score));

  return (
    <Card className="shadow-md bg-card/95 backdrop-blur-sm border-border/60">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> 候補地比較 ({candidates.length})
          </p>
          <Button variant="ghost" size="sm" onClick={onClear} className="h-5 px-1.5 text-[10px]">
            クリア
          </Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {candidates.map((c, i) => (
            <div
              key={c.id}
              className={`rounded-md border p-2 text-xs space-y-1.5 ${
                c.score === bestScore
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-background"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{c.label}</span>
                  {c.score === bestScore && (
                    <Badge variant="default" className="text-[9px] h-4 px-1 gap-0.5">
                      <Trophy className="w-2.5 h-2.5" /> Best
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => onRemove(c.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>スコア</span>
                <span className="font-medium text-foreground">{c.score}点</span>
              </div>
              <Progress value={c.score} className="h-1.5" />

              <div className="grid grid-cols-2 gap-x-3 text-muted-foreground">
                <span>人口: <span className="text-foreground font-medium">{c.population.toLocaleString()}</span></span>
                <span>競合: <span className="text-foreground font-medium">{c.competitors}店</span></span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
