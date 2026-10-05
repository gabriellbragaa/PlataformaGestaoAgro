import React, { useState } from 'react';

import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Handshake,
  Sprout,
  Beef,
  BriefcaseBusiness,
  Building,
  UserRound
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Produtores from './pages/Produtores';
import Produtos from './pages/Produtos'; // <-- ADICIONE
import Agricultores from './pages/Agricultores';
import Pecuaristas from './pages/Pecuaristas';
import Empresas from './pages/Empresas';
import Cooperativas from './pages/Cooperativas';
import Funcionarios from './pages/Funcionarios';
import Clientes from './pages/Clientes';
import Recursos from './pages/Recursos';
import Parcerias from './pages/Parcerias';

import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;

      case 'produtores':
        return <Produtores />;

      case 'produtos':
        return <Produtos />;

      case 'agricultores':
        return <Agricultores />;

      case 'pecuaristas':
        return <Pecuaristas />;

      case 'empresas':
        return <Empresas />;

      case 'cooperativas':
        return <Cooperativas />;

      case 'funcionarios':
        return <Funcionarios />;

      case 'clientes':
        return <Clientes />;

      case 'recursos':
        return <Recursos />;

      case 'parcerias':
        return <Parcerias />;

      default:
        return <Dashboard />;
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'produtores',
      label: 'Produtores',
      icon: Users
    },
    {
      id: 'produtos',
      label: 'Produtos',
      icon: Package
    },
    {
      id: 'agricultores',
      label: 'Agricultores',
      icon: Sprout
    },
    {
      id: 'pecuaristas',
      label: 'Pecuaristas',
      icon: Beef
    },
    {
      id: 'empresas',
      label: 'Empresas',
      icon: Building2
    },
    {
      id: 'cooperativas',
      label: 'Cooperativas',
      icon: Building
    },
    {
      id: 'funcionarios',
      label: 'Funcionários',
      icon: BriefcaseBusiness
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: UserRound
    },
    {
      id: 'recursos',
      label: 'Recursos',
      icon: Package
    },
    {
      id: 'parcerias',
      label: 'Parcerias',
      icon: Handshake
    }
  ];

  return (
    <div className="app-container">

      <aside className="sidebar">

        <div className="sidebar-brand">
          <Sprout size={28} />
          <span>Agro linker Brasil</span>
        </div>

        <nav className="sidebar-nav">

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''
                  }`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </div>
            );
          })}

        </nav>

      </aside>

      <main className="main-content">
        {renderContent()}
      </main>

    </div>
  );
}

export default App;