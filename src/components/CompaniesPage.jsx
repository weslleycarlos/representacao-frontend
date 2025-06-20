// Crie este novo arquivo: src/components/CompaniesPage.jsx

import { useState, useEffect } from 'react';
import { api } from '../lib/api'; // Usaremos a api diretamente aqui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Loader2, Building2 } from 'lucide-react';

// Formulário de Empresa
// Em src/components/CompaniesPage.jsx

// --- SUBSTITUA O CompanyForm ANTIGO POR ESTA NOVA VERSÃO ---
const CompanyForm = ({ company, onSave, closeDialog }) => {
  // O estado agora inclui todos os novos campos
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    state_registration: '',
    contact_email: '',
    contact_phone: '',
    website: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Se estamos editando uma empresa, preenchemos o formulário com todos os dados
    if (company) {
      setFormData({
        name: company.name || '',
        cnpj: company.cnpj || '',
        state_registration: company.state_registration || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        website: company.website || ''
      });
    } else {
      // Se for uma nova empresa, o formulário começa em branco
      setFormData({ name: '', cnpj: '', state_registration: '', contact_email: '', contact_phone: '', website: '' });
    }
  }, [company]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Label htmlFor="name">Nome da Empresa</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required disabled={isSaving} />
      </div>
      <div className="col-span-2">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} required disabled={isSaving} />
      </div>
       <div className="col-span-2">
        <Label htmlFor="state_registration">Inscrição Estadual</Label>
        <Input id="state_registration" value={formData.state_registration} onChange={(e) => setFormData({...formData, state_registration: e.target.value})} disabled={isSaving} />
      </div>
       <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="contact_email">Email de Contato</Label>
        <Input id="contact_email" type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} disabled={isSaving} />
      </div>
       <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="contact_phone">Telefone de Contato</Label>
        <Input id="contact_phone" value={formData.contact_phone} onChange={(e) => setFormData({...formData, contact_phone: e.target.value})} disabled={isSaving} />
      </div>
       <div className="col-span-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" placeholder="https://..." value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} disabled={isSaving} />
      </div>

      <DialogFooter className="col-span-2">
        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Página Principal
const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (err) {
      setError('Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSaveCompany = async (companyData) => {
    try {
      if (selectedCompany) {
        await api.put(`/companies/${selectedCompany.id}`, companyData);
      } else {
        await api.post('/companies', companyData);
      }
      loadCompanies();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar empresa.');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    try {
      await api.delete(`/companies/${companyId}`);
      loadCompanies();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir empresa.');
    }
  };

  if (loading) return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciamento de Empresas</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCompany(null)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
            </DialogHeader>
            <CompanyForm
              company={selectedCompany}
              onSave={handleSaveCompany}
              closeDialog={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Card>
        <CardContent className="pt-6">
          {companies.length > 0 ? (
            <Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>CNPJ</TableHead>
      <TableHead>Contato</TableHead> {/* <-- Nova Coluna */}
      <TableHead className="text-right">Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {companies.map((company) => (
      <TableRow key={company.id}>
        <TableCell className="font-medium">{company.name}</TableCell>
        <TableCell>{company.cnpj}</TableCell>
        <TableCell>{company.contact_email || company.contact_phone || '-'}</TableCell> {/* <-- Novo Dado */}
        <TableCell className="text-right space-x-2">
          {/* ... botões de editar e excluir ... */}
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCompany(company); setShowDialog(true); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            {/* ... */}
          </AlertDialog>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
          ) : (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma empresa encontrada.</p>
              <p className="text-sm text-muted-foreground">Clique em "Nova Empresa" para começar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesPage;