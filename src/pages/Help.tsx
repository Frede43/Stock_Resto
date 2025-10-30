import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  useFAQs, 
  useTutorials, 
  useHelpCategories, 
  useHelpStats,
  useMarkFAQHelpful, 
  useCreateSupportRequest,
  useIncrementFAQViews,
  useIncrementTutorialViews
} from "@/hooks/use-api";
import { 
  HelpCircle, 
  Search, 
  Book, 
  Video,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Play,
  Download,
  Star,
  ThumbsUp,
  Send
} from "lucide-react";

// Types pour l'interface locale
interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  videoUrl?: string;
  views: number;
  created_at: string;
  updated_at: string;
}

type SupportPriority = "low" | "medium" | "high" | "urgent";

// Données statiques remplacées par des appels API dynamiques

export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSupportDialog, setShowSupportDialog] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [supportRequest, setSupportRequest] = useState<{
    subject: string;
    category: string;
    priority: SupportPriority;
    message: string;
  }>({
    subject: "",
    category: "",
    priority: "medium",
    message: ""
  });

  // Hooks pour les données dynamiques
  const { data: faqData, isLoading: faqLoading } = useFAQs({
    search: searchTerm || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined
  });
  
  const { data: tutorialData, isLoading: tutorialLoading } = useTutorials({
    search: searchTerm || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined
  });
  
  const { data: categoriesData } = useHelpCategories();
  const { data: statsData } = useHelpStats();
  
  // Mutations
  const markHelpfulMutation = useMarkFAQHelpful();
  const createSupportMutation = useCreateSupportRequest();
  const incrementFAQViewsMutation = useIncrementFAQViews();
  const incrementTutorialViewsMutation = useIncrementTutorialViews();

  // Catégories dynamiques avec fallback
  const categories = ["all", ...(categoriesData || ["Démarrage", "Produits", "Ventes", "Stocks", "Rapports", "Paramètres"])];
  const supportCategories = ["Technique", "Fonctionnel", "Formation", "Facturation"];
  
  // Données avec fallback
  const faqItems = faqData?.results || [];
  const tutorials = tutorialData?.results || [];

  // Le filtrage est maintenant géré côté serveur via les paramètres de requête
  const filteredFAQ = faqItems;
  const filteredTutorials = tutorials;

  const getDifficultyInfo = (difficulty: Tutorial["difficulty"]) => {
    switch (difficulty) {
      case "beginner":
        return { variant: "success" as const, label: "Débutant" };
      case "intermediate":
        return { variant: "warning" as const, label: "Intermédiaire" };
      case "advanced":
        return { variant: "destructive" as const, label: "Avancé" };
    }
  };

  const submitSupportRequest = () => {
    createSupportMutation.mutate(supportRequest, {
      onSuccess: () => {
        setShowSupportDialog(false);
        setSupportRequest({
          subject: "",
          category: "",
          priority: "medium",
          message: ""
        });
      }
    });
  };

  const markHelpful = (faqId: string) => {
    markHelpfulMutation.mutate(faqId);
  };
  
  const handleFAQClick = (faqId: string) => {
    incrementFAQViewsMutation.mutate(faqId);
  };
  
  const handleTutorialClick = (tutorial: Tutorial) => {
    incrementTutorialViewsMutation.mutate(tutorial.id);
    setSelectedTutorial(tutorial);
    setShowVideoModal(true);
  };
  
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // Support multiple YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
      /(?:youtu\.be\/)([^&\n?#]+)/,
      /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
      /(?:youtube\.com\/v\/)([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        console.log('YouTube Video ID found:', match[1]);
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    console.log('No YouTube video ID found in URL:', url);
    return null;
  };

  return (
    <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Centre d'aide
              </h1>
              <p className="text-muted-foreground">
                Documentation, tutoriels et support technique
              </p>
            </div>
            <Dialog open={showSupportDialog} onOpenChange={setShowSupportDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contacter le support
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Demande de support</DialogTitle>
                  <DialogDescription>
                    Décrivez votre problème, notre équipe vous aidera rapidement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sujet</Label>
                    <Input
                      placeholder="Résumé de votre problème"
                      value={supportRequest.subject}
                      onChange={(e) => setSupportRequest(prev => ({...prev, subject: e.target.value}))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <select 
                        value={supportRequest.category} 
                        onChange={(e) => setSupportRequest(prev => ({...prev, category: e.target.value}))}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {supportCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priorité</Label>
                      <select 
                        value={supportRequest.priority} 
                        onChange={(e) => setSupportRequest(prev => ({...prev, priority: e.target.value as SupportPriority}))}
                        className="w-full p-2 border rounded"
                      >
                        <option value="low">Faible</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Élevée</option>
                        <option value="urgent">Urgente</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description détaillée</Label>
                    <Textarea
                      placeholder="Décrivez votre problème en détail..."
                      value={supportRequest.message}
                      onChange={(e) => setSupportRequest(prev => ({...prev, message: e.target.value}))}
                      rows={5}
                    />
                  </div>

                  <Button 
                    onClick={submitSupportRequest} 
                    disabled={createSupportMutation.isPending}
                    className="w-full gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {createSupportMutation.isPending ? "Envoi en cours..." : "Envoyer la demande"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Quick Contact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Phone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Support téléphonique</h3>
                  <p className="text-sm text-muted-foreground mb-3">Lun-Ven 8h-18h</p>
                  <p className="font-medium">+257 22 123 456</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-success to-success/80 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Mail className="h-6 w-6 text-success-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Support email</h3>
                  <p className="text-sm text-muted-foreground mb-3">Réponse sous 24h</p>
                  <p className="font-medium">support@barstock.demo</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-br from-warning to-warning/80 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-6 w-6 text-warning-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Chat en direct</h3>
                  <p className="text-sm text-muted-foreground mb-3">Disponible 24/7</p>
                  <Button size="sm">Démarrer le chat</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans la documentation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "Toutes catégories" : cat}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="faq" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="tutorials">Tutoriels</TabsTrigger>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Questions fréquentes
                  </CardTitle>
                  <CardDescription>
                    {faqLoading ? "Chargement..." : `${filteredFAQ.length} question(s) trouvée(s)`}
                    {statsData && (
                      <span className="ml-4 text-sm text-muted-foreground">
                        Total: {statsData.total_faqs} FAQ disponibles
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {faqLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Chargement des FAQ...</div>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFAQ.map((item) => (
                        <AccordionItem key={item.id} value={item.id} className="border rounded-lg px-4">
                          <AccordionTrigger 
                            className="hover:no-underline"
                            onClick={() => handleFAQClick(item.id)}
                          >
                            <div className="flex items-center gap-2 text-left">
                              <span>{item.question}</span>
                              <Badge variant="outline">{item.category}</Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <p className="text-muted-foreground mb-4">{item.answer}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{item.views} vues</span>
                                <span>{item.helpful} personnes ont trouvé cela utile</span>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => markHelpful(item.id)}
                                disabled={markHelpfulMutation.isPending}
                                className="gap-1"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                Utile
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tutorials Tab */}
            <TabsContent value="tutorials">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Tutoriels vidéo
                  </CardTitle>
                  <CardDescription>
                    Guides pratiques pour maîtriser toutes les fonctionnalités
                    {statsData && (
                      <span className="block mt-1 text-sm">
                        {statsData.total_tutorials} tutoriels disponibles
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tutorialLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Chargement des tutoriels...</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredTutorials.map((tutorial) => {
                        const difficultyInfo = getDifficultyInfo(tutorial.difficulty);
                        
                        return (
                          <Card 
                            key={tutorial.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleTutorialClick(tutorial)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="relative h-16 w-16 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                                  <Play className="h-8 w-8 text-primary-foreground" />
                                  {tutorial.videoUrl && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <Video className="h-2 w-2 text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">{tutorial.description}</p>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">{tutorial.category}</Badge>
                                    <Badge variant={difficultyInfo.variant}>{difficultyInfo.label}</Badge>
                                    <span className="text-sm text-muted-foreground">{tutorial.duration}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{tutorial.views} vues</span>
                                    {tutorial.videoUrl && (
                                      <span className="text-red-500 font-medium">📹 Vidéo disponible</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Modal Vidéo */}
            <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    {selectedTutorial?.title}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedTutorial?.description} • {selectedTutorial?.duration}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedTutorial?.videoUrl ? (
                    <div className="aspect-video w-full">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedTutorial.videoUrl) || ''}
                        title={selectedTutorial.title}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Vidéo non disponible</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedTutorial?.category}</Badge>
                    {selectedTutorial && (
                      <Badge variant={getDifficultyInfo(selectedTutorial.difficulty).variant}>
                        {getDifficultyInfo(selectedTutorial.difficulty).label}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{selectedTutorial?.duration}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Documentation Tab */}
            <TabsContent value="documentation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5" />
                    Documentation technique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-12 w-12 text-primary mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Guide d'installation</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Instructions complètes pour l'installation
                        </p>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-3 w-3" />
                          Télécharger PDF
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-12 w-12 text-success mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">Manuel utilisateur</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Guide complet d'utilisation du système
                        </p>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-3 w-3" />
                          Télécharger PDF
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <FileText className="h-12 w-12 text-warning mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">API Documentation</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Documentation technique pour développeurs
                        </p>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-3 w-3" />
                          Télécharger PDF
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Support téléphonique</p>
                        <p className="text-sm text-muted-foreground">+257 22 123 456</p>
                        <p className="text-xs text-muted-foreground">Lundi-Vendredi 8h-18h</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <Mail className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Email support</p>
                        <p className="text-sm text-muted-foreground">support@barstock.demo</p>
                        <p className="text-xs text-muted-foreground">Réponse sous 24h</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 border rounded-lg">
                      <MessageCircle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Chat en direct</p>
                        <p className="text-sm text-muted-foreground">Assistance immédiate</p>
                        <p className="text-xs text-muted-foreground">Disponible 24/7</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ressources utiles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Book className="h-4 w-4" />
                      Base de connaissances
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Video className="h-4 w-4" />
                      Chaîne YouTube
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Forum communautaire
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4" />
                      Notes de version
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
  );
}
