import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type UserEntry = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string;
  subscription_status: string | null;
  subscription_end: string | null;
  usage_this_month: number;
};

export default function UserListTab() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-billing", {
        body: { action: "list-users" },
      });
      if (!error && data?.users) setUsers(data.users);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = filterPlan === "all" || u.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  const exportCsv = () => {
    const header = "Email,Plan,Status,Registered,Last Login,Usage This Month\n";
    const rows = filteredUsers.map((u) =>
      `${u.email},${u.plan},${u.subscription_status || "—"},${new Date(u.created_at).toLocaleDateString("ja-JP")},${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ja-JP") : "—"},${u.usage_this_month}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const planBadgeVariant = (plan: string) => {
    if (plan === "Pro") return "default";
    if (plan === "Whitelist") return "outline";
    return "secondary";
  };

  const proCount = users.filter((u) => u.plan === "Pro").length;
  const freeCount = users.filter((u) => u.plan === "Free").length;
  const whitelistCount = users.filter((u) => u.plan === "Whitelist").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("admin.totalUsers")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{proCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Free</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{freeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Whitelist</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{whitelistCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("admin.userList")}</CardTitle>
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="w-4 h-4" />
              CSV
            </Button>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.searchEmail")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {["all", "Pro", "Free", "Whitelist"].map((plan) => (
                <Button
                  key={plan}
                  variant={filterPlan === plan ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterPlan(plan)}
                >
                  {plan === "all" ? t("admin.filterAll") : plan}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.email")}</TableHead>
                <TableHead>{t("admin.plan")}</TableHead>
                <TableHead>{t("admin.status")}</TableHead>
                <TableHead>{t("admin.registeredDate")}</TableHead>
                <TableHead>{t("admin.lastLogin")}</TableHead>
                <TableHead>{t("admin.usageThisMonth")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-sm font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={planBadgeVariant(u.plan)}>{u.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.subscription_status ? (
                      <Badge variant={u.subscription_status === "active" ? "default" : "secondary"}>
                        {u.subscription_status}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(u.created_at).toLocaleDateString("ja-JP")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("ja-JP")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{u.usage_this_month}</TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t("admin.noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
