// src/pages/Blog.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { Search, Calendar, User, Tag, ArrowLeft, SortAsc, Filter, Grid, List, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { blogService } from "@/services/blog.service";
import { BlogPost, BlogTag } from "@/types/blog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get URL params
  const categoryParam = searchParams.get("category");
  const tagParam = searchParams.get("tag");
  const postId = searchParams.get("id");
  
  // States
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [popularTags, setPopularTags] = useState<BlogTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  
  // Filter states
  const [activeCategory, setActiveCategory] = useState(categoryParam || "all");
  const [activeTag, setActiveTag] = useState(tagParam || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<'date' | 'popularity' | 'title'>('date');
  
  // Load initial data
  useEffect(() => {
    loadPosts();
  }, []);
  
  // Apply filters whenever filter state changes
  useEffect(() => {
    if (posts.length > 0) {
      filterPosts();
    }
  }, [posts, activeCategory, activeTag, searchQuery, sortOrder]);
  
  // Load post from URL parameter
  useEffect(() => {
    if (postId) {
      loadSinglePost(parseInt(postId));
    } else {
      setSelectedPost(null);
    }
  }, [postId]);
  
  // Fetch all posts and metadata
  const loadPosts = async () => {
    setIsLoading(true);
    try {
      // Get all published posts
      const allPosts = await blogService.getAllPosts();
      setPosts(allPosts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(allPosts.map(post => post.category)));
      setCategories(uniqueCategories);
      
      // Extract tags and count their occurrences
      const tags: { [key: string]: number } = {};
      allPosts.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            tags[tag] = (tags[tag] || 0) + 1;
          });
        }
      });
      
      // Convert to array and sort by count
      const tagsArray: BlogTag[] = Object.keys(tags).map(tag => ({
        name: tag,
        count: tags[tag]
      })).sort((a, b) => b.count - a.count);
      
      setPopularTags(tagsArray.slice(0, 10)); // Top 10 tags
      
      // Apply initial filters
      filterPosts(allPosts);
    } catch (error) {
      console.error("Error loading blog posts:", error);
      setError("Erreur lors du chargement des articles");
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a single post by ID
  const loadSinglePost = async (id: number) => {
    setIsLoading(true);
    try {
      const post = await blogService.getPostById(id);
      if (post) {
        setSelectedPost(post);
      } else {
        setError("Article non trouvé");
        // If post not found, clear the URL param
        setSearchParams({});
      }
    } catch (error) {
      console.error(`Error loading post ${id}:`, error);
      setError("Erreur lors du chargement de l'article");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter posts based on active filters
  const filterPosts = (postsToFilter = posts) => {
    // Start with all posts
    let filtered = [...postsToFilter];
    
    // Apply category filter
    if (activeCategory && activeCategory !== "all") {
      filtered = filtered.filter(post => post.category === activeCategory);
    }
    
    // Apply tag filter
    if (activeTag) {
      filtered = filtered.filter(post => post.tags?.includes(activeTag));
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(lowerQuery) ||
        post.content.toLowerCase().includes(lowerQuery) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(lowerQuery)) ||
        post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'popularity':
          return (b.viewCount || 0) - (a.viewCount || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    setFilteredPosts(filtered);
  };
  
  // Handle filter changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    setSearchParams(params);
    
    // Reset other filters
    setSelectedPost(null);
    params.delete("id");
  };
  
  const handleTagFilter = (tag: string) => {
    setActiveTag(tag);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    params.set("tag", tag);
    setSearchParams(params);
    
    // Reset other filters
    setSelectedPost(null);
    params.delete("id");
    setActiveCategory("all");
  };
  
  const handleClearTagFilter = () => {
    setActiveTag("");
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    params.delete("tag");
    setSearchParams(params);
  };
  
  const handleSortChange = (sort: 'date' | 'popularity' | 'title') => {
    setSortOrder(sort);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle view post detail
  const handleViewPost = (post: BlogPost) => {
    navigate(`/blog/${post.id}`);
  };
  
  // Handle back to posts list
  const handleBackToPosts = () => {
    setSelectedPost(null);
    
    // Update URL parameters
    const params = new URLSearchParams(searchParams);
    params.delete("id");
    setSearchParams(params);
  };
  
  // Format date to French locale
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  // Get category name from ID
  const getCategoryName = (categoryId: string) => {
    // This would normally come from a map of categories
    // For now just return the ID with first letter capitalized
    return categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="pt-24 pb-16 container mx-auto px-4">
        {selectedPost ? (
          // Single blog post view
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={handleBackToPosts}
              className="mb-6 flex items-center gap-1"
            >
              <ArrowLeft size={16} />
              Retour aux articles
            </Button>
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-96 w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="rounded-lg overflow-hidden mb-8">
                  <img 
                    src={selectedPost.imageUrl} 
                    alt={selectedPost.title}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
                
                <div className="mb-8">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge 
                      variant="outline"
                      className="hover:bg-primary/10 cursor-pointer"
                      onClick={() => handleCategoryChange(selectedPost.category)}
                    >
                      {getCategoryName(selectedPost.category)}
                    </Badge>
                    
                    {selectedPost.tags && selectedPost.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary"
                        className="hover:bg-secondary/80 cursor-pointer"
                        onClick={() => handleTagFilter(tag)}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <h1 className="text-4xl font-serif mb-4">{selectedPost.title}</h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatDate(selectedPost.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={16} />
                      <span>{selectedPost.author}</span>
                    </div>
                  </div>
                  
                  <p className="text-lg font-medium mb-6">{selectedPost.excerpt}</p>
                  
                  <div className="prose prose-stone max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                  </div>
                </div>
                
                {/* Social sharing section could go here */}
                
                {/* Comments section could go here */}
              </>
            )}
          </div>
        ) : (
          // Blog posts list view
          <>
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-serif mb-4">Notre Blog</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Découvrez nos articles sur l'univers des fleurs, des conseils d'entretien et les dernières tendances florales.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar with filters */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardContent className="p-4 space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Rechercher</h3>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Catégories</h3>
                      <ul className="space-y-1">
                        <li>
                          <Button
                            variant={activeCategory === "all" ? "secondary" : "ghost"}
                            className="justify-start px-2 w-full"
                            onClick={() => handleCategoryChange("all")}
                          >
                            Toutes les catégories
                          </Button>
                        </li>
                        {categories.map(category => (
                          <li key={category}>
                            <Button
                              variant={activeCategory === category ? "secondary" : "ghost"}
                              className="justify-start px-2 w-full"
                              onClick={() => handleCategoryChange(category)}
                            >
                              {getCategoryName(category)}
                              <ChevronRight size={16} className="ml-auto" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Tags populaires</h3>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map(tag => (
                          <Badge
                            key={tag.name}
                            variant={activeTag === tag.name ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleTagFilter(tag.name)}
                          >
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Main content */}
              <div className="lg:col-span-3">
                {/* Active filters and sort options */}
                <div className="flex flex-wrap justify-between items-center mb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTag && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Tag size={14} />
                        #{activeTag}
                        <button 
                          className="ml-1 hover:text-destructive"
                          onClick={handleClearTagFilter}
                        >
                          &times;
                        </button>
                      </Badge>
                    )}
                    
                    {activeCategory !== "all" && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryName(activeCategory)}
                        <button 
                          className="ml-1 hover:text-destructive"
                          onClick={() => handleCategoryChange("all")}
                        >
                          &times;
                        </button>
                      </Badge>
                    )}
                    
                    {searchQuery && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Search size={14} />
                        {searchQuery}
                        <button 
                          className="ml-1 hover:text-destructive"
                          onClick={() => setSearchQuery("")}
                        >
                          &times;
                        </button>
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <SortAsc size={14} />
                          Trier
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleSortChange('date')}
                          className={sortOrder === 'date' ? 'bg-accent' : ''}
                        >
                          Les plus récents
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSortChange('popularity')}
                          className={sortOrder === 'popularity' ? 'bg-accent' : ''}
                        >
                          Les plus populaires
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleSortChange('title')}
                          className={sortOrder === 'title' ? 'bg-accent' : ''}
                        >
                          Par titre (A-Z)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="border rounded-md flex">
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid size={16} />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="sm"
                        className="h-8"
                        onClick={() => setViewMode("list")}
                      >
                        <List size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {isLoading ? (
                  // Loading skeletons
                  <div className={`grid grid-cols-1 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-6`}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Card key={i}>
                        <Skeleton className="h-48 rounded-t-lg" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-4/5" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : filteredPosts.length === 0 ? (
                  // No results
                  <div className="text-center py-12 bg-muted/20 rounded-lg">
                    <h3 className="text-xl font-medium mb-2">Aucun article trouvé</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun article ne correspond à vos critères de recherche.
                    </p>
                    <Button onClick={() => {
                      setActiveCategory("all");
                      setActiveTag("");
                      setSearchQuery("");
                      setSearchParams({});
                    }}>
                      Réinitialiser les filtres
                    </Button>
                  </div>
                ) : viewMode === "grid" ? (
                  // Grid view
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPosts.map(post => (
                      <BlogPostCard
                        key={post.id}
                        post={post}
                        onTagClick={handleTagFilter}
                        onViewPost={handleViewPost}
                      />
                    ))}
                  </div>
                ) : (
                  // List view
                  <div className="space-y-6">
                    {filteredPosts.map(post => (
                      <Card key={post.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 h-40 md:h-auto">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6 md:w-2/3">
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="outline">
                                {getCategoryName(post.category)}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(post.date)}
                              </div>
                            </div>
                            <h3 className="text-xl font-medium mb-2">{post.title}</h3>
                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {post.excerpt}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="flex flex-wrap gap-1">
                                {post.tags && post.tags.slice(0, 3).map(tag => (
                                  <Badge 
                                    key={tag} 
                                    variant="secondary"
                                    className="text-xs cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTagFilter(tag);
                                    }}
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => handleViewPost(post)}
                              >
                                Lire l'article
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPage;