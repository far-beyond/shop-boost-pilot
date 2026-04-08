import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ClipboardList, ChevronLeft, Package, Calendar, Store, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { getOrders, type OrderRecord } from "@/lib/orderHistoryService";

const TYPE_COLORS: Record<string, string> = {
  flyer: "bg-blue-100 text-blue-700",
  ad: "bg-green-100 text-green-700",
  media: "bg-purple-100 text-purple-700",
};

export default function OrderHistory() {
  const { t } = useLanguage();
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  const orders = useMemo(() => getOrders(), []);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const totalOrders = orders.length;
  const totalSpend = orders.reduce((s, o) => s + o.totalCost, 0);
  const monthSpend = orders
    .filter((o) => o.date?.startsWith(thisMonth) || o.date?.includes(`${now.getFullYear()}/${now.getMonth() + 1}/`))
    .reduce((s, o) => s + o.totalCost, 0);

  if (selectedOrder) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => setSelectedOrder(null)}>
            <ChevronLeft className="w-4 h-4" /> {t("oh.backToList")}
          </Button>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <Card className="border-border/60">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">{selectedOrder.orderNumber}</h2>
                  <Badge className={TYPE_COLORS[selectedOrder.type] || ""}>{t(`oh.type.${selectedOrder.type}`)}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("oh.date")}</span>
                    <p className="font-medium text-foreground">{selectedOrder.date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("oh.storeName")}</span>
                    <p className="font-medium text-foreground">{selectedOrder.storeName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("oh.totalCost")}</span>
                    <p className="font-medium text-foreground">{"\u00A5"}{selectedOrder.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("oh.status")}</span>
                    <p className="font-medium text-foreground">{t(`oh.status.${selectedOrder.status}`)}</p>
                  </div>
                </div>

                {selectedOrder.mediaIncluded && selectedOrder.mediaIncluded.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("oh.mediaIncluded")}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOrder.mediaIncluded.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.areas && selectedOrder.areas.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("oh.areas")}</h3>
                    <div className="space-y-1.5">
                      {selectedOrder.areas.map((a, i) => (
                        <div key={i} className="flex justify-between items-center text-xs bg-muted/40 rounded-md px-3 py-2">
                          <span className="text-foreground">{a.areaName}</span>
                          <div className="flex items-center gap-3">
                            {a.quantity != null && <span className="text-muted-foreground">{a.quantity.toLocaleString()}{t("oh.copies")}</span>}
                            {a.priority && <Badge variant="outline" className="text-[10px]">{a.priority}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.costs && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("oh.costBreakdown")}</h3>
                    <div className="space-y-1.5">
                      {Object.entries(selectedOrder.costs).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-xs bg-muted/40 rounded-md px-3 py-2">
                          <span className="text-foreground">{key}</span>
                          <span className="font-medium text-foreground">{"\u00A5"}{val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("oh.notes")}</h3>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-md px-3 py-2">{selectedOrder.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ClipboardList className="w-3.5 h-3.5" />
              {t("oh.badge")}
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("oh.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("oh.subtitle")}</p>
        </motion.div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <Package className="w-5 h-5 text-primary mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">{t("oh.totalOrders")}</span>
              <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <Banknote className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">{t("oh.totalSpend")}</span>
              <div className="text-2xl font-bold text-foreground">{"\u00A5"}{totalSpend.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">{t("oh.monthSpend")}</span>
              <div className="text-2xl font-bold text-foreground">{"\u00A5"}{monthSpend.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Orders list */}
        {orders.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{t("oh.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">{t("oh.emptyDesc")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="border-border/60 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
                  onClick={() => setSelectedOrder(order)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[10px] ${TYPE_COLORS[order.type] || ""}`}>{t(`oh.type.${order.type}`)}</Badge>
                        <div>
                          <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{order.storeName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{"\u00A5"}{order.totalCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{order.date}</p>
                      </div>
                    </div>
                    {order.mediaIncluded && order.mediaIncluded.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {order.mediaIncluded.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
