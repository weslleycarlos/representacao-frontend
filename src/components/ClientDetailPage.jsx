// Local do arquivo: src/components/ClientDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Edit, Plus, Trash2, Loader2, Home, User } from 'lucide-react';

// --- NOVO FORMULÁRIO DE ENDEREÇO ---
const AddressForm = ({ clientId, address, onSave, closeDialog }) => {
    const [formData, setFormData] = useState({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip_code: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (address) setFormData(address);
    }, [address]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label htmlFor="street">Logradouro</Label><Input id="street" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
            <div><Label htmlFor="number">Número</Label><Input id="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} /></div>
            <div><Label htmlFor="complement">Complemento</Label><Input id="complement" value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} /></div>
            <div><Label htmlFor="neighborhood">Bairro</Label><Input id="neighborhood" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
            <div><Label htmlFor="city">Cidade</Label><Input id="city" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            <div><Label htmlFor="state">UF</Label><Input id="state" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /></div>
            <div><Label htmlFor="zip_code">CEP</Label><Input id="zip_code" value={formData.zip_code} onChange={e => setFormData({...formData, zip_code: e.target.value})} /></div>
            <DialogFooter className="col-span-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
            </DialogFooter>
        </form>
    );
};

// --- NOVO FORMULÁRIO DE CONTATO ---
const ContactForm = ({ clientId, contact, onSave, closeDialog }) => {
    const [formData, setFormData] = useState({ name: '', role: '', email: '', phone: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (contact) setFormData(contact);
    }, [contact]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formData);
        setIsSaving(false);
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="name">Nome</Label><Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><Label htmlFor="role">Cargo</Label><Input id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div><Label htmlFor="phone">Telefone</Label><Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <DialogFooter className="col-span-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
            </DialogFooter>
        </form>
    );
};

const ClientDetailPage = () => {
    const { clientId } = useParams();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddressDialog, setShowAddressDialog] = useState(false);
    const [showContactDialog, setShowContactDialog] = useState(false);

    const loadClientData = async () => {
        try {
            const response = await api.get(`/clients/${clientId}`);
            setClient(response.data);
        } catch (err) {
            setError('Erro ao carregar dados do cliente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) loadClientData();
    }, [clientId]);
    
    const handleSaveAddress = async (addressData) => {
        await api.post(`/clients/${clientId}/addresses`, addressData);
        loadClientData();
    };

    const handleSaveContact = async (contactData) => {
        await api.post(`/clients/${clientId}/contacts`, contactData);
        loadClientData();
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!client) return <p>Cliente não encontrado.</p>;

    return (
        <div className="space-y-6">
            <Link to="/clients" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para todos os clientes
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{client.razao_social}</CardTitle>
                    <CardDescription>{client.cnpj}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p><strong>Email:</strong> {client.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {client.phone || 'Não informado'}</p>
                </CardContent>
            </Card>

            <Tabs defaultValue="addresses">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="addresses">Endereços</TabsTrigger>
                    <TabsTrigger value="contacts">Contatos</TabsTrigger>
                </TabsList>
                <TabsContent value="addresses">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Endereços Cadastrados</CardTitle>
                             <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
                                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo</Button></DialogTrigger>
                                <DialogContent><DialogHeader><DialogTitle>Novo Endereço</DialogTitle></DialogHeader><AddressForm clientId={clientId} onSave={handleSaveAddress} closeDialog={() => setShowAddressDialog(false)} /></DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             {client.addresses.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Logradouro</TableHead><TableHead>Cidade/UF</TableHead></TableRow></TableHeader>
                                    <TableBody>{client.addresses.map(addr => (<TableRow key={addr.id}><TableCell>{addr.type}</TableCell><TableCell>{addr.street}, {addr.number}</TableCell><TableCell>{addr.city}/{addr.state}</TableCell></TableRow>))}</TableBody>
                                </Table>
                             ) : <p className="text-sm text-muted-foreground text-center p-4">Nenhum endereço cadastrado.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="contacts">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Contatos</CardTitle>
                             <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                                <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo</Button></DialogTrigger>
                                <DialogContent><DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader><ContactForm clientId={clientId} onSave={handleSaveContact} closeDialog={() => setShowContactDialog(false)}/></DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                             {client.contacts.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead></TableRow></TableHeader>
                                    <TableBody>{client.contacts.map(contact => (<TableRow key={contact.id}><TableCell>{contact.name}</TableCell><TableCell>{contact.role}</TableCell><TableCell>{contact.email}</TableCell><TableCell>{contact.phone}</TableCell></TableRow>))}</TableBody>
                                </Table>
                             ) : <p className="text-sm text-muted-foreground text-center p-4">Nenhum contato cadastrado.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ClientDetailPage;