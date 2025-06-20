// Local do arquivo: src/components/ClientsPage.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, cnpjService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Loader2, Users, Search } from 'lucide-react';

// --- Componente do Formulário de Cliente (com a nova lógica) ---
const ClientForm = ({ onSave, closeDialog }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // O estado principal agora inclui todos os campos do cliente e do endereço
  const [formData, setFormData] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    email: '',
    phone: '',
    // Campos do endereço
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [isFormEnabled, setIsFormEnabled] = useState(false);

    // LOG DE DEPURAÇÃO 1: Mostra o estado atual toda vez que o componente renderiza
  console.log('--- Componente ClientForm Renderizou ---');
  console.log('Formulário Habilitado?', isFormEnabled);
  console.log('Dados Atuais:', formData);
  console.log('------------------------------------');

const handleCnpjSearch = async () => {
    if (!formData.cnpj) return;
    setIsSearching(true);
    setApiError('');
    setIsFormEnabled(false);
    
    try {
      const apiResult = await cnpjService.consultar(formData.cnpj); // Renomeado para evitar conflitos
      
      console.log('DADOS BRUTOS DA API:', apiResult);

      // --- INÍCIO DA CORREÇÃO FINAL ---

      // 1. Criamos um objeto de dados limpo, mapeando campo por campo.
      // Isso evita qualquer problema de referência ou de nomes.
      const newClientData = {
        cnpj: formData.cnpj, // Mantém o CNPJ que o usuário digitou
        razao_social: apiResult.razao_social || '',
        nome_fantasia: apiResult.nome_fantasia || '',
        email: apiResult.email || '',
        phone: apiResult.telefone || '',
        street: apiResult.logradouro || '',
        number: apiResult.numero || '',
        complement: apiResult.complemento || '',
        neighborhood: apiResult.bairro || '',
        city: apiResult.municipio || '',
        state: apiResult.uf || '',
        zip_code: apiResult.cep || '',
      };

      // 2. Logamos o objeto que estamos prestes a salvar no estado
      console.log('OBJETO QUE SERÁ SALVO NO ESTADO:', newClientData);
      
      // 3. Atualizamos o estado com o novo objeto
      setFormData(newClientData);

      setIsFormEnabled(true);
    } catch (err) {
      setApiError(err.response?.data?.error || 'CNPJ não encontrado ou inválido.');
      setIsFormEnabled(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData); // Envia o objeto completo para o backend
    setIsSaving(false);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Etapa de Consulta de CNPJ */}
      <div className="space-y-2">
        <Label htmlFor="cnpj-search">CNPJ do Cliente *</Label>
        <div className="flex space-x-2">
          <Input
            id="cnpj-search" value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            placeholder="Digite o CNPJ para buscar" disabled={isSearching || isSaving}
          />
          <Button type="button" onClick={handleCnpjSearch} disabled={isSearching || isSaving || !formData.cnpj} size="icon">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        {apiError && <p className="text-sm text-red-500 mt-2">{apiError}</p>}
      </div>

      <Separator />

      {/* Campos de dados do cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="razao_social">Razão Social *</Label>
          <Input id="razao_social" value={formData.razao_social} onChange={(e) => setFormData({...formData, razao_social: e.target.value})} required disabled={!isFormEnabled || isSaving} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
          <Input id="nome_fantasia" value={formData.nome_fantasia} onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})} disabled={!isFormEnabled || isSaving} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email de Contato</Label>
          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={!isFormEnabled || isSaving} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone de Contato</Label>
          <Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} disabled={!isFormEnabled || isSaving} />
        </div>
      </div>

      <Separator />
      <Label className="font-semibold">Endereço Principal</Label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="street">Logradouro</Label>
            <Input id="street" value={formData.street} onChange={(e) => setFormData({...formData, street: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number">Número</Label>
            <Input id="number" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento</Label>
            <Input id="complement" value={formData.complement} onChange={(e) => setFormData({...formData, complement: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" value={formData.neighborhood} onChange={(e) => setFormData({...formData, neighborhood: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip_code">CEP</Label>
            <Input id="zip_code" value={formData.zip_code} onChange={(e) => setFormData({...formData, zip_code: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
      </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">Estado (UF)</Label>
            <Input id="state" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} disabled={!isFormEnabled || isSaving} />
          </div>
      </div>
          
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
        <Button type="submit" disabled={!isFormEnabled || isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Cliente'}
        </Button>
      </DialogFooter>
    </form>
  );
};


// --- Componente Principal da Página de Clientes ---
const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const navigate = useNavigate();

  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (err) {
      setError('Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSaveClient = async (clientData) => {
    setError(''); // Limpa erros antigos
    try {
      const response = await api.post('/clients', clientData);
      // Após criar, navega para a página de detalhes do novo cliente
      navigate(`/clients/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar cliente.');
      // Lança o erro para que o formulário saiba que falhou
      throw err;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <ClientForm onSave={handleSaveClient} closeDialog={() => setShowDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Card>
        <CardContent className="pt-6">
          {clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/clients/${client.id}`)}>
                    <TableCell className="font-medium">{client.razao_social}</TableCell>
                    <TableCell>{client.cnpj}</TableCell>
                    <TableCell>{client.email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Cliente" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;