import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, cnpjService } from '../lib/api';
import { getOfflineOrders } from '../lib/offline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Loader2,
  Building2,
  WifiOff
} from 'lucide-react';

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [offlineOrdersCount, setOfflineOrdersCount] = useState(0);
  const [cnpjQuery, setCnpjQuery] = useState('');
  const [cnpjResult, setCnpjResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { company } = useAuth();

  useEffect(() => {
    loadDashboardData();
    loadOfflineOrdersCount();

    // Monitora status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      if (navigator.onLine) {
        const data = await dashboardService.getMetrics();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineOrdersCount = async () => {
    try {
      const offlineOrders = await getOfflineOrders();
      setOfflineOrdersCount(offlineOrders.length);
    } catch (error) {
      console.error('Erro ao carregar pedidos offline:', error);
    }
  };

  const handleCnpjSearch = async (e) => {
    e.preventDefault();
    if (!cnpjQuery.trim() || !isOnline) return;

    setCnpjLoading(true);
    setCnpjResult(null);
    setError('');

    try {
      const result = await cnpjService.consultar(cnpjQuery);
      setCnpjResult(result);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao consultar CNPJ');
    } finally {
      setCnpjLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatVariation = (variation) => {
    const isPositive = variation >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{variation.toFixed(1)}%
        </span>
      </div>
    );
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao sistema de representação comercial
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {company && (
            <Badge variant="outline" className="flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              {company.name}
            </Badge>
          )}
          {!isOnline && (
            <Badge variant="destructive" className="flex items-center">
              <WifiOff className="h-4 w-4 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.orders_today?.count || 0}
            </div>
            {metrics?.orders_today?.variation !== undefined && (
              <div className="mt-1">
                {formatVariation(metrics.orders_today.variation)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineOrdersCount}</div>
            <p className="text-xs text-muted-foreground">
              Salvos localmente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total (30 dias)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.total_value_30_days?.value 
                ? formatCurrency(metrics.total_value_30_days.value)
                : 'R$ 0,00'
              }
            </div>
            {metrics?.total_value_30_days?.variation !== undefined && (
              <div className="mt-1">
                {formatVariation(metrics.total_value_30_days.variation)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOnline ? 'Conectado à internet' : 'Modo offline ativo'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Consulta CNPJ */}
        <Card>
          <CardHeader>
            <CardTitle>Consultar CNPJ</CardTitle>
            <CardDescription>
              {isOnline 
                ? 'Digite o CNPJ para consultar os dados da empresa'
                : 'Consulta indisponível offline'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCnpjSearch} className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="00.000.000/0000-00"
                  value={cnpjQuery}
                  onChange={(e) => setCnpjQuery(e.target.value)}
                  disabled={cnpjLoading || !isOnline}
                />
                <Button 
                  type="submit" 
                  disabled={cnpjLoading || !isOnline}
                  size="icon"
                >
                  {cnpjLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {cnpjResult && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">CNPJ:</span> {cnpjResult.cnpj}
                      </div>
                      <div>
                        <span className="font-medium">Razão Social:</span> {cnpjResult.razao_social}
                      </div>
                      {cnpjResult.nome_fantasia && (
                        <div>
                          <span className="font-medium">Nome Fantasia:</span> {cnpjResult.nome_fantasia}
                        </div>
                      )}
                      {cnpjResult.situacao && (
                        <div>
                          <span className="font-medium">Situação:</span> {cnpjResult.situacao}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Últimos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pedidos</CardTitle>
            <CardDescription>
              Os 5 pedidos mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics?.latest_orders && metrics.latest_orders.length > 0 ? (
              <div className="space-y-3">
                {metrics.latest_orders.map((order, index) => (
                  <div key={order.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">#{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.client?.razao_social || 'Cliente não informado'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(order.total_value)}</p>
                        <Badge variant={order.status === 'Concluído' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                    {index < metrics.latest_orders.length - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum pedido encontrado
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

