// src/pages/admin/cms/PageEditor.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Save,
  Eye,
  Clock,
  Info,
  Settings,
  Layout,
  FileText,
  Home,
  Edit,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cmsService, PageContent, CMSTemplate } from "@/services/cms.service";
import { Markdown } from "@/components/ui/markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import CMSEditorButton from "@/components/cms/CMSEditorButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Rich text editor with basic functionality
const RichTextEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
    setHtmlValue(value);
  }, [value]);

  const handleEditorChange = () => {
    if (editorRef.current) {
      const newValue = editorRef.current.innerHTML;
      onChange(newValue);
      setHtmlValue(newValue);
    }
  };

  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlValue(e.target.value);
    onChange(e.target.value);
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleEditorChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center p-2 border-b bg-muted/30">
        <div className="flex gap-1 mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("bold")}
            title="Gras"
          >
            <span className="font-bold">B</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("italic")}
            title="Italique"
          >
            <span className="italic">I</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("underline")}
            title="Souligné"
          >
            <span className="underline">U</span>
          </Button>
        </div>

        <div className="flex gap-1 mr-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("insertUnorderedList")}
            title="Liste à puces"
          >
            <span>•</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => execCommand("insertOrderedList")}
            title="Liste numérotée"
          >
            <span>1.</span>
          </Button>
        </div>

        <div className="flex gap-1">
          <Select onValueChange={(value) => execCommand("formatBlock", value)}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="<p>">Paragraphe</SelectItem>
              <SelectItem value="<h1>">Titre 1</SelectItem>
              <SelectItem value="<h2>">Titre 2</SelectItem>
              <SelectItem value="<h3>">Titre 3</SelectItem>
              <SelectItem value="<h4>">Titre 4</SelectItem>
              <SelectItem value="<blockquote>">Citation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground ml-2">Mode HTML</span>
          <Switch checked={showHtml} onCheckedChange={setShowHtml} />
        </div>
      </div>

      {showHtml ? (
        <Textarea
          value={htmlValue}
          onChange={handleHtmlChange}
          className="min-h-[400px] font-mono text-sm rounded-none rounded-b-md"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          className="p-4 min-h-[400px] focus:outline-none prose prose-sm max-w-none"
          onInput={handleEditorChange}
          onBlur={handleEditorChange}
        />
      )}
    </div>
  );
};

const PageEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Correction: vérification plus robuste de l'état "new"
  const isNewPage = !id || id === "new" || window.location.pathname.includes("/admin/cms/new");

  const [page, setPage] = useState<Partial<PageContent>>({
    title: "",
    slug: "",
    content: "",
    metaTitle: "",
    metaDescription: "",
    published: false,
    type: "page",
    isHomepage: false,
  });

  const [originalPage, setOriginalPage] = useState<Partial<PageContent> | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(!isNewPage);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");
  const [templates, setTemplates] = useState<CMSTemplate[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void | null>(
    () => null
  );
  const [revisions, setRevisions] = useState<any[]>([]);
  const [isRevisionsDialogOpen, setIsRevisionsDialogOpen] = useState(false);

  // Load page data
  useEffect(() => {
    if (!isNewPage && id) {
      loadPage();
    } else {
      // Si c'est une nouvelle page, on initialise avec des valeurs par défaut
      setPage({
        title: "",
        slug: "",
        content: "",
        metaTitle: "",
        metaDescription: "",
        published: false,
        type: "page",
        isHomepage: false,
      });
      setIsLoading(false);
      // Définir l'onglet actif sur "settings" pour les nouvelles pages
      setActiveTab("settings");
    }

    loadTemplates();
  }, [id, isNewPage]);

  const hasUnsavedChanges = () => {
    if (!originalPage) return false;

    return JSON.stringify(originalPage) !== JSON.stringify(page);
  };

  // Prevent accidental navigation away from unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [page, originalPage]);

  const loadPage = async () => {
    if (!id || isNewPage) return;

    setIsLoading(true);
    try {
      const loadedPage = await cmsService.getPageById(id);

      if (!loadedPage) {
        toast.error("Page non trouvée");
        navigate("/admin/cms");
        return;
      }

      setPage(loadedPage);
      setOriginalPage(JSON.parse(JSON.stringify(loadedPage))); // Deep copy

      // Load revisions
      try {
        const pageRevisions = await cmsService.getPageRevisions(id);
        setRevisions(pageRevisions);
      } catch (error) {
        console.error("Error loading revisions:", error);
      }
    } catch (error) {
      console.error("Error loading page:", error);
      toast.error("Erreur lors du chargement de la page");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await cmsService.getAllTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPage({ ...page, [name]: value });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPage({ ...page, [name]: checked });
  };

  const handleSelectChange = (name: string, value: string) => {
    setPage({ ...page, [name]: value });
  };

  const handleContentChange = (content: string) => {
    setPage({ ...page, content });
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setIsUnsavedDialogOpen(true);
      setPendingAction(() => () => navigate("/admin/cms"));
    } else {
      navigate("/admin/cms");
    }
  };

  const handlePreviewClick = () => {
    setIsPreviewDialogOpen(true);
  };

  const generateRandomSlug = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `page-${timestamp}`;
  };

  const handleSavePage = async () => {
    if (!page.title) {
      setSaveError("Le titre est obligatoire");
      setActiveTab("settings");
      return;
    }

    // Si le slug est vide, générer un slug basé sur le titre ou aléatoire
    if (!page.slug) {
      const slug = page.title 
        ? page.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents
            .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
            .replace(/\s+/g, '-') // Remplace les espaces par des tirets
            .replace(/--+/g, '-') // Évite les tirets multiples
            .substring(0, 60) // Limite la longueur
        : generateRandomSlug();
      setPage({ ...page, slug });
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      console.log(
        "Début de la sauvegarde de la page",
        isNewPage ? "nouvelle" : "existante"
      );

      if (isNewPage) {
        // Create new page
        console.log("Création d'une nouvelle page avec:", {
          title: page.title,
          slug: page.slug,
          content: page.content?.substring(0, 50) + "...", // Juste le début pour le log
        });

        const newPage = await cmsService.createPage(
          page.title!,
          page.slug!,
          page.content || "",
          {
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
            published: page.published,
            template: page.template,
            type: page.type as PageContent["type"],
            isHomepage: page.isHomepage,
          }
        );

        console.log("Page créée avec succès, nouvel ID:", newPage?.id);

        if (!newPage || !newPage.id) {
          throw new Error(
            "Erreur: La page a été créée mais aucun ID n'a été retourné"
          );
        }

        toast.success("Page créée avec succès");

        // Navigate to the edit page for the new page
        console.log("Redirection vers:", `/admin/cms/${newPage.id}/edit`);
        navigate(`/admin/cms/${newPage.id}/edit`, { replace: true });
      } else {
        // Update existing page
        const updatedPage = await cmsService.updatePage(id!, {
          title: page.title,
          slug: page.slug,
          content: page.content,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
          published: page.published,
          template: page.template,
          type: page.type as PageContent["type"],
          isHomepage: page.isHomepage,
        });

        setPage(updatedPage);
        setOriginalPage(JSON.parse(JSON.stringify(updatedPage))); // Deep copy

        // Refresh revisions
        const pageRevisions = await cmsService.getPageRevisions(id!);
        setRevisions(pageRevisions);

        toast.success("Page mise à jour avec succès");
      }
    } catch (error) {
      console.error("Error saving page:", error);

      // Détails supplémentaires sur l'erreur
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
        setSaveError(error.message);
      } else {
        console.error("Unknown error type:", typeof error);
        setSaveError("Une erreur inconnue s'est produite");
      }

      toast.error("Erreur lors de l'enregistrement de la page");
    } finally {
      console.log(
        "Fin du processus de sauvegarde, réinitialisation de isSaving"
      );
      setIsSaving(false);
    }
  };

  const handlePublishClick = async () => {
    if (!page.published) {
      // First save the page
      await handleSavePage();

      // Then publish it
      try {
        if (!isNewPage && id) {
          const updatedPage = await cmsService.togglePagePublished(id, true);

          setPage(updatedPage);
          setOriginalPage(JSON.parse(JSON.stringify(updatedPage))); // Deep copy

          toast.success("Page publiée avec succès");
        }
      } catch (error) {
        console.error("Error publishing page:", error);
        toast.error("Erreur lors de la publication de la page");
      }
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    try {
      const restoredPage = await cmsService.restorePageRevision(revisionId);

      setPage(restoredPage);
      setOriginalPage(JSON.parse(JSON.stringify(restoredPage))); // Deep copy

      toast.success("Révision restaurée avec succès");
      setIsRevisionsDialogOpen(false);
    } catch (error) {
      console.error("Error restoring revision:", error);
      toast.error("Erreur lors de la restauration de la révision");
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy à HH:mm", {
        locale: fr,
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNewPage ? "Nouvelle page" : page.title}
            </h1>
            {!isNewPage && page.slug && (
              <p className="text-muted-foreground font-mono text-sm">
                /{page.slug === "home" ? "" : page.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isNewPage && (
            <Button
              variant="outline"
              onClick={() => setIsRevisionsDialogOpen(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Historique
            </Button>
          )}
          <Button variant="outline" onClick={handlePreviewClick}>
            <Eye className="h-4 w-4 mr-2" />
            Aperçu
          </Button>
          <Button onClick={handleSavePage} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
          {!page.published && (
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handlePublishClick}
              disabled={isSaving}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publier
            </Button>
          )}
        </div>
      </div>

      {saveError && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          <p className="font-medium">Erreur lors de l'enregistrement</p>
          <p>{saveError}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Contenu
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Éditeur visuel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4 pt-4">
          <RichTextEditor
            value={page.content || ""}
            onChange={handleContentChange}
          />
        </TabsContent>

        <TabsContent value="visual" className="space-y-4 pt-4">
          {!isNewPage ? (
            <div className="bg-muted/30 p-4 rounded-md text-center">
              <p className="mb-4">
                Utilisez notre éditeur visuel pour créer et modifier votre page
                sans code.
              </p>
              <CMSEditorButton pageId={id || ""} />
            </div>
          ) : (
            <div className="bg-muted/30 p-4 rounded-md text-center">
              <p className="mb-4">
                Veuillez d'abord enregistrer la page pour utiliser l'éditeur visuel.
              </p>
              <Button onClick={handleSavePage} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer pour continuer
              </Button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="settings" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Paramètres généraux</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  name="title"
                  value={page.title || ""}
                  onChange={handleInputChange}
                  placeholder="Titre de la page"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">/</span>
                  <Input
                    id="slug"
                    name="slug"
                    value={page.slug || ""}
                    onChange={handleInputChange}
                    placeholder="url-de-la-page"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  L'identifiant unique qui formera l'URL de la page.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Type de contenu</Label>
                <Select
                  value={page.type || "page"}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Page</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="section">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        <span>Section</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="component">
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        <span>Composant</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={page.template || "default"}
                  onValueChange={(value) =>
                    handleSelectChange("template", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Template par défaut</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={page.published || false}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("published", checked)
                  }
                />
                <Label htmlFor="published">Publier la page</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isHomepage"
                  checked={page.isHomepage || false}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("isHomepage", checked)
                  }
                />
                <Label htmlFor="isHomepage" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Définir comme page d'accueil
                </Label>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Optimisation pour les moteurs de recherche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="metaTitle">Titre SEO</Label>
                <Input
                  id="metaTitle"
                  name="metaTitle"
                  value={page.metaTitle || ""}
                  onChange={handleInputChange}
                  placeholder="Titre pour les moteurs de recherche"
                />
                <p className="text-xs text-muted-foreground">
                  Si vide, le titre de la page sera utilisé.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="metaDescription">Description SEO</Label>
                <Textarea
                  id="metaDescription"
                  name="metaDescription"
                  value={page.metaDescription || ""}
                  onChange={handleInputChange}
                  placeholder="Description pour les moteurs de recherche"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Une description concise qui apparaîtra dans les résultats de
                  recherche.
                </p>
              </div>

              {/* Preview of how it would look in search results */}
              <div className="mt-6 p-4 border rounded-md">
                <h3 className="text-sm font-medium mb-2">
                  Aperçu dans les résultats de recherche
                </h3>
                <div className="p-4 bg-white border rounded-md">
                  <div className="text-blue-600 text-lg font-medium truncate">
                    {page.metaTitle || page.title || "Titre de la page"}
                  </div>
                  <div className="text-green-700 text-sm">
                    www.votresite.com/{page.slug === "home" ? "" : page.slug}
                  </div>
                  <div className="text-gray-600 text-sm line-clamp-2 mt-1">
                    {page.metaDescription ||
                      "Aucune description fournie. Ajoutez une meta description pour améliorer votre référencement."}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[80%] sm:max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Aperçu de la page</DialogTitle>
            <DialogDescription>
              Prévisualisation de votre contenu avant publication.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-6 mt-4 prose prose-sm max-w-none">
            <Markdown content={page.content || ""} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog
        open={isUnsavedDialogOpen}
        onOpenChange={setIsUnsavedDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non enregistrées</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non enregistrées. Voulez-vous les
              enregistrer avant de quitter ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsUnsavedDialogOpen(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsUnsavedDialogOpen(false);
                pendingAction();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ignorer les modifications
            </AlertDialogAction>
            <Button
              onClick={async () => {
                await handleSavePage();
                setIsUnsavedDialogOpen(false);
                pendingAction();
              }}
            >
              Enregistrer et continuer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revisions Dialog */}
      <Dialog
        open={isRevisionsDialogOpen}
        onOpenChange={setIsRevisionsDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Historique des révisions</DialogTitle>
            <DialogDescription>
              Consultez et restaurez les versions précédentes de cette page.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            {revisions.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Aucune révision disponible
              </p>
            ) : (
              <div className="space-y-4">
                {revisions.map((revision, index) => (
                  <div
                    key={revision.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">
                        Révision #{revision.revisionNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(revision.createdAt)}
                      </p>
                      {revision.restoredAt && (
                        <p className="text-xs text-blue-600 mt-1">
                          Restaurée le {formatDate(revision.restoredAt)}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestoreRevision(revision.id)}
                    >
                      Restaurer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevisionsDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageEditor;