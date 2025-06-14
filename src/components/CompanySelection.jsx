import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2 } from 'lucide-react';

const CompanySelection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { companies, selectCompany } = useAuth();

  const handleSelectCompany = async (companyId) => {
    setLoading(true);
    setError('');

    try {
      await selectCompany(companyId);
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao selecionar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Selecionar Empresa
          </CardTitle>
          <CardDescription className="text-center">
            Escolha a empresa para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {companies.map((company) => (
              <Button
                key={company.id}
                variant="outline"
                className="w-full h-auto p-4 justify-start"
                onClick={() => handleSelectCompany(company.id)}
                disabled={loading}
              >
                <Building2 className="mr-3 h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{company.name}</div>
                  <div className="text-sm text-muted-foreground">{company.cnpj}</div>
                </div>
                {loading && <Loader2 className="ml-auto h-4 w-4 animate-spin" />}
              </Button>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma empresa encontrada. Entre em contato com o administrador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySelection;

