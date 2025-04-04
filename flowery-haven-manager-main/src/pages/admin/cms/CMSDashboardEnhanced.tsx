// src/pages/admin/cms/CMSDashboardEnhanced.tsx
// Extension de CMSDashboard.tsx avec des fonctionnalités pour l'éditeur visuel

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import PageCreationWizard from "@/components/cms/editor/PageCreationWizard";
import { Plus, Wand2, FileText, Eye, Palette, LayoutTemplate } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Panel d'information et accès rapide pour l'éditeur visuel CMS
 * À intégrer dans CMSDashboard.tsx
 */
const CMSVisualEditorPanel = () => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Éditeur Visuel CMS
        </CardTitle>
        <CardDescription>
          Créez et modifiez vos pages avec notre éditeur visuel intuitif.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                Assistant rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Créez une nouvelle page complète en quelques clics avec notre assistant guidé.
              </p>
            </CardContent>
            <CardFooter>
              <PageCreationWizard />
            </CardFooter>
          </Card>
          
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Page vierge
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Commencez avec une page vide et ajoutez des composants selon vos besoins.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/admin/cms/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle page
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Bibliothèque
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground">
                Explorez notre bibliothèque de composants et modèles prédéfinis.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild className="w-full">
                <Link to="/admin/cms/templates">
                  <Eye className="h-4 w-4 mr-2" />
                  Explorer les modèles
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-primary/5 rounded-md p-4 flex items-start gap-3 border border-primary/20">
          <div className="bg-primary/10 text-primary rounded-full p-1.5">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Nouveau : Éditeur visuel amélioré</h4>
            <p className="text-xs text-muted-foreground">
              Notre nouvel éditeur visuel drag-and-drop permet de créer des pages attractives sans aucune connaissance technique. Ajoutez bannières, sliders et promotions en quelques clics.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CMSVisualEditorPanel;