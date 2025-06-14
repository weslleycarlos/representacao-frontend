import { useState, useEffect } from 'react';
import { ordersService, catalogService } from '../lib/api';
import { saveOfflineOrder, getOfflineOrders, removeOfflineOrder } from '../lib/offline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  RefreshCw, 
  ShoppingCart, 
  Loader2, 
  WifiOff,
  Trash2,
  Edit
} from 'lucide-react';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [offlineOrders, setOfflineOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOrderDialog, setShowOrderDialog] = useState(false);

  // Estado do formulário de pedido
  const [orderForm, setOrderForm] = useState({
    client_cnpj: '',
    client_razao_social: '',
    client_nome_fantasia: '',
    payment_method_id: '',
    discount_percentage: 0,
    items: []
  });

  useEffect(() => {
    loadData();

    // Monitora status de conexão
    const handleOnline = () => {
      setIsOnline(true);
      loadOnlineData();
    };
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
      await Promise.all([
        loadOnlineData(),
        loadOfflineData(),
        loadProducts(),
        loadPaymentMethods()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineData = async () => {
    if (!navigator.onLine) return;
    
    try {
      const ordersData = await ordersService.getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos online:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const offlineOrdersData = await getOfflineOrders();
      setOfflineOrders(offlineOrdersData);
    } catch (error) {
      console.error('Erro ao carregar pedidos offline:', error);
    }
  };

  const loadProducts = async () => {
    if (!navigator.onLine) return;
    
    try {
      const productsData = await catalogService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadPaymentMethods = async () => {
    if (!navigator.onLine) return;
    
    try {
      const paymentMethodsData = await catalogService.getPaymentMethods();
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };

  const handleSyncOrders = async () => {
    if (!isOnline || offlineOrders.length === 0) return;

    setSyncing(true);
    setError('');
    setSuccess('');

    try {
      // Prepara os pedidos para sincronização
      const ordersToSync = offlineOrders.map(order => ({
        client_cnpj: order.client_cnpj,
        client_razao_social: order.client_razao_social,
        client_nome_fantasia: order.client_nome_fantasia,
        payment_method_id: order.payment_method_id,
        discount_percentage: order.discount_percentage,
        items: order.items
      }));

      const result = await ordersService.syncOrders(ordersToSync);

      // Remove pedidos sincronizados com sucesso do armazenamento local
      for (let i = 0; i < result.synced_count; i++) {
        if (offlineOrders[i]) {
          await removeOfflineOrder(offlineOrders[i].id);
        }
      }

      setSuccess(`${result.synced_count} pedidos sincronizados com sucesso!`);
      
      if (result.failed_count > 0) {
        setError(`${result.failed_count} pedidos falharam na sincronização.`);
      }

      // Recarrega os dados
      await loadData();

    } catch (error) {
      setError('Erro ao sincronizar pedidos: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!orderForm.client_cnpj || !orderForm.client_razao_social) {
      setError('CNPJ e Razão Social são obrigatórios');
      return;
    }

    if (!orderForm.items || orderForm.items.length === 0) {
      setError('Pelo menos um item é obrigatório');
      return;
    }

    // Verifica se há pelo menos um item com quantidade > 0
    const hasValidItem = orderForm.items.some(item => 
      item.quantity && Object.values(item.quantity).some(qty => qty > 0)
    );

    if (!hasValidItem) {
      setError('Pelo menos um item deve ter quantidade maior que zero');
      return;
    }

    try {
      if (isOnline) {
        // Cria pedido online
        await ordersService.createOrder(orderForm);
        setSuccess('Pedido criado com sucesso!');
        await loadOnlineData();
      } else {
        // Salva pedido offline
        await saveOfflineOrder(orderForm);
        setSuccess('Pedido salvo localmente. Sincronize quando estiver online.');
        await loadOfflineData();
      }

      // Limpa o formulário
      setOrderForm({
        client_cnpj: '',
        client_razao_social: '',
        client_nome_fantasia: '',
        payment_method_id: '',
        discount_percentage: 0,
        items: []
      });
      setShowOrderDialog(false);

    } catch (error) {
      setError('Erro ao criar pedido: ' + (error.response?.data?.error || error.message));
    }
  };

  const addItemToOrder = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, {
        code: '',
        description: '',
        quantity: {},
        unit_value: 0
      }]
    }));
  };

  const removeItemFromOrder = (index) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie seus pedidos online e offline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {!isOnline && (
            <Badge variant="destructive" className="flex items-center">
              <WifiOff className="h-4 w-4 mr-1" />
              Offline
            </Badge>
          )}
          
          {offlineOrders.length > 0 && (
            <Button
              onClick={handleSyncOrders}
              disabled={!isOnline || syncing}
              variant="outline"
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sync className="mr-2 h-4 w-4" />
              )}
              Sincronizar ({offlineOrders.length})
            </Button>
          )}

          <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Pedido</DialogTitle>
                <DialogDescription>
                  Preencha os dados do pedido. {!isOnline && 'O pedido será salvo localmente.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                {/* Dados do Cliente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_cnpj">CNPJ do Cliente</Label>
                    <Input
                      id="client_cnpj"
                      value={orderForm.client_cnpj}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, client_cnpj: e.target.value }))}
                      placeholder="00.000.000/0000-00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_razao_social">Razão Social</Label>
                    <Input
                      id="client_razao_social"
                      value={orderForm.client_razao_social}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, client_razao_social: e.target.value }))}
                      placeholder="Razão Social da Empresa"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="client_nome_fantasia"
                      value={orderForm.client_nome_fantasia}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, client_nome_fantasia: e.target.value }))}
                      placeholder="Nome Fantasia (opcional)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select
                      value={orderForm.payment_method_id}
                      onValueChange={(value) => setOrderForm(prev => ({ ...prev, payment_method_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id.toString()}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={orderForm.discount_percentage}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, discount_percentage: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>

                {/* Itens do Pedido */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label>Itens do Pedido</Label>
                    <Button type="button" onClick={addItemToOrder} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Item
                    </Button>
                  </div>

                  {orderForm.items.map((item, index) => (
                    <Card key={index} className="mb-4">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div>
                            <Label>Código</Label>
                            <Input
                              value={item.code}
                              onChange={(e) => updateOrderItem(index, 'code', e.target.value)}
                              placeholder="Código do produto"
                            />
                          </div>
                          <div>
                            <Label>Descrição</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateOrderItem(index, 'description', e.target.value)}
                              placeholder="Descrição do produto"
                            />
                          </div>
                          <div>
                            <Label>Valor Unitário</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_value}
                              onChange={(e) => updateOrderItem(index, 'unit_value', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItemFromOrder(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label>Quantidades por Tamanho</Label>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {['P', 'M', 'G', 'GG'].map((size) => (
                              <div key={size}>
                                <Label className="text-xs">{size}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.quantity[size] || ''}
                                  onChange={(e) => updateOrderItem(index, 'quantity', {
                                    ...item.quantity,
                                    [size]: parseInt(e.target.value) || 0
                                  })}
                                  placeholder="0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowOrderDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isOnline ? 'Criar Pedido' : 'Salvar Offline'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Lista de Pedidos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pedidos Online */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Sincronizados</CardTitle>
            <CardDescription>
              Pedidos salvos no servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">#{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.client?.razao_social}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_value)}</p>
                        <Badge variant={order.status === 'Concluído' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.order_date)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido sincronizado
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pedidos Offline */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Pendentes</CardTitle>
            <CardDescription>
              Pedidos salvos localmente aguardando sincronização
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offlineOrders.length > 0 ? (
              <div className="space-y-4">
                {offlineOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">Pedido Local #{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.client_razao_social}
                        </p>
                      </div>
                      <Badge variant="outline">
                        Pendente
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido pendente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersPage;

