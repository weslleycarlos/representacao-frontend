import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ordersService, cnpjService, catalogService } from '../lib/api';
import { getOfflineOrders, removeOfflineOrder } from '../lib/offline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, Clock, Search, ShoppingCart, Loader2, WifiOff, Trash2, ArrowRight, ArrowLeft, CheckCircle2
} from 'lucide-react';

// --- COMPONENTE INTERNO: Linha de Item do Pedido ---
const OrderItemRow = ({ item, index, onUpdate, onRemove }) => {
    const [code, setCode] = useState(item.code || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleProductSearch = async () => {
        if (!code) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get(`/catalog/products/by_code/${code}`);
            onUpdate(index, { ...item, code: response.data.code, description: response.data.description, unit_value: response.data.value, sizes: response.data.sizes || [], quantity: {} });
        } catch (err) {
            setError('Produto não encontrado');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleQuantityChange = (size, quantity) => {
        const newQuantity = { ...item.quantity, [size]: parseInt(quantity) || 0 };
        onUpdate(index, { ...item, quantity: newQuantity });
    };

    return (
        <Card className="p-4 space-y-3 bg-white shadow-sm">
            <div className="flex items-start space-x-2">
                <div className="flex-1 space-y-1">
                    <Label>Código do Produto</Label>
                    <div className="flex items-center space-x-2">
                        <Input value={code} onChange={e => setCode(e.target.value)} onBlur={handleProductSearch} placeholder="Digite o código e saia"/>
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
                <div className="flex-1 space-y-1">
                    <Label>Descrição</Label>
                    <Input value={item.description} disabled readOnly />
                </div>
                <div className="w-32 space-y-1">
                    <Label>Valor Unit.</Label>
                    <Input type="number" value={item.unit_value} disabled readOnly />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)} className="mt-6">
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
            {item.sizes && item.sizes.length > 0 && (
                <div className="space-y-1">
                    <Label>Grade de Tamanhos</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2"> {/* Ajustado para melhor distribuição */}
                        {item.sizes.map(size => (
                            <div key={size} className="space-y-1 text-center">
                                <Label className="text-xs font-normal">{size}</Label>
                                <Input type="number" min="0" placeholder="0" 
                                    value={item.quantity ? (item.quantity[size] || '') : ''}
                                    onChange={e => handleQuantityChange(size, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

// --- PÁGINA DE PEDIDOS PRINCIPAL ---
const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [offlineOrders, setOfflineOrders] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showOrderDialog, setShowOrderDialog] = useState(false);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [orderForm, setOrderForm] = useState({ client: null, payment_method_id: '', discount_percentage: 0, observations: '', items: [] });
    const [clientSearch, setClientSearch] = useState({ query: '', loading: false, error: '' });
    const navigate = useNavigate();

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    useEffect(() => {
        loadData();
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [onlineData, offlineData, paymentData] = await Promise.all([
                ordersService.getOrders(),
                getOfflineOrders(),
                catalogService.getPaymentMethods()
            ]);
            setOrders(onlineData);
            setOfflineOrders(offlineData);
            setPaymentMethods(paymentData);
        } catch (error) {
            console.error("Erro ao carregar dados da página:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleClientSearch = async () => {
        if (!clientSearch.query) return;
        const sanitizedCnpj = clientSearch.query.replace(/[.\-/]/g, '');
        setClientSearch({ ...clientSearch, loading: true, error: '' });
        try {
            const response = await api.get(`/clients/by_cnpj/${sanitizedCnpj}`);
            setOrderForm({ ...orderForm, client: response.data });
        } catch (err) {
            if (err.response && err.response.status === 404) {
                try {
                    const wsResult = await cnpjService.consultar(clientSearch.query);
                    const newClientData = { id: null, cnpj: wsResult.cnpj, razao_social: wsResult.razao_social, nome_fantasia: wsResult.nome_fantasia, phone: wsResult.telefone, email: wsResult.email, street: wsResult.logradouro, number: wsResult.numero, complement: wsResult.complemento, neighborhood: wsResult.bairro, city: wsResult.municipio, state: wsResult.uf, zip_code: wsResult.cep };
                    setOrderForm({ ...orderForm, client: newClientData });
                } catch (wsErr) {
                    setClientSearch({ ...clientSearch, loading: false, error: 'CNPJ não encontrado.' });
                }
            } else {
                setClientSearch({ ...clientSearch, loading: false, error: 'Erro ao buscar cliente.' });
            }
        } finally {
            setClientSearch(prev => ({...prev, loading: false}));
        }
    };
    
    const handleSaveOrder = async () => {
        let clientToUse = orderForm.client;
        if (!clientToUse) { alert("Nenhum cliente selecionado!"); return; }
        try {
            if (clientToUse && !clientToUse.id) {
                const newClientResponse = await api.post('/clients', clientToUse);
                clientToUse = newClientResponse.data;
            }
            const finalOrderData = { client_id: clientToUse.id, client_cnpj: clientToUse.cnpj, client_razao_social: (clientToUse.razao_social || clientToUse.nome), payment_method_id: orderForm.payment_method_id, discount_percentage: orderForm.discount_percentage, observations: orderForm.observations, items: orderForm.items };
            await ordersService.createOrder(finalOrderData);
            alert('Pedido criado com sucesso!');
            handleDialogClose();
            await loadData();
        } catch (err) {
            alert('Erro ao criar pedido: ' + (err.response?.data?.error || err.message));
        }
    };
    
    const handleDialogClose = () => {
        setTimeout(() => {
            setOrderForm({ client: null, payment_method_id: '', discount_percentage: 0, observations: '', items: [] });
            setClientSearch({ query: '', loading: false, error: '' });
            setCurrentStep(1);
        }, 300);
        setShowOrderDialog(false);
    };

    const addItemToOrder = () => setOrderForm(prev => ({ ...prev, items: [...prev.items, { code: '', description: '', quantity: {}, unit_value: 0, sizes: [] }] }));
    const removeItemFromOrder = (index) => setOrderForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    const updateOrderItem = (index, updatedItem) => setOrderForm(prev => ({ ...prev, items: prev.items.map((item, i) => i === index ? updatedItem : item) }));

    const orderSubtotal = orderForm.items.reduce((total, item) => {
        const itemQty = Object.values(item.quantity || {}).reduce((sum, qty) => sum + qty, 0);
        return total + (item.unit_value * itemQty);
    }, 0);
    const discountValue = orderSubtotal * (orderForm.discount_percentage / 100);
    const orderTotal = orderSubtotal - discountValue;

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto"> {/* Centraliza e define largura máxima */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Pedidos</h1>
                    <p className="text-muted-foreground">Gerencie seus pedidos online e offline</p>
                </div>
                <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setShowOrderDialog(true)}><Plus className="mr-2 h-4 w-4" /> Novo Pedido</Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl h-[90vh] flex flex-col p-0 mx-auto"> {/* Ajusta largura do diálogo */}
                        <DialogHeader className="p-6 pb-4 border-b">
                            <DialogTitle>Novo Pedido - Passo {currentStep} de 4</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                            {currentStep === 1 && (
                                <Card>
                                    <CardHeader><CardTitle>Passo 1: Selecionar Cliente</CardTitle><CardDescription>Busque pelo CNPJ para encontrar um cliente existente ou cadastrar um novo.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex space-x-2"><Input value={clientSearch.query} onChange={e => setClientSearch({ ...clientSearch, query: e.target.value })} placeholder="Digite o CNPJ..." /><Button type="button" size="icon" onClick={handleClientSearch} disabled={clientSearch.loading}>{clientSearch.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}</Button></div>
                                        {clientSearch.error && <p className="text-sm text-red-500">{clientSearch.error}</p>}
                                        {orderForm.client && (<Card className="mt-4 bg-muted/50"><CardHeader><CardTitle className="flex items-center text-lg">{orderForm.client.id ? <CheckCircle2 className="h-5 w-5 mr-2 text-green-600"/> : <Plus className="h-5 w-5 mr-2 text-blue-600"/>} Cliente {orderForm.client.id ? 'Encontrado' : 'a ser Criado'}</CardTitle></CardHeader><CardContent className="text-sm space-y-2"><div><strong>Razão Social:</strong> {orderForm.client.razao_social || orderForm.client.nome}</div><div><strong>Nome Fantasia:</strong> {orderForm.client.nome_fantasia || 'N/A'}</div><div><strong>CNPJ:</strong> {orderForm.client.cnpj}</div><div><strong>Email:</strong> {orderForm.client.email || 'N/A'}</div><div><strong>Telefone:</strong> {orderForm.client.phone || 'N/A'}</div><Separator/><p className="font-medium pt-2">Endereço Principal:</p><p className="text-muted-foreground">{orderForm.client.street}, {orderForm.client.number} - {orderForm.client.neighborhood}, {orderForm.client.city} - {orderForm.client.state}</p></CardContent></Card>)}
                                    </CardContent>
                                </Card>
                            )}
                            {currentStep === 2 && (
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Passo 2: Itens do Pedido</CardTitle>
                                            <CardDescription>Cliente: {orderForm.client.razao_social || orderForm.client.nome}</CardDescription>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addItemToOrder}>
                                            <Plus className="mr-2 h-4 w-4"/> Adicionar Item
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {orderForm.items.map((item, index) => (
                                            <OrderItemRow key={index} item={item} index={index} onUpdate={updateOrderItem} onRemove={removeItemFromOrder} />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                            {currentStep === 3 && (
                                <Card>
                                    <CardHeader><CardTitle>Passo 3: Pagamento e Observações</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Forma de Pagamento</Label>
                                            <Select onValueChange={value => setOrderForm(prev => ({...prev, payment_method_id: value}))}>
                                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                                <SelectContent>{paymentMethods.map(pm => <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Desconto (%)</Label>
                                            <Input type="number" placeholder="0" onChange={e => setOrderForm(prev => ({...prev, discount_percentage: parseFloat(e.target.value) || 0}))}/>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Observações</Label>
                                            <Input placeholder="Informações adicionais do pedido..." onChange={e => setOrderForm(prev => ({...prev, observations: e.target.value}))}/>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <Card>
                                        <CardHeader><CardTitle>Passo 4: Revisão e Confirmação</CardTitle></CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <p><strong>Cliente:</strong> {orderForm.client.razao_social || orderForm.client.nome}</p>
                                            <Separator/>
                                            <p><strong>Itens:</strong> {orderForm.items.length}</p>
                                            <p><strong>Subtotal:</strong> {formatCurrency(orderSubtotal)}</p>
                                            <p><strong>Desconto:</strong> {orderForm.discount_percentage}% ({formatCurrency(discountValue)})</p>
                                            <p className="font-bold text-base"><strong>Total do Pedido:</strong> {formatCurrency(orderTotal)}</p>
                                            <Separator/>
                                            <p><strong>Observações:</strong> {orderForm.observations || 'Nenhuma.'}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                        <div className="p-6 pt-4 border-t flex justify-between">
                            <Button type="button" variant="ghost" onClick={() => (currentStep === 1 ? handleDialogClose() : setCurrentStep(currentStep - 1))}>
                                {currentStep === 1 ? 'Cancelar' : 'Voltar'}
                            </Button>
                            {currentStep < 4 ? (
                                <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={(currentStep === 1 && !orderForm.client) || (currentStep === 2 && orderForm.items.length === 0)}>
                                    Avançar <ArrowRight className="h-4 w-4 ml-2"/>
                                </Button>
                            ) : (
                                <Button type="button" onClick={handleSaveOrder}>Salvar Pedido</Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Separator />
            
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 max-w-7xl mx-auto"> {/* Ajusta grid e centraliza */}
                <Card>
                    <CardHeader><CardTitle>Pedidos Sincronizados</CardTitle><CardDescription>Pedidos salvos no servidor</CardDescription></CardHeader>
                    <CardContent>
                        {orders.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/orders/${order.id}`)}>
                                            <TableCell className="font-mono">#{order.id}</TableCell>
                                            <TableCell>{order.client?.razao_social || 'N/A'}</TableCell>
                                            <TableCell>{formatDate(order.order_date)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(order.total_value)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (<div className="text-center text-sm text-muted-foreground py-8">Nenhum pedido sincronizado.</div>)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Pedidos Pendentes</CardTitle><CardDescription>Salvos localmente para sincronizar</CardDescription></CardHeader>
                    <CardContent>
                        {offlineOrders.length > 0 ? (
                            <div className="space-y-3">
                                {offlineOrders.map(order => (
                                    <div key={order.id || order.timestamp} className="p-3 border rounded-lg bg-yellow-50 flex justify-between items-center">
                                        <div><p className="font-medium">{order.client_razao_social}</p><p className="text-xs text-muted-foreground">Salvo em: {formatDate(order.timestamp)}</p></div>
                                        <Badge variant="outline">Pendente</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (<div className="text-center text-sm text-muted-foreground py-8">Nenhum pedido pendente.</div>)}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrdersPage;