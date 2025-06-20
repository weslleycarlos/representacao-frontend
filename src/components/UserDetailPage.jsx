// Crie este novo arquivo: src/components/UserDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';

const UserDetailPage = () => {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [allCompanies, setAllCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [userData, companiesData] = await Promise.all([
                api.get(`/users/${userId}`),
                api.get('/companies')
            ]);
            setUser(userData.data);
            setAllCompanies(companiesData.data);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleAssociateCompany = async () => {
        if (!selectedCompanyId) return;
        try {
            await api.post(`/users/${userId}/companies`, { company_id: selectedCompanyId });
            loadData(); // Recarrega os dados para mostrar a nova associação
        } catch (error) {
            alert('Erro ao associar empresa.');
        }
    };

    const handleDisassociateCompany = async (companyId) => {
        if (!window.confirm("Tem certeza que deseja remover o acesso deste usuário a esta empresa?")) return;
        try {
            await api.delete(`/users/${userId}/companies/${companyId}`);
            loadData();
        } catch (error) {
             alert('Erro ao remover associação.');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!user) return <p className="text-center">Usuário não encontrado.</p>;

    const availableCompanies = allCompanies.filter(comp => 
        !user.companies.some(userComp => userComp.id === comp.id)
    );

    return (
        <div className="space-y-6">
            <Link to="/users" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para todos os usuários
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>{user.full_name || user.email}</CardTitle>
                    {/* Aqui entraria um formulário para editar os dados do usuário */}
                </CardHeader>
            </Card>

            <Card>
                <CardHeader><CardTitle>Empresas Associadas</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {user.companies.map(company => (
                            <div key={company.id} className="flex items-center justify-between p-2 border rounded">
                                <span>{company.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => handleDisassociateCompany(company.id)}>
                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                </Button>
                            </div>
                        ))}
                        {user.companies.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma empresa associada.</p>}
                    </div>
                    
                    <Separator className="my-6" />

                    <div className="space-y-2">
                        <h3 className="font-semibold">Associar Nova Empresa</h3>
                        <div className="flex space-x-2">
                             <Select onValueChange={setSelectedCompanyId}>
                                <SelectTrigger><SelectValue placeholder="Selecione uma empresa..." /></SelectTrigger>
                                <SelectContent>
                                    {availableCompanies.map(comp => (
                                        <SelectItem key={comp.id} value={comp.id.toString()}>{comp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleAssociateCompany} disabled={!selectedCompanyId}>Associar</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UserDetailPage;