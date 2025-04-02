// src/components/layout/CMSLayout.tsx
import React from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import {
  FileText,
  Layout,
  Clock,
  BarChart,
  Settings,
  Image,
  Calendar,
  PanelLeft,
} from "lucide-react";

const CMSLayout: React.FC = () => {
  const location = useLocation();
  
  // Navigation items for CMS section
  const navItems = [
    {
      title: "Pages",
      href: "/admin/cms",
      icon: <FileText className="h-5 w-5" />,
      exact: true,
    },
    {
      title: "Composants",
      href: "/admin/cms/components",
      icon: <Layout className="h-5 w-5" />,
    },
    {
      title: "Pages spéciales",
      href: "/admin/cms/special",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Historique des révisions",
      href: "/admin/cms/revisions",
      icon: <Clock className="h-5 w-5" />,
    },
    {
      title: "Modèles",
      href: "/admin/cms/templates",
      icon: <PanelLeft className="h-5 w-5" />,
    },
    {
      title: "Bibliothèque de médias",
      href: "/admin/media",
      icon: <Image className="h-5 w-5" />,
    },
    {
      title: "Statistiques",
      href: "/admin/cms/statistics",
      icon: <BarChart className="h-5 w-5" />,
    },
    {
      title: "Paramètres",
      href: "/admin/cms/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-muted/30 border-r hidden md:block">
        <div className="p-4">
          <h2 className="font-semibold text-lg">Gestion de contenu</h2>
          <p className="text-sm text-muted-foreground">
            Administration du site web
          </p>
        </div>
        
        <nav className="mt-6 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);
              
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CMSLayout;