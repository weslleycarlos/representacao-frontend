import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; // Importe Link e useLocation

const Layout = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation(); // Inicialize useLocation

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link to="/" className={`flex items-center gap-2 text-lg font-semibold md:text-base ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link to="/orders" className={`flex items-center gap-2 text-lg font-semibold md:text-base ${location.pathname === '/orders' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <ShoppingCart className="h-5 w-5" />
            Pedidos
          </Link>
          {/* Adicione outros links de navegação aqui */}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link to="/" className={`flex items-center gap-2 text-lg font-semibold ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>
              <Link to="/orders" className={`flex items-center gap-2 text-lg font-semibold ${location.pathname === '/orders' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                <ShoppingCart className="h-5 w-5" />
                Pedidos
              </Link>
              {/* Adicione outros links de navegação aqui */}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial"></div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
