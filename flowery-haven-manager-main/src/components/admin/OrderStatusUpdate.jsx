// components/admin/OrderStatusUpdate.jsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { orderService } from '@/services/order.service';

export function OrderStatusUpdate({ order, onStatusChange }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const handleStatusChange = async (newStatus) => {
        try {
            setIsUpdating(true);

            const updatedOrder = await orderService.updateOrderStatus(order.id, newStatus);

            // Si on passe à "delivered", afficher un message spécial
            if (newStatus === 'delivered') {
                toast({
                    title: "Commande marquée comme livrée",
                    description: "Le stock des produits a été automatiquement mis à jour.",
                    variant: "success",
                });
            } else {
                toast({
                    title: "Statut mis à jour",
                    description: `La commande est maintenant ${newStatus}`,
                    variant: "default",
                });
            }

            // Appeler le callback si fourni
            if (onStatusChange) {
                onStatusChange(updatedOrder);
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour du statut:", error);
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut de la commande",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="font-medium">Mettre à jour le statut</h3>
            <div className="flex flex-wrap gap-2">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                    <Button
                        key={status}
                        size="sm"
                        variant={order.status === status ? "default" : "outline"}
                        onClick={() => handleStatusChange(status)}
                        disabled={isUpdating || order.status === status}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                ))}
            </div>
            {order.status === 'delivered' && (
                <p className="text-sm text-muted-foreground mt-2">
                    Stock mis à jour automatiquement.
                </p>
            )}
        </div>
    );
}