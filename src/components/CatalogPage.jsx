// Local do arquivo: src/components/CatalogPage.jsx

import { useState, useEffect, useRef } from 'react';
import { api, catalogService } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Loader2, BookOpen, Upload, CheckCircle2, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx'; // Biblioteca para ler arquivos de planilha

// --- COMPONENTE INTERNO: Formulário de Produto (sem alterações) ---
const ProductForm = ({ product, onSave, closeDialog }) => {
  const [formData, setFormData] = useState({ code: '', description: '', value: '', sizes: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        description: product.description,
        value: product.value.toString(),
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : ''
      });
    } else {
      setFormData({ code: '', description: '', value: '', sizes: '' });
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const productData = {
      ...formData,
      value: parseFloat(formData.value),
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean)
    };
    await onSave(productData);
    setIsSaving(false);
    closeDialog();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <Label htmlFor="code">Código do Produto</Label>
            <Input id="code" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required disabled={!!product || isSaving} />
            {!!product && <p className="text-xs text-muted-foreground mt-1">O código não pode ser alterado após a criação.</p>}
        </div>
        <div>
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required disabled={isSaving} />
        </div>
        <div>
            <Label htmlFor="value">Valor (R$)</Label>
            <Input id="value" type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} required disabled={isSaving} />
        </div>
        <div>
            <Label htmlFor="sizes">Tamanhos</Label>
            <Input id="sizes" value={formData.sizes} onChange={(e) => setFormData({...formData, sizes: e.target.value})} placeholder="P, M, G, GG" disabled={isSaving} />
            <p className="text-xs text-muted-foreground mt-1">Separe os tamanhos por vírgula.</p>
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
        </DialogFooter>
    </form>
  );
};


// --- PÁGINA PRINCIPAL DO CATÁLOGO (COM A NOVA FUNCIONALIDADE) ---
const CatalogPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await catalogService.getProducts();
            setProducts(data);
        } catch (err) {
            setError('Erro ao carregar produtos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);
    
    const handleSaveProduct = async (productData) => {
        try {
            if (selectedProduct) {
                await catalogService.updateProduct(selectedProduct.id, productData);
            } else {
                await catalogService.createProduct(productData);
            }
            loadProducts();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao salvar produto.');
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            await catalogService.deleteProduct(productId);
            loadProducts();
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao excluir produto.');
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);
        setError('');

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const productsToImport = jsonData.map(row => ({
                    code: row['Código'] || row['code'],
                    description: row['Descrição'] || row['description'],
                    value: parseFloat(row['Valor'] || row['value']),
                    sizes: typeof row['Tamanhos'] === 'string' ? row['Tamanhos'].split(',').map(s => s.trim()) : []
                }));

                const response = await api.post('/catalog/import', productsToImport);
                setImportResult(response.data);
                await loadProducts();

            } catch (err) {
                const errorMessage = err.response?.data?.error || 'Erro ao processar a planilha.';
                setError(errorMessage);
            } finally {
                setIsImporting(false);
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (loading && !isImporting) return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Catálogo de Produtos</h1>
                <div className="flex space-x-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current.click()} disabled={isImporting}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                        Importar Planilha
                    </Button>
                    
                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setSelectedProduct(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Produto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader><DialogTitle>{selectedProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
                            <ProductForm product={selectedProduct} onSave={handleSaveProduct} closeDialog={() => setShowDialog(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {importResult && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 !text-green-700" />
                    <AlertTitle className="text-green-800">Importação Concluída!</AlertTitle>
                    <AlertDescription className="text-green-700">
                        {importResult.created} produtos criados, {importResult.updated} atualizados, e {importResult.deactivated} desativados.
                    </AlertDescription>
                </Alert>
            )}
            {error && (
                <Alert variant="destructive">
                     <XCircle className="h-4 w-4" />
                    <AlertTitle>Erro na Importação</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardContent className="pt-6">
                    {products.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Tamanhos</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.code}</TableCell>
                                        <TableCell>{product.description}</TableCell>
                                        <TableCell>{formatCurrency(product.value)}</TableCell>
                                        <TableCell>{product.sizes.join(', ')}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(product); setShowDialog(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o produto.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                            <p className="text-sm text-muted-foreground">Clique em "Novo Produto" para começar.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default CatalogPage;
