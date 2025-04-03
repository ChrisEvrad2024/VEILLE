// src/services/print.service.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from './order.service';
import { authService } from './auth.service';

export class PrintService {
    /**
     * Génère et télécharge une facture PDF pour une commande
     */
    static generateInvoice(order: Order): void {
        const doc = new jsPDF();

        // En-tête du document
        doc.setFontSize(20);
        doc.text('FACTURE', 105, 15, { align: 'center' });

        // Logo (à remplacer par votre logo réel)
        doc.setFontSize(24);
        doc.setTextColor(44, 130, 78);
        doc.text('ChezFLORA', 20, 20);
        doc.setTextColor(0, 0, 0);

        // Informations de l'entreprise
        doc.setFontSize(10);
        doc.text('ChezFLORA SARL', 20, 30);
        doc.text('123 Avenue des Fleurs', 20, 35);
        doc.text('75000 Paris, France', 20, 40);
        doc.text('Tel: +33 1 23 45 67 89', 20, 45);
        doc.text('Email: contact@ChezFLORA.com', 20, 50);

        // Informations de la facture
        doc.setFontSize(12);
        doc.text(`Facture #: ${order.id.substring(0, 8).toUpperCase()}`, 140, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 140, 35);
        doc.text(`Statut: ${this.getStatusLabel(order.status)}`, 140, 40);

        // Informations du client
        doc.setFontSize(11);
        doc.text('FACTURER À:', 20, 65);
        doc.setFontSize(10);
        doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, 20, 70);
        doc.text(order.shippingAddress.address, 20, 75);
        if (order.shippingAddress.address2) {
            doc.text(order.shippingAddress.address2, 20, 80);
        }
        doc.text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, 20, order.shippingAddress.address2 ? 85 : 80);
        doc.text(`${order.shippingAddress.state}, ${order.shippingAddress.country}`, 20, order.shippingAddress.address2 ? 90 : 85);
        doc.text(`Tel: ${order.shippingAddress.phone}`, 20, order.shippingAddress.address2 ? 95 : 90);

        // Tableau des articles
        const tableColumn = ["Article", "Quantité", "Prix unitaire", "Total"];
        const tableRows = order.items.map(item => [
            item.name,
            item.quantity.toString(),
            `${item.price.toLocaleString()} XAF`,
            `${(item.price * item.quantity).toLocaleString()} XAF`
        ]);

        // Ajout du tableau
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 105,
            theme: 'striped',
            headStyles: {
                fillColor: [44, 130, 78],
                textColor: [255, 255, 255]
            },
            styles: {
                fontSize: 9
            }
        });

        // Informations de paiement et totaux
        const finalY = (doc as any).lastAutoTable.finalY || 150;

        doc.setFontSize(10);
        doc.text('RÉSUMÉ DE LA COMMANDE', 140, finalY + 10);
        doc.text(`Sous-total:`, 140, finalY + 15);
        doc.text(`${order.subtotal.toLocaleString()} XAF`, 175, finalY + 15, { align: 'right' });

        doc.text(`Livraison:`, 140, finalY + 20);
        doc.text(`${order.shipping === 0 ? 'Gratuit' : `${order.shipping.toLocaleString()} XAF`}`, 175, finalY + 20, { align: 'right' });

        if (order.discount > 0) {
            doc.text(`Réduction:`, 140, finalY + 25);
            doc.text(`-${order.discount.toLocaleString()} XAF`, 175, finalY + 25, { align: 'right' });
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL:`, 140, finalY + 35);
            doc.text(`${order.total.toLocaleString()} XAF`, 175, finalY + 35, { align: 'right' });
        } else {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL:`, 140, finalY + 30);
            doc.text(`${order.total.toLocaleString()} XAF`, 175, finalY + 30, { align: 'right' });
        }

        // Méthode de paiement
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Méthode de paiement: ${this.getPaymentMethodLabel(order.paymentInfo.method)}`, 20, finalY + 15);
        doc.text(`Statut du paiement: ${this.getPaymentStatusLabel(order.paymentInfo.status)}`, 20, finalY + 20);

        // Pied de page
        doc.setFontSize(8);
        doc.text('Merci pour votre commande !', 105, 280, { align: 'center' });
        doc.text('Pour toute question concernant cette facture, veuillez nous contacter.', 105, 285, { align: 'center' });

        // Téléchargement du PDF
        doc.save(`facture_${order.id.substring(0, 8).toUpperCase()}.pdf`);
    }

    /**
     * Génère et télécharge un bordereau d'expédition PDF
     */
    static generatePackingSlip(order: Order): void {
        const doc = new jsPDF();

        // En-tête du document
        doc.setFontSize(20);
        doc.text('BORDEREAU D\'EXPÉDITION', 105, 15, { align: 'center' });

        // Logo (à remplacer par votre logo réel)
        doc.setFontSize(24);
        doc.setTextColor(44, 130, 78);
        doc.text('ChezFLORA', 20, 20);
        doc.setTextColor(0, 0, 0);

        // Informations de l'entreprise
        doc.setFontSize(10);
        doc.text('ChezFLORA SARL', 20, 30);
        doc.text('123 Avenue des Fleurs', 20, 35);
        doc.text('75000 Paris, France', 20, 40);

        // Informations de commande
        doc.setFontSize(12);
        doc.text(`Commande #: ${order.id.substring(0, 8).toUpperCase()}`, 140, 30);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 140, 35);

        // Adresse de livraison
        doc.setFontSize(11);
        doc.text('ADRESSE DE LIVRAISON:', 20, 60);
        doc.setFontSize(10);
        doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, 20, 65);
        doc.text(order.shippingAddress.address, 20, 70);
        if (order.shippingAddress.address2) {
            doc.text(order.shippingAddress.address2, 20, 75);
        }
        doc.text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`, 20, order.shippingAddress.address2 ? 80 : 75);
        doc.text(`${order.shippingAddress.state}, ${order.shippingAddress.country}`, 20, order.shippingAddress.address2 ? 85 : 80);
        doc.text(`Tel: ${order.shippingAddress.phone}`, 20, order.shippingAddress.address2 ? 90 : 85);

        // Informations d'expédition
        if (order.trackingInfo) {
            doc.setFontSize(11);
            doc.text('INFORMATIONS D\'EXPÉDITION:', 140, 60);
            doc.setFontSize(10);
            doc.text(`Transporteur: ${order.trackingInfo.carrier}`, 140, 65);
            doc.text(`N° de suivi: ${order.trackingInfo.trackingNumber}`, 140, 70);
        }

        // Tableau des articles
        const tableColumn = ["Article", "Référence", "Quantité"];
        const tableRows = order.items.map(item => [
            item.name,
            item.productId.substring(0, 8),
            item.quantity.toString()
        ]);

        // Ajout du tableau
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 100,
            theme: 'grid',
            headStyles: {
                fillColor: [44, 130, 78],
                textColor: [255, 255, 255]
            },
            styles: {
                fontSize: 9
            }
        });

        // Zone de signature
        const finalY = (doc as any).lastAutoTable.finalY || 150;
        doc.setDrawColor(200, 200, 200);
        doc.rect(20, finalY + 20, 80, 40);
        doc.setFontSize(10);
        doc.text('Signature du livreur:', 20, finalY + 18);

        doc.rect(110, finalY + 20, 80, 40);
        doc.text('Signature du client:', 110, finalY + 18);

        // Pied de page - Instructions
        doc.setFontSize(8);
        doc.text('INSTRUCTIONS SPÉCIALES:', 20, finalY + 70);
        if (order.notes) {
            doc.setFontSize(10);
            doc.text(order.notes, 20, finalY + 75);
        } else {
            doc.setFontSize(10);
            doc.text('Aucune instruction spéciale', 20, finalY + 75);
        }

        // Téléchargement du PDF
        doc.save(`bordereau_${order.id.substring(0, 8).toUpperCase()}.pdf`);
    }

    /**
     * Génère et télécharge un rapport d'expédition PDF pour plusieurs commandes
     */
    static generateShippingReport(orders: Order[]): void {
        const doc = new jsPDF();

        // En-tête du document
        doc.setFontSize(18);
        doc.text('RAPPORT D\'EXPÉDITION', 105, 15, { align: 'center' });

        // Informations du rapport
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 25);
        doc.text(`Généré par: ${authService.getCurrentUser()?.firstName || ''} ${authService.getCurrentUser()?.lastName || ''}`, 20, 30);
        doc.text(`Nombre de commandes: ${orders.length}`, 20, 35);

        // Tableau des commandes
        const tableColumn = ["ID Commande", "Client", "Date", "Statut", "Adresse"];
        const tableRows = orders.map(order => [
            order.id.substring(0, 8).toUpperCase(),
            `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
            new Date(order.createdAt).toLocaleDateString('fr-FR'),
            this.getStatusLabel(order.status),
            `${order.shippingAddress.city}, ${order.shippingAddress.country}`
        ]);

        // Ajout du tableau
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: {
                fillColor: [44, 130, 78]
            },
            styles: {
                fontSize: 8
            },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 40 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto' }
            }
        });

        // Téléchargement du PDF
        doc.save(`rapport_expedition_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    // Méthodes utilitaires pour les labels
    private static getStatusLabel(status: string): string {
        const statusMap: { [key: string]: string } = {
            'pending': 'En attente',
            'processing': 'En traitement',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée',
            'refunded': 'Remboursée'
        };
        return statusMap[status] || status;
    }

    private static getPaymentMethodLabel(method: string): string {
        const methodMap: { [key: string]: string } = {
            'card': 'Carte bancaire',
            'paypal': 'PayPal',
            'transfer': 'Virement bancaire',
            'cash': 'Paiement à la livraison'
        };
        return methodMap[method] || method;
    }

    private static getPaymentStatusLabel(status: string): string {
        const statusMap: { [key: string]: string } = {
            'pending': 'En attente',
            'paid': 'Payé',
            'failed': 'Échoué',
            'refunded': 'Remboursé'
        };
        return statusMap[status] || status;
    }
}