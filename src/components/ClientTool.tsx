import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { FileUp, Trash2, Mail, Printer } from "lucide-react";

const ClientTool = () => {
  const [myQuotationPdf, setMyQuotationPdf] = useState<File | null>(null);
  const [newBanner, setNewBanner] = useState<File | null>(null);
  const [percentage, setPercentage] = useState<string>("");
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    vat: "",
    phone: "",
    area: "",
    notes: ""
  });

  const handleMyPdfLoad = () => {
    // Simulate loading the specific "Προσφορά_Δική_Μου.pdf"
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.name === "Προσφορά_Δική_Μου.pdf" || file.type === "application/pdf") {
          setMyQuotationPdf(file);
          toast({
            title: "Επιτυχία",
            description: "Το PDF φορτώθηκε επιτυχώς",
          });
        } else {
          toast({
            title: "Σφάλμα",
            description: "Παρακαλώ επιλέξτε το αρχείο 'Προσφορά_Δική_Μου.pdf'",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const handleRemoveBanner = () => {
    if (!myQuotationPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ φορτώστε πρώτα το PDF",
        variant: "destructive",
      });
      return;
    }

    // Here will be the banner removal logic
    toast({
      title: "Επεξεργασία",
      description: "Αφαίρεση banner από PDF...",
    });
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setNewBanner(file);
      toast({
        title: "Banner",
        description: `Επιλέχθηκε: ${file.name}`,
      });
    }
  };

  const handleAddBannerAndInfo = () => {
    if (!myQuotationPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ φορτώστε πρώτα το PDF",
        variant: "destructive",
      });
      return;
    }

    if (!newBanner) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ επιλέξτε banner",
        variant: "destructive",
      });
      return;
    }

    // Here will be the banner addition logic
    toast({
      title: "Επεξεργασία",
      description: "Προσθήκη banner και στοιχείων...",
    });
  };

  const handleApplyChanges = () => {
    if (!myQuotationPdf) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ φορτώστε πρώτα το PDF",
        variant: "destructive",
      });
      return;
    }

    if (!percentage || isNaN(Number(percentage))) {
      toast({
        title: "Σφάλμα",
        description: "Παρακαλώ εισάγετε έγκυρο ποσοστό",
        variant: "destructive",
      });
      return;
    }

    // Here will be the price adjustment logic
    toast({
      title: "Επεξεργασία",
      description: `Εφαρμογή αλλαγών με ποσοστό ${percentage}%...`,
    });
  };

  const handlePrint = () => {
    if (!myQuotationPdf) {
      toast({
        title: "Σφάλμα",
        description: "Δεν υπάρχει PDF για εκτύπωση",
        variant: "destructive",
      });
      return;
    }

    // Here will be the print logic
    toast({
      title: "Εκτύπωση",
      description: "Προετοιμασία για εκτύπωση...",
    });
  };

  const handleSendEmail = () => {
    if (!myQuotationPdf) {
      toast({
        title: "Σφάλμα",
        description: "Δεν υπάρχει PDF για αποστολή",
        variant: "destructive",
      });
      return;
    }

    // Here will be the email logic
    const subject = `Προσφορά ${companyInfo.name || "Πελάτη"}`;
    toast({
      title: "Email",
      description: `Προετοιμασία email με θέμα: "${subject}"`,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Εργαλείο Πελάτη
          </CardTitle>
          <CardDescription className="text-center">
            Επεξεργασία της δικής σας προσφοράς
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Load My PDF */}
          <div className="text-center">
            <Button onClick={handleMyPdfLoad} variant="outline" size="lg">
              <FileUp className="h-5 w-5 mr-2" />
              Φόρτωση "Προσφορά_Δική_Μου.pdf"
            </Button>
            {myQuotationPdf && (
              <p className="text-sm text-muted-foreground mt-2">
                Φορτωμένο: {myQuotationPdf.name}
              </p>
            )}
          </div>

          {/* Banner Management */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Διαχείριση Banner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleRemoveBanner}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Αφαίρεση Banner
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="new-banner">Νέο Banner:</Label>
                  <Input
                    id="new-banner"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                  />
                </div>

                <Button
                  onClick={handleAddBannerAndInfo}
                  className="w-full"
                  disabled={!newBanner}
                >
                  Προσθήκη Banner & Στοιχείων
                </Button>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Στοιχεία Εταιρείας</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="company-name">Όνομα Εταιρείας:</Label>
                  <Input
                    id="company-name"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({...companyInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="vat">ΑΦΜ:</Label>
                  <Input
                    id="vat"
                    value={companyInfo.vat}
                    onChange={(e) => setCompanyInfo({...companyInfo, vat: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Τηλέφωνο:</Label>
                  <Input
                    id="phone"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="area">Περιοχή:</Label>
                  <Input
                    id="area"
                    value={companyInfo.area}
                    onChange={(e) => setCompanyInfo({...companyInfo, area: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Price Adjustment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Αλλαγή Τιμών</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="price-percentage">Ποσοστό αλλαγής:</Label>
                <Input
                  id="price-percentage"
                  type="number"
                  placeholder="10"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-32"
                  step="0.01"
                />
                <span>%</span>
              </div>
              <Button onClick={handleApplyChanges} className="w-full" size="lg">
                ΕΦΑΡΜΟΓΗ ΑΛΛΑΓΩΝ
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <Button onClick={handlePrint} variant="outline" size="lg">
              <Printer className="h-5 w-5 mr-2" />
              ΕΚΤΥΠΩΣΗ
            </Button>
            <Button onClick={handleSendEmail} size="lg">
              <Mail className="h-5 w-5 mr-2" />
              ΑΠΟΣΤΟΛΗ EMAIL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTool;