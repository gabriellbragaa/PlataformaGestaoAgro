
import React, { useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  Users,
  Sprout,
  Beef,
  Building2,
  UserRound,
  BriefcaseBusiness,
  Package,
  Handshake,
  Warehouse,
  ShoppingBasket,
  Search,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Menu,
  X,
  Leaf,
  ChevronRight,
} from "lucide-react";

import Home from "./pages/Home";
import Acesso from "./pages/Acesso";
import Dashboard from "./pages/Dashboard";
import Produtores from "./pages/Produtores";
import Produtos from "./pages/Produtos";
import Agricultores from "./pages/Agricultores";
import Pecuaristas from "./pages/Pecuaristas";
import Empresas from "./pages/Empresas";
import Cooperativas from "./pages/Cooperativas";
import Funcionarios from "./pages/Funcionarios";
import Clientes from "./pages/Clientes";
import Recursos from "./pages/Recursos";
import Parcerias from "./pages/Parcerias";

import "./App.css";

const pages = [
  {
    id: "dashboard",
    name: "Dashboard",
    desc: "Indicadores e visão geral da operação.",
    icon: LayoutDashboard,
  },
  {
    id: "produtores",
    name: "Produtores",
    desc: "Cadastro e organização dos produtores rurais.",
    icon: Users,
  },
  {
    id: "agricultores",
    name: "Agricultores",
    desc: "Gestão de agricultores e atividades agrícolas.",
    icon: Sprout,
  },
  {
    id: "pecuaristas",
    name: "Pecuaristas",
    desc: "Informações e cadastro de criadores e rebanhos.",
    icon: Beef,
  },
  {
    id: "cooperativas",
    name: "Cooperativas",
    desc: "Cooperados, capacidade produtiva e dados cadastrais.",
    icon: Warehouse,
  },
  {
    id: "empresas",
    name: "Empresas",
    desc: "Cadastro e integração de empresas parceiras.",
    icon: Building2,
  },
  {
    id: "clientes",
    name: "Clientes",
    desc: "Organização dos clientes e seus dados.",
    icon: UserRound,
  },
  {
    id: "funcionarios",
    name: "Funcionários",
    desc: "Cadastro e gestão da equipe.",
    icon: BriefcaseBusiness,
  },
  {
    id: "recursos",
    name: "Recursos",
    desc: "Controle de insumos, máquinas e recursos.",
    icon: Package,
  },
  {
    id: "produtos",
    name: "Produtos",
    desc: "Catálogo de produtos e informações de produção.",
    icon: ShoppingBasket,
  },
  {
    id: "parcerias",
    name: "Parcerias",
    desc: "Conexões e acordos entre participantes do agro.",
    icon: Handshake,
  },
];

