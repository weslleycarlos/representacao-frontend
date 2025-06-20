// Crie este novo arquivo: src/components/OrderDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2 } from 'lucide-react';

const OrderDetailPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        const loadOrderDetails = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                setError('Erro ao carregar detalhes do pedido.');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) {
            loadOrderDetails();
        }
    }, [orderId]);

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;
    if (!order) return <p className="text-center">Pedido não encontrado.</p>;

    const orderSubtotal = order.items.reduce((total, item) => {
        const itemQty = Object.values(item.quantity || {}).reduce((sum, qty) => sum + qty, 0);
        return total + (item.unit_value * itemQty);
    }, 0);
    const discountValue = orderSubtotal * (order.discount_percentage / 100);

    return (
        <div className="space-y-6">
            <div>
                <Link to="/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para todos os pedidos
                </Link>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Detalhes do Pedido #{order.id}</h1>
                    <Badge variant={order.status === 'Concluído' ? 'default' : 'secondary'}>{order.status}</Badge>
                </div>
                <p className="text-muted-foreground">Pedido realizado em: {formatDate(order.order_date)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Qtd.</TableHead>
                                    <TableHead>Val. Unit.</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map(item => {
                                    const totalQty = Object.values(item.quantity).reduce((s, q) => s + q, 0);
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <p className="font-medium">{item.product_description}</p>
                                                <p className="text-xs text-muted-foreground">{item.product_code}</p>
                                            </TableCell>
                                            <TableCell>{totalQty}</TableCell>
                                            <TableCell>{formatCurrency(item.unit_value)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(item.unit_value * totalQty)}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Resumo Financeiro</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(orderSubtotal)}</span></div>
                            <div className="flex justify-between"><span>Desconto ({order.discount_percentage}%):</span><span className="text-red-600">-{formatCurrency(discountValue)}</span></div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base"><span>Total:</span><span>{formatCurrency(order.total_value)}</span></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
                        <CardContent className="text-sm">
                            <p className="font-semibold">{order.client.razao_social}</p>
                            <p className="text-muted-foreground">{order.client.cnpj}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;