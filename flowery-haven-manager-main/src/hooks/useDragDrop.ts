// src/hooks/useDragDrop.ts
import { useState, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { ComponentItem } from '@/components/cms/editor/DragDropEditor';
import { cmsEditorService } from '@/services/cms-editor.service';

/**
 * Hook personnalisé pour gérer le drag-and-drop dans l'éditeur CMS
 */
export const useDragDrop = (initialComponents: ComponentItem[] = []) => {
    const [components, setComponents] = useState<ComponentItem[]>(initialComponents);
    const [selectedComponent, setSelectedComponent] = useState<ComponentItem | null>(null);

    // Mise à jour des composants
    const updateComponents = useCallback((newComponents: ComponentItem[]) => {
        // Trier par ordre
        const sortedComponents = [...newComponents].sort((a, b) => a.order - b.order);
        setComponents(sortedComponents);
    }, []);

    // Gestion du drag-and-drop
    const handleDragEnd = useCallback((result: DropResult) => {
        const { source, destination, draggableId } = result;

        // Si déposé hors d'une zone valide
        if (!destination) return;

        // Si déposé au même endroit
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Si déplacé de la palette vers la zone de contenu
        if (source.droppableId === 'component-palette' && destination.droppableId === 'page-content') {
            // Récupérer le composant depuis la palette
            const componentType = draggableId.split('-')[0];

            // Récupérer les valeurs par défaut
            const defaults = cmsEditorService.getComponentDefaults(componentType);

            // Créer une nouvelle instance du composant
            const newComponent: ComponentItem = {
                id: `${componentType}-${Date.now()}`,
                type: componentType,
                content: defaults.content,
                settings: defaults.settings,
                order: destination.index * 10
            };

            // Ajouter à la liste des composants
            const newComponents = [...components];
            newComponents.splice(destination.index, 0, newComponent);

            // Mettre à jour les ordres
            updateComponentsOrder(newComponents);

            // Sélectionner automatiquement le nouveau composant pour édition
            setSelectedComponent(newComponent);

            return;
        }

        // Si déplacé dans la zone de contenu
        if (source.droppableId === 'page-content' && destination.droppableId === 'page-content') {
            const newComponents = [...components];
            const [movedComponent] = newComponents.splice(source.index, 1);
            newComponents.splice(destination.index, 0, movedComponent);

            // Mettre à jour les ordres
            updateComponentsOrder(newComponents);

            return;
        }
    }, [components, updateComponents]);

    // Mise à jour de l'ordre des composants
    const updateComponentsOrder = useCallback((componentsList: ComponentItem[]) => {
        const updatedComponents = componentsList.map((component, index) => ({
            ...component,
            order: index * 10
        }));

        setComponents(updatedComponents);
    }, []);

    // Ajouter un composant
    const addComponent = useCallback((type: string) => {
        // Récupérer les valeurs par défaut
        const defaults = cmsEditorService.getComponentDefaults(type);

        // Créer une nouvelle instance du composant
        const newComponent: ComponentItem = {
            id: `${type}-${Date.now()}`,
            type,
            content: defaults.content,
            settings: defaults.settings,
            order: components.length * 10
        };

        // Ajouter à la liste des composants
        const newComponents = [...components, newComponent];
        updateComponentsOrder(newComponents);

        // Sélectionner automatiquement le nouveau composant pour édition
        setSelectedComponent(newComponent);

        return newComponent;
    }, [components, updateComponentsOrder]);

    // Mettre à jour un composant
    const updateComponent = useCallback((updatedComponent: ComponentItem) => {
        const newComponents = components.map(comp =>
            comp.id === updatedComponent.id ? updatedComponent : comp
        );

        setComponents(newComponents);
        setSelectedComponent(updatedComponent);
    }, [components]);

    // Supprimer un composant
    const deleteComponent = useCallback((componentId: string) => {
        const newComponents = components.filter(comp => comp.id !== componentId);
        updateComponentsOrder(newComponents);

        if (selectedComponent?.id === componentId) {
            setSelectedComponent(null);
        }
    }, [components, selectedComponent, updateComponentsOrder]);

    // Générer le contenu HTML
    const generatePageContent = useCallback(() => {
        // Trier les composants par ordre
        const sortedComponents = [...components].sort((a, b) => a.order - b.order);

        // Générer le contenu avec les balises de composants
        let content = "";

        sortedComponents.forEach((component) => {
            // Créer un objet avec le contenu et les paramètres
            const componentData = {
                content: component.content,
                settings: component.settings
            };

            // Ajouter la balise de composant au contenu
            content += `\n<!-- component:${component.id}:${component.order}:${JSON.stringify(componentData)} -->`;
        });

        return content;
    }, [components]);

    return {
        components,
        selectedComponent,
        setSelectedComponent,
        handleDragEnd,
        updateComponentsOrder,
        addComponent,
        updateComponent,
        deleteComponent,
        generatePageContent
    };
};