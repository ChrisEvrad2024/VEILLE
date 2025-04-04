// src/components/admin/CMSEditorButton.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface CMSEditorButtonProps {
  pageId: string;
  className?: string;
}

const CMSEditorButton: React.FC<CMSEditorButtonProps> = ({ pageId, className = '' }) => {
  return (
    <Button 
      variant="outline" 
      asChild
      className={`flex items-center gap-2 ${className}`}
      title="Ouvrir dans l'éditeur visuel"
    >
      <Link to={`/admin/cms/${pageId}/visual-editor`}>
        <Eye className="h-4 w-4" />
        Éditeur visuel
      </Link>
    </Button>
  );
};

export default CMSEditorButton;