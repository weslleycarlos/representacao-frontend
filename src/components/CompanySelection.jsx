import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Importe useNavigate

const CompanySelection = () => {
  const { user, selectCompany, loadingCompanies, companies, error: authError } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Inicialize useNavigate

  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSelectCompany = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await selectCompany(selectedCompanyId);
      navigate('/'); // Redireciona para a página inicial após a seleção da empresa
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao selecionar empresa.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCompanies) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Selecionar Empresa</CardTitle>
          <CardDescription className="text-center">
            Selecione a empresa que deseja gerenciar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSelectCompany} className="space-y-4">
            <div>
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading || !selectedCompanyId}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySelection;
