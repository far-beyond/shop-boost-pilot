import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Shield, CreditCard, UserPlus, Trash2, Loader2 } from "lucide-react";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  customer_email: string | null;
  description: string | null;
};

type WhitelistEntry = {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingEmail, setAddingEmail] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-billing", {
        body: { action: "check-admin" },
      });
      if (error || !data?.isAdmin) {
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      await Promise.all([loadPayments(), loadWhitelist()]);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    const { data, error } = await supabase.functions.invoke("admin-billing", {
      body: { action: "list-payments" },
    });
    if (!error && data?.payments) setPayments(data.payments);
  };

  const loadWhitelist = async () => {
    const { data, error } = await supabase.functions.invoke("admin-billing", {
      body: { action: "list-whitelist" },
    });
    if (!error && data?.whitelist) setWhitelist(data.whitelist);
  };

  const addToWhitelist = async () => {
    if (!newEmail.trim()) return;
    setAddingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-billing", {
        body: { action: "add-whitelist", email: newEmail, note: newNote },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      toast.success(t("admin.whitelistAdded"));
      setNewEmail("");
      setNewNote("");
      await loadWhitelist();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingEmail(false);
    }
  };

  const removeFromWhitelist = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke("admin-billing", {
        body: { action: "remove-whitelist", email },
      });
      if (error) throw error;
      toast.success(t("admin.whitelistRemoved"));
      await loadWhitelist();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <Shield className="w-12 h-12 text-destructive" />
          <h1 className="text-xl font-bold">{t("admin.noAccess")}</h1>
          <Button onClick={() => navigate("/")}>{t("admin.backHome")}</Button>
        </div>
      </Layout>
    );
  }

  const totalRevenue = payments
    .filter((p) => p.status === "succeeded")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="mb-4">
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {t("admin.payments")}
            </TabsTrigger>
            <TabsTrigger value="whitelist" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {t("admin.whitelist")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t("admin.totalRevenue")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t("admin.totalPayments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{payments.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.paymentHistory")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.date")}</TableHead>
                      <TableHead>{t("admin.email")}</TableHead>
                      <TableHead>{t("admin.amount")}</TableHead>
                      <TableHead>{t("admin.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">{new Date(p.created).toLocaleString("ja-JP")}</TableCell>
                        <TableCell className="text-sm">{p.customer_email || "—"}</TableCell>
                        <TableCell className="text-sm font-medium">¥{p.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "succeeded" ? "default" : "secondary"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {t("admin.noPayments")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whitelist">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{t("admin.addWhitelist")}</CardTitle>
                <CardDescription>{t("admin.addWhitelistDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder={t("admin.emailPh")}
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder={t("admin.notePh")}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addToWhitelist} disabled={addingEmail || !newEmail.trim()}>
                    {addingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.add")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.whitelistTitle")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.email")}</TableHead>
                      <TableHead>{t("admin.note")}</TableHead>
                      <TableHead>{t("admin.addedDate")}</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-sm font-medium">{w.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{w.note || "—"}</TableCell>
                        <TableCell className="text-sm">{new Date(w.created_at).toLocaleDateString("ja-JP")}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromWhitelist(w.email)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {whitelist.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {t("admin.noWhitelist")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