const features = [
  {
    icon: Search,
    title: "Gestão centralizada",
    desc: "Informações organizadas para facilitar a consulta e o acompanhamento.",
  },
  {
    icon: FileSpreadsheet,
    title: "Importação de planilhas",
    desc: "Facilite o cadastro de dados utilizando arquivos compatíveis.",
  },
  {
    icon: Zap,
    title: "Decisões baseadas em dados",
    desc: "Indicadores para apoiar o planejamento e a gestão das atividades.",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (id) => {
    setActiveTab(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;

      case "acesso":
        return <Acesso />;

      case "dashboard":
        return <Dashboard />;

      case "produtores":
        return <Produtores />;

      case "produtos":
        return <Produtos />;

      case "agricultores":
        return <Agricultores />;

      case "pecuaristas":
        return <Pecuaristas />;

      case "empresas":
        return <Empresas />;

      case "cooperativas":
        return <Cooperativas />;

      case "funcionarios":
        return <Funcionarios />;

      case "clientes":
        return <Clientes />;

      case "recursos":
        return <Recursos />;

      case "parcerias":
        return <Parcerias />;

      default:
        return <Home />;
    }
  };

  // A página Home continua sendo o ponto de entrada
  // do sistema. As demais áreas mantêm seus componentes atuais.
  if (activeTab !== "home") {
    return (
      <div className="app-container">
        <aside className="sidebar">
          <button
            className="sidebar-brand brand-button"
            onClick={() => navigate("home")}
          >
            <span className="brand-icon">
              <Sprout size={25} />
            </span>
            <span>
              AutoAgro<span className="brand-accent">Nordeste</span>
            </span>
          </button>

          <p className="sidebar-label">MENU PRINCIPAL</p>

          <nav className="sidebar-nav">
            <button
              className="nav-item"
              onClick={() => navigate("home")}
            >
              <Leaf size={18} />
              Início
            </button>

            {pages.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? "active" : ""
                    }`}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={18} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <Sprout size={17} />
            Gestão inteligente do agro
          </div>
        </aside>

        <main className="main-content">
          <header className="content-topbar">
            <button
              className="back-home"
              onClick={() => navigate("home")}
            >
              <ArrowRight size={17} />
              Voltar ao início
            </button>
            <span className="system-status">
              <span className="status-dot" />
              AutoAgroNordeste
            </span>
          </header>

          {renderContent()}
        </main>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="landing-header">
        <a
          href="#inicio"
          className="landing-brand"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-icon">
            <Sprout size={27} />
          </span>
          <span>
            AutoAgro<span className="brand-accent">Nordeste</span>
          </span>
        </a>

        <nav className={`landing-nav ${menuOpen ? "nav-open" : ""}`}>
          <a href="#inicio" onClick={() => setMenuOpen(false)}>
            Início
          </a>
          <a href="#telas" onClick={() => setMenuOpen(false)}>
            Plataforma
          </a>
          <a href="#recursos" onClick={() => setMenuOpen(false)}>
            Recursos
          </a>
          <button
            className="header-cta"
            onClick={() => navigate("acesso")}
          >
            Acessar sistema <ArrowRight size={16} />
          </button>
        </nav>

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-background" />

          <div className="hero-overlay" />

          <div className="hero-content">
            <div className="hero-eyebrow">
              <span className="eyebrow-line" />
              TECNOLOGIA PARA O AGRONEGÓCIO
            </div>

            <h1>
              Do campo à cooperativa,
              <br />
              <span>tudo em um só lugar.</span>
            </h1>

            <p className="hero-description">
              Conecte produtores, cooperativas e empresas em uma
              plataforma desenvolvida para simplificar a gestão e
              fortalecer o agronegócio nordestino.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#telas">
                Explorar plataforma <ArrowRight size={18} />
              </a>

              <a className="secondary-button" href="#recursos">
                Conhecer recursos
              </a>
            </div>

            <div className="hero-bottom-note">
              <span className="hero-note-icon">
                <Leaf size={18} />
              </span>
              <span>
                <strong>Gestão integrada</strong>
                <small>Informação para melhores decisões</small>
              </span>
            </div>
          </div>

          <div className="hero-side-label">
            AGRICULTURA · TECNOLOGIA · CONEXÃO
          </div>
        </section>

        <section className="platform-section" id="telas">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                <span className="section-eyebrow-dot" />
                UM ECOSSISTEMA CONECTADO
              </span>
              <h2>
                Tudo o que você precisa
                <br />
                <span>para gerir o agro.</span>
              </h2>
            </div>

            <p>
              Explore as áreas da plataforma e encontre em um só
              ambiente as ferramentas para organizar sua operação.
            </p>
          </div>

          <div className="platform-grid">
            {pages.map((page, index) => {
              const Icon = page.icon;

              return (
                <button
                  key={page.id}
                  className="platform-card"
                  onClick={() => navigate(page.id)}
                >
                  <div className="card-top">
                    <span className="card-icon">
                      <Icon size={23} />
                    </span>
                    <span className="card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3>{page.name}</h3>
                  <p>{page.desc}</p>

                  <span className="card-link">
                    Acessar área <ChevronRight size={17} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="features-section" id="recursos">
          <div className="features-intro">
            <span className="section-eyebrow light-eyebrow">
              <span className="section-eyebrow-dot" />
              TECNOLOGIA A SERVIÇO DO CAMPO
            </span>

            <h2>
              Menos burocracia.
              <br />
              <span>Mais inteligência.</span>
            </h2>

            <p>
              Ferramentas para organizar informações, integrar
              participantes e apoiar decisões mais estratégicas.
            </p>

            <button
              className="features-button"
              onClick={() => navigate("acesso")}
            >
              Acessar plataforma <ArrowRight size={17} />
            </button>
          </div>

          <div className="features-list">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article className="feature-item" key={feature.title}>
                  <span className="feature-icon">
                    <Icon size={23} />
                  </span>

                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>

                  <ArrowRight className="feature-arrow" size={19} />
                </article>
              );
            })}
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-icon">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h2>Um agro mais conectado começa com informação.</h2>
            <p>
              Organize seus cadastros e acompanhe sua operação em
              uma plataforma centralizada.
            </p>
          </div>
          <button
            className="closing-button"
            onClick={() => navigate("acesso")}
          >
            Entrar no sistema <ArrowRight size={17} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="#inicio" className="footer-brand">
          <Sprout size={20} />
          AutoAgroNordeste
        </a>
        <p>Gestão inteligente para o agronegócio nordestino.</p>
        <span>© {new Date().getFullYear()} AutoAgroNordeste</span>
      </footer>
    </div>
  );
}

export default App;
