import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  Play,
  Square,
  RefreshCw,
  Hammer,
  Eye,
  ExternalLink,
  Copy,
  Terminal,
  Trash2,
  ChevronDown,
  ChevronUp,
  Globe,
  Info,
  Package,
  Layers,
  Code2,
  Check,
  PlusCircle,
  Search,
  Server,
  Zap,
  Shield,
  Boxes,
  Compass,
  LayoutGrid,
  Triangle,
  Flame,
  Activity,
  Mountain,
  Rocket,
  PackageCheck,
  Sparkles,
  Gem,
  Atom,
  ShieldAlert,
  Cpu,
  Palette,
  MousePointer,
  BarChart3,
  Binary,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { TRANSLATIONS, LANGUAGE_OPTIONS, Language } from './translations.ts';
import { Dependency, ProjectInfo, SystemInfo, FrameworkTemplateId, PopularLibrary, MissingCheckResult } from './types.ts';
import { FRAMEWORK_CATALOG, POPULAR_LIBRARIES_CATALOG } from './ecosystemCatalog.ts';

export default function App() {
  const [lang, setLang] = useState<Language>('pt');
  const t = (key: string): string => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['pt']?.[key] || key;

  // Project Path & Recents
  const [projectPath, setProjectPath] = useState<string>('');
  const [recentProjects, setRecentProjects] = useState<string[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'manage' | 'new' | 'custom' | 'manual'>('manage');

  // New Project Form
  const [newProjectType, setNewProjectType] = useState<FrameworkTemplateId>('express');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'all' | 'backend' | 'frontend' | 'library' | 'desktop'>('all');
  const [newPackageManager, setNewPackageManager] = useState<'npm' | 'pnpm' | 'yarn' | 'bun'>('npm');
  const [newDevPackage, setNewDevPackage] = useState<string>('');

  // Missing Dependencies & Custom Package Install
  const [missingCheckResult, setMissingCheckResult] = useState<MissingCheckResult | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [installerTab, setInstallerTab] = useState<'catalog' | 'custom'>('catalog');
  const [packageToInstall, setPackageToInstall] = useState<string>('');
  const [packageVersion, setPackageVersion] = useState<string>('');
  const [installAsDev, setInstallAsDev] = useState<boolean>(false);
  const [isInstallingPackage, setIsInstallingPackage] = useState<boolean>(false);
  const [selectedLibraryDetails, setSelectedLibraryDetails] = useState<PopularLibrary | null>(null);
  const [libCategoryFilter, setLibCategoryFilter] = useState<string>('all');
  const [libSearchQuery, setLibSearchQuery] = useState<string>('');

  // Manual Tab Search & Category
  const [manualSearch, setManualSearch] = useState<string>('');
  const [manualCategoryFilter, setManualCategoryFilter] = useState<'all' | 'backend' | 'frontend' | 'library' | 'desktop'>('all');
  const [expandedManualItem, setExpandedManualItem] = useState<string | null>(null);

  // Custom Command Form
  const [customCommand, setCustomCommand] = useState<string>('npm run build');

  // Dependencies
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [depSearch, setDepSearch] = useState<string>('');
  const [isDepsExpanded, setIsDepsExpanded] = useState<boolean>(true);

  // Status & Logs
  const [status, setStatus] = useState<{ text: string; type: 'ready' | 'working' | 'running' | 'error' }>({
    text: 'Pronto',
    type: 'ready',
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [serverStatus, setServerStatus] = useState<{
    running: boolean;
    mode: 'dev' | 'preview' | null;
    url: string;
    customRunning: boolean;
  }>({
    running: false,
    mode: null,
    url: 'http://localhost:5173/',
    customRunning: false,
  });

  // Modals & Notifications
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [availableProjects, setAvailableProjects] = useState<{ name: string; path: string; hasPackageJson: boolean; framework?: string }[]>([]);
  const [showSystemModal, setShowSystemModal] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const addLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  // Connect to live SSE logs
  useEffect(() => {
    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.line) {
          addLog(data.line);
        }
      } catch {
        // ignore
      }
    };
    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Initial load
  useEffect(() => {
    fetchRecentProjects();
    fetchSystemInfo();
    fetchServerStatus();
    fetchAvailableProjects();
  }, []);

  const fetchRecentProjects = async () => {
    try {
      const res = await fetch('/api/projects/recent');
      const data = await res.json();
      if (data.projects && data.projects.length > 0) {
        setRecentProjects(data.projects);
        if (!projectPath) {
          selectProject(data.projects[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailableProjects = async () => {
    try {
      const res = await fetch('/api/projects/list');
      const data = await res.json();
      setAvailableProjects(data.projects || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/system-info');
      const data = await res.json();
      setSystemInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/projects/server/status');
      const data = await res.json();
      setServerStatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectProject = async (targetPath: string) => {
    setProjectPath(targetPath);
    setMissingCheckResult(null);
    setStatus({ text: t('Verificando dependências…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: targetPath }),
      });
      const data = await res.json();
      if (res.ok && data.exists) {
        setProjectInfo(data);
        setStatus({ text: t('Projeto aberto'), type: 'ready' });
        addLog(`Projeto aberto: ${targetPath}`);
        // Refresh recents
        const recRes = await fetch('/api/projects/recent');
        const recData = await recRes.json();
        setRecentProjects(recData.projects || []);
        // Check for missing automatically
        checkMissingInternal(targetPath);
      } else {
        setProjectInfo(null);
        setStatus({ text: data.error || t('Falha'), type: 'error' });
      }
    } catch (err: any) {
      setStatus({ text: err.message, type: 'error' });
    }
  };

  const checkMissingInternal = async (targetDir: string) => {
    try {
      const res = await fetch('/api/projects/dependencies/verify-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: targetDir }),
      });
      const data = await res.json();
      if (res.ok) {
        setMissingCheckResult(data);
      }
    } catch {
      // ignore silent check
    }
  };

  const openInstallModal = (pkgName?: string, isDev?: boolean, ver?: string) => {
    if (pkgName) {
      setPackageToInstall(pkgName);
      setInstallAsDev(Boolean(isDev));
      setPackageVersion(ver || '');
      const match = POPULAR_LIBRARIES_CATALOG.find((lib) => lib.name.toLowerCase() === pkgName.toLowerCase());
      setSelectedLibraryDetails(match || null);
      setInstallerTab(match ? 'catalog' : 'custom');
    } else {
      setPackageToInstall('');
      setPackageVersion('');
      setInstallAsDev(false);
      setSelectedLibraryDetails(null);
      setInstallerTab('catalog');
    }
    setShowInstallModal(true);
  };

  const handleVerifyMissing = async () => {
    if (!projectPath) return;
    setIsBusy(true);
    setStatus({ text: 'Verificando integridade das bibliotecas na pasta…', type: 'working' });
    try {
      const res = await fetch('/api/projects/dependencies/verify-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath }),
      });
      const data = await res.json();
      if (res.ok) {
        setMissingCheckResult(data);
        if (!data.hasNodeModules && data.totalDeclared > 0) {
          setStatus({ text: 'node_modules ausente', type: 'error' });
          notify('A pasta node_modules não foi encontrada! Nenhuma biblioteca está instalada.');
        } else if (data.allInstalled) {
          setStatus({ text: 'Todas instaladas', type: 'ready' });
          notify(`Todas as ${data.totalDeclared} bibliotecas declaradas estão presentes em node_modules!`);
        } else {
          setStatus({ text: `${data.missingCount} ausente(s)`, type: 'error' });
          notify(`Atenção: ${data.missingCount} biblioteca(s) ausente(s) em node_modules!`);
        }
      } else {
        notify(data.error || 'Falha ao verificar bibliotecas');
      }
    } catch (err: any) {
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleInstallMissing = async (specificPkg?: string) => {
    if (!projectPath) return;
    setIsBusy(true);
    const msg = specificPkg
      ? `Baixando e instalando ${specificPkg}…`
      : 'Baixando e instalando bibliotecas ausentes…';
    setStatus({ text: msg, type: 'working' });
    try {
      const res = await fetch('/api/projects/dependencies/install-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: projectPath,
          packageNames: specificPkg ? [specificPkg] : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(specificPkg ? `Biblioteca "${specificPkg}" baixada e instalada com sucesso!` : 'Todas as bibliotecas ausentes foram baixadas e instaladas com sucesso!');
        setStatus({ text: 'Pronto', type: 'ready' });
        handleVerifyMissing();
        handleCheckDependencies();
      } else {
        notify(data.error || 'Falha na instalação');
      }
    } catch (err: any) {
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleInstallCustomPackage = async (overridePkg?: string, overrideDev?: boolean, overrideVer?: string) => {
    const pkg = (overridePkg !== undefined ? overridePkg : packageToInstall).trim();
    const dev = overrideDev !== undefined ? overrideDev : installAsDev;
    const ver = (overrideVer !== undefined ? overrideVer : packageVersion).trim();
    if (!projectPath || !pkg) return;

    setIsInstallingPackage(true);
    setStatus({ text: `Baixando e instalando ${pkg}…`, type: 'working' });
    try {
      const res = await fetch('/api/projects/dependencies/install-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: projectPath,
          packageName: pkg,
          isDev: dev,
          version: ver || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        notify(`Biblioteca "${pkg}" baixada e instalada com sucesso!`);
        setStatus({ text: 'Biblioteca instalada', type: 'ready' });
        setPackageToInstall('');
        setPackageVersion('');
        setSelectedLibraryDetails(null);
        setShowInstallModal(false);
        handleCheckDependencies();
        handleVerifyMissing();
      } else {
        notify(data.error || 'Falha ao instalar biblioteca');
      }
    } catch (err: any) {
      notify(err.message);
    } finally {
      setIsInstallingPackage(false);
    }
  };

  const handleCheckDependencies = async () => {
    if (!projectPath) return;
    setIsBusy(true);
    setStatus({ text: t('Verificando dependências…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/dependencies/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath }),
      });
      const data = await res.json();
      if (res.ok) {
        setDependencies(data.dependencies || []);
        setStatus({ text: t('Verificação concluída'), type: 'ready' });
        notify(t('Verificação concluída'));
      } else {
        setStatus({ text: t('Falha'), type: 'error' });
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      setStatus({ text: t('Falha'), type: 'error' });
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleUpdateDependencies = async () => {
    if (!projectPath) return;
    setIsBusy(true);
    setStatus({ text: t('Atualizando dependências…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/dependencies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ text: t('Atualização concluída'), type: 'ready' });
        notify(t('Atualização concluída'));
        handleCheckDependencies();
        handleVerifyMissing();
      } else {
        setStatus({ text: t('Falha'), type: 'error' });
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      setStatus({ text: t('Falha'), type: 'error' });
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleBuildProject = async () => {
    if (!projectPath) return;
    setIsBusy(true);
    setStatus({ text: t('Compilando build de produção…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ text: t('Build concluído'), type: 'ready' });
        notify(t('Build concluído'));
      } else {
        setStatus({ text: t('Falha'), type: 'error' });
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      setStatus({ text: t('Falha'), type: 'error' });
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStartServer = async (mode: 'dev' | 'preview') => {
    if (!projectPath) return;
    setIsBusy(true);
    const statusText = mode === 'dev' ? t('Iniciando servidor…') : t('Iniciando prévia de produção…');
    setStatus({ text: statusText, type: 'working' });
    try {
      const res = await fetch('/api/projects/server/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath, mode }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerStatus({
          running: true,
          mode,
          url: data.url || 'http://localhost:5173/',
          customRunning: false,
        });
        const runningText = mode === 'dev' ? t('Servidor em execução') : t('Prévia de produção em execução');
        setStatus({ text: runningText, type: 'running' });
        notify(runningText);
      } else {
        setStatus({ text: t('Falha'), type: 'error' });
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      setStatus({ text: t('Falha'), type: 'error' });
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStopServer = async () => {
    setStatus({ text: t('Parando servidor…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/server/stop', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setServerStatus((prev) => ({ ...prev, running: false, mode: null }));
        setStatus({ text: t('Servidor/prévia parado'), type: 'ready' });
        notify(t('Servidor/prévia parado'));
      } else {
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleRunCommand = async () => {
    if (!projectPath || !customCommand.trim()) return;
    setStatus({ text: t('Executando comando…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/command/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory: projectPath, command: customCommand.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setServerStatus((prev) => ({ ...prev, customRunning: true }));
      } else {
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleStopCommand = async () => {
    try {
      await fetch('/api/projects/command/stop', { method: 'POST' });
      setServerStatus((prev) => ({ ...prev, customRunning: false }));
      notify('Comando parado.');
    } catch (err: any) {
      notify(err.message);
    }
  };

  const handleCreateProject = async () => {
    if (!projectPath) {
      notify('A pasta do projeto não foi informada.');
      return;
    }
    setIsBusy(true);
    setStatus({ text: t('Criando projeto…'), type: 'working' });
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory: projectPath,
          projectType: newProjectType,
          packageManager: newPackageManager,
          devPackage: newDevPackage,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ text: t('Projeto pronto'), type: 'ready' });
        notify(t('Projeto pronto'));
        selectProject(projectPath);
        fetchAvailableProjects();
        setActiveTab('manage');
      } else {
        setStatus({ text: t('Falha'), type: 'error' });
        notify(data.error || t('Falha'));
      }
    } catch (err: any) {
      setStatus({ text: t('Falha'), type: 'error' });
      notify(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(serverStatus.url);
    notify(t('Copiar link local') + ': ' + serverStatus.url);
  };

  const filteredDependencies = dependencies.filter(
    (d) =>
      d.name.toLowerCase().includes(depSearch.toLowerCase()) ||
      d.status.toLowerCase().includes(depSearch.toLowerCase()) ||
      (d.category && d.category.toLowerCase().includes(depSearch.toLowerCase()))
  );

  const filteredTemplates = FRAMEWORK_CATALOG.filter((item) => {
    if (templateCategoryFilter === 'all') return true;
    return item.category === templateCategoryFilter;
  });

  const filteredManualItems = FRAMEWORK_CATALOG.filter((item) => {
    const matchesCategory = manualCategoryFilter === 'all' || item.category === manualCategoryFilter;
    const query = manualSearch.toLowerCase().trim();
    if (!query) return matchesCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.npmPackage.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (item.technicalOverview.pt && item.technicalOverview.pt.toLowerCase().includes(query)) ||
      (item.technicalOverview.en && item.technicalOverview.en.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Server': return <Server className="h-4 w-4" />;
      case 'Zap': return <Zap className="h-4 w-4" />;
      case 'Layers': return <Layers className="h-4 w-4" />;
      case 'Shield': return <Shield className="h-4 w-4" />;
      case 'Boxes': return <Boxes className="h-4 w-4" />;
      case 'Compass': return <Compass className="h-4 w-4" />;
      case 'LayoutGrid': return <LayoutGrid className="h-4 w-4" />;
      case 'Triangle': return <Triangle className="h-4 w-4" />;
      case 'Flame': return <Flame className="h-4 w-4" />;
      case 'Activity': return <Activity className="h-4 w-4" />;
      case 'Mountain': return <Mountain className="h-4 w-4" />;
      case 'Rocket': return <Rocket className="h-4 w-4" />;
      case 'PackageCheck': return <PackageCheck className="h-4 w-4" />;
      case 'Sparkles': return <Sparkles className="h-4 w-4" />;
      case 'Gem': return <Gem className="h-4 w-4" />;
      case 'Atom': return <Atom className="h-4 w-4" />;
      case 'ShieldAlert': return <ShieldAlert className="h-4 w-4" />;
      case 'Palette': return <Palette className="h-4 w-4" />;
      case 'MousePointer': return <MousePointer className="h-4 w-4" />;
      case 'BarChart3': return <BarChart3 className="h-4 w-4" />;
      case 'Binary': return <Binary className="h-4 w-4" />;
      default: return <Code2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Vite Project Manager &bull; Node.js Ecosystem
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Full-Stack
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {t('Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status.type === 'working'
                  ? 'bg-amber-400 animate-ping'
                  : status.type === 'running'
                  ? 'bg-emerald-400 animate-pulse'
                  : status.type === 'error'
                  ? 'bg-red-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-medium text-slate-200">{status.text}</span>
          </div>

          {/* Node.js Info Button */}
          <button
            onClick={() => setShowSystemModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition"
            title={t('Abrir pasta do Node.js')}
          >
            <Code2 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Node {systemInfo?.nodeVersion || 'v22'}</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="bg-transparent text-slate-200 border-none outline-none cursor-pointer text-xs"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code} className="bg-slate-900 text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-200 shadow-2xl animate-fade-in text-sm">
          <Info className="h-4 w-4 text-indigo-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Project Path & Selection Card */}
        <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Folder className="h-4 w-4 text-indigo-400" />
                {t('Pasta do projeto')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.')}
              </p>
            </div>

            {/* Recent projects dropdown */}
            {recentProjects.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap">{t('Projetos recentes')}:</span>
                <select
                  value={projectPath}
                  onChange={(e) => selectProject(e.target.value)}
                  className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 max-w-xs truncate outline-none focus:border-indigo-500 transition"
                >
                  {recentProjects.map((p) => (
                    <option key={p} value={p}>
                      {p.split('/').pop() || p}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                onBlur={() => projectPath && selectProject(projectPath)}
                onKeyDown={(e) => e.key === 'Enter' && selectProject(projectPath)}
                placeholder="/path/to/project or projects/demo-express-api"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              onClick={() => selectProject(projectPath)}
              disabled={isBusy || !projectPath}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <FolderOpen className="h-4 w-4" />
              <span>{t('Abrir recente')}</span>
            </button>

            <button
              onClick={() => {
                fetchAvailableProjects();
                setShowFolderModal(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Search className="h-4 w-4 text-indigo-400" />
              <span>{t('Selecionar pasta…')}</span>
            </button>
          </div>

          {/* Project Details Banner */}
          {projectInfo?.hasPackageJson && (
            <div className="pt-2 text-xs border-t border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{t('Pacote')}:</span>
                  <span className="font-semibold text-slate-200">{projectInfo.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Framework:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                    {projectInfo.framework || 'Node.js'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{t('Gerenciador')}:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-medium border border-amber-500/20">
                    {projectInfo.packageManager || 'npm'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{t('Bibliotecas e dependências')}:</span>
                  <span className="font-semibold text-slate-200">{projectInfo.dependenciesCount ?? 0}</span>
                </div>
              </div>

              {/* Detected Node.js Ecosystem Libraries Chips */}
              {projectInfo.detectedEcosystem && projectInfo.detectedEcosystem.length > 0 && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Boxes className="h-3 w-3 text-indigo-400" />
                    {t('Ecossistema Node.js')}:
                  </span>
                  {projectInfo.detectedEcosystem.map((eco) => (
                    <span
                      key={eco}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    >
                      {eco}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'manage'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="h-4 w-4" />
            {t('Projeto selecionado')}
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'new'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            {t('Novo projeto')}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            {t('Comandos personalizados')}
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'manual'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {t('Manual técnico')}
          </button>
        </div>

        {/* TAB 1: Selected Project Actions */}
        {activeTab === 'manage' && (
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{t('Projeto selecionado')}</h3>
                <p className="text-xs text-slate-400">
                  {t('Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.')}
                </p>
              </div>

              {serverStatus.running && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{serverStatus.mode === 'preview' ? 'Preview: ' : 'Executando: '}</span>
                  <a
                    href={serverStatus.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-emerald-300"
                  >
                    {serverStatus.url}
                  </a>
                </div>
              )}
            </div>

            {/* Missing Libraries Check Banner */}
            {missingCheckResult && (
              <div
                className={`p-4 rounded-xl border flex flex-col gap-3 text-xs transition ${
                  missingCheckResult.allInstalled
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : !missingCheckResult.hasNodeModules && missingCheckResult.totalDeclared > 0
                    ? 'bg-red-950/40 border-red-500/30 text-red-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    {missingCheckResult.allInstalled ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-sm">
                        {missingCheckResult.allInstalled
                          ? `Diagnóstico OK: Todas as ${missingCheckResult.totalDeclared} bibliotecas declaradas estão instaladas`
                          : !missingCheckResult.hasNodeModules && missingCheckResult.totalDeclared > 0
                          ? 'Atenção: A pasta node_modules não existe. Nenhuma dependência instalada.'
                          : `${t('Bibliotecas ausentes detectadas')}: ${missingCheckResult.missingCount} pacote(s)`}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5">
                        {missingCheckResult.allInstalled
                          ? `Total inspecionado: ${missingCheckResult.totalDeclared} pacotes declarados em package.json e presentes no disco.`
                          : `${missingCheckResult.installedCount || 0} de ${missingCheckResult.totalDeclared} bibliotecas instaladas.`}
                      </div>
                    </div>
                  </div>

                  {!missingCheckResult.allInstalled && (
                    <button
                      onClick={() => handleInstallMissing()}
                      disabled={isBusy}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-600/20 shrink-0 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {!missingCheckResult.hasNodeModules
                          ? t('Instalar todas agora')
                          : t('Instalar bibliotecas ausentes')}
                      </span>
                    </button>
                  )}
                </div>

                {/* List of Missing Libraries with 1-click Install */}
                {!missingCheckResult.allInstalled && missingCheckResult.missingDetails && missingCheckResult.missingDetails.length > 0 && (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2">
                    <span className="text-[11px] font-semibold text-amber-300 block">
                      Pacotes faltantes na pasta do projeto:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {missingCheckResult.missingDetails.map((item) => (
                        <div
                          key={item.name}
                          className="p-2.5 rounded-lg bg-slate-950/70 border border-amber-500/30 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-mono font-bold text-slate-200 truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.declared} &bull; {item.kind}
                            </div>
                          </div>
                          <button
                            onClick={() => handleInstallMissing(item.name)}
                            disabled={isBusy}
                            className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-500/40 text-[10px] font-semibold shrink-0 transition flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>{t('Instalar esta')}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Check Missing Libraries in folder */}
              <button
                onClick={handleVerifyMissing}
                disabled={isBusy}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
                <span>{t('Verificar bibliotecas ausentes')}</span>
              </button>

              {/* Install Any Custom Library */}
              <button
                onClick={() => openInstallModal()}
                disabled={isBusy || !projectPath}
                className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Download className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
                <span>{t('Baixar e instalar biblioteca')}</span>
              </button>

              {/* Check Dependencies */}
              <button
                onClick={handleCheckDependencies}
                disabled={isBusy || serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <RefreshCw className="h-4 w-4 text-indigo-400 group-hover:rotate-180 transition duration-500" />
                <span>{t('Verificar dependências')}</span>
              </button>

              {/* Update Dependencies */}
              <button
                onClick={handleUpdateDependencies}
                disabled={isBusy || serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Package className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
                <span>{t('Atualizar dependências')}</span>
              </button>

              {/* Production Build */}
              <button
                onClick={handleBuildProject}
                disabled={isBusy || serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Hammer className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition" />
                <span>{t('Build de produção')}</span>
              </button>

              {/* Preview Build */}
              <button
                onClick={() => handleStartServer('preview')}
                disabled={isBusy || serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Eye className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition" />
                <span>{t('Pré-visualizar build')}</span>
              </button>

              {/* Dev Server Start or Stop */}
              {!serverStatus.running ? (
                <button
                  onClick={() => handleStartServer('dev')}
                  disabled={isBusy}
                  className="p-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
                >
                  <Play className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
                  <span>{t('Iniciar servidor de desenvolvimento')}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopServer}
                  className="p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
                >
                  <Square className="h-4 w-4 text-red-400 group-hover:scale-110 transition" />
                  <span>{serverStatus.mode === 'preview' ? t('Parar prévia') : t('Parar servidor')}</span>
                </button>
              )}

              {/* Open in Browser */}
              <button
                onClick={() => {
                  if (serverStatus.running) {
                    window.open(serverStatus.url, '_blank');
                  } else {
                    notify(t('Inicie o servidor ou a prévia antes de abrir o link.'));
                  }
                }}
                disabled={!serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <ExternalLink className="h-4 w-4 text-sky-400 group-hover:scale-110 transition" />
                <span>{t('Abrir no navegador')}</span>
              </button>

              {/* Copy Local Link */}
              <button
                onClick={handleCopyLink}
                disabled={!serverStatus.running}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 disabled:opacity-40 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Copy className="h-4 w-4 text-slate-400 group-hover:scale-110 transition" />
                <span>{t('Copiar link local')}</span>
              </button>

              {/* Node.js info */}
              <button
                onClick={() => setShowSystemModal(true)}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 rounded-xl text-xs font-medium flex flex-col items-start gap-2 transition text-left group"
              >
                <Code2 className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
                <span>{t('Abrir pasta do Node.js')}</span>
              </button>
            </div>
          </section>
        )}

        {/* TAB 2: New Project Wizard */}
        {activeTab === 'new' && (
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{t('Novo projeto')}</h3>
              <p className="text-xs text-slate-400">
                {t('Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.')}
              </p>
            </div>

            {/* Category Filter for Frameworks */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
              <span className="text-xs font-medium text-slate-400 mr-1">{t('Categoria')}:</span>
              {[
                { id: 'all', label: t('Todos os Frameworks') },
                { id: 'backend', label: t('Backend & Servidores') },
                { id: 'frontend', label: t('Frontend & Reatividade') },
                { id: 'library', label: t('Bibliotecas & Utilitários') },
                { id: 'desktop', label: t('Empacotamento Desktop') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setTemplateCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    templateCategoryFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Frameworks Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = newProjectType === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setNewProjectType(tpl.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className={`${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {renderIcon(tpl.iconName)}
                          </span>
                          {tpl.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                            tpl.category === 'backend'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : tpl.category === 'frontend'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : tpl.category === 'desktop'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {tpl.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tpl.description}</p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/40 flex justify-between">
                      <span>Dev: {tpl.defaultDevScript}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Package Manager Selection */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">{t('Gerenciador')}</label>
                  <div className="flex gap-2">
                    {['npm', 'pnpm', 'yarn', 'bun'].map((mgr) => (
                      <button
                        key={mgr}
                        type="button"
                        onClick={() => setNewPackageManager(mgr as any)}
                        className={`px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                          newPackageManager === mgr
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {mgr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Dev Package Input */}
                <div className="space-y-1 flex-1 sm:max-w-md">
                  <label className="text-xs font-medium text-slate-300">
                    {t('Dependência dev opcional (Node.js)')}
                  </label>
                  <input
                    type="text"
                    value={newDevPackage}
                    onChange={(e) => setNewDevPackage(e.target.value)}
                    placeholder="ex: typescript, @types/node, nodemon"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  onClick={handleCreateProject}
                  disabled={isBusy || !projectPath}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{t('Criar e instalar projeto')}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: Custom Commands */}
        {activeTab === 'custom' && (
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">{t('Comandos personalizados')}</h3>
              <p className="text-xs text-slate-400">
                {t('Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.')}
              </p>
            </div>

            {/* Quick chips for full ecosystem */}
            <div className="flex flex-wrap gap-2">
              {[
                'npm run dev',
                'npm run build',
                'npm test',
                'node index.js',
                'npm list --depth=0',
                'npm outdated',
                'ls -la',
                'node -v',
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => setCustomCommand(cmd)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-mono transition"
                >
                  ${cmd}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
                placeholder="ex: npm run build ou node index.js"
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />

              {!serverStatus.customRunning ? (
                <button
                  onClick={handleRunCommand}
                  disabled={!customCommand.trim() || !projectPath}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Play className="h-4 w-4" />
                  <span>{t('Executar')}</span>
                </button>
              ) : (
                <button
                  onClick={handleStopCommand}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Square className="h-4 w-4" />
                  <span>{t('Parar comando')}</span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: Manual Técnico (Technical Manual) */}
        {activeTab === 'manual' && (
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  {t('Manual técnico')}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guia de arquitetura, ecossistema Node.js e especificações técnicas de cada framework e biblioteca integrada.
                </p>
              </div>

              {/* Search input in technical manual */}
              <div className="relative w-full md:w-80">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder={t('Pesquisar no manual técnico')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Category Filter for Manual */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-xs font-medium text-slate-400 mr-1">{t('Categoria')}:</span>
              {[
                { id: 'all', label: t('Todos os Frameworks') },
                { id: 'backend', label: t('Backend & Servidores') },
                { id: 'frontend', label: t('Frontend & Reatividade') },
                { id: 'library', label: t('Bibliotecas & Utilitários') },
                { id: 'desktop', label: t('Empacotamento Desktop') },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setManualCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    manualCategoryFilter === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* List of Technical Documentation Cards */}
            <div className="space-y-3">
              {filteredManualItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum framework ou biblioteca encontrado com os filtros selecionados.
                </div>
              ) : (
                filteredManualItems.map((item) => {
                  const isExpanded = expandedManualItem === item.id;
                  const wikiUrl = lang === 'en' ? item.wikipediaUrl.en : item.wikipediaUrl.pt;
                  const overview = lang === 'en' ? item.technicalOverview.en : item.technicalOverview.pt;

                  return (
                    <article
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl overflow-hidden transition shadow-sm"
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => setExpandedManualItem(isExpanded ? null : item.id)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {renderIcon(item.iconName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{item.name}</h4>
                              <code className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                                {item.npmPackage}
                              </code>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                                  item.category === 'backend'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : item.category === 'frontend'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : item.category === 'desktop'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}
                              >
                                {item.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {/* Wikipedia Direct Link */}
                          <a
                            href={wikiUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-sky-400 transition"
                            title={t('Leia mais na Wikipédia')}
                          >
                            <span>{t('Leia mais na Wikipédia')}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Technical Details */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-900/30 text-xs space-y-4">
                          {/* Technical Overview */}
                          <div>
                            <h5 className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                              <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                              {t('Visão Geral Técnica')}
                            </h5>
                            <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                              {overview}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Key Features */}
                            <div>
                              <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                <Zap className="h-3.5 w-3.5 text-amber-400" />
                                {t('Recursos Principais')}
                              </h5>
                              <ul className="space-y-1.5 text-slate-300">
                                {item.features.map((feat, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Typical Use Cases */}
                            <div>
                              <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                                <Layers className="h-3.5 w-3.5 text-emerald-400" />
                                {t('Casos de Uso Típicos')}
                              </h5>
                              <ul className="space-y-1.5 text-slate-300">
                                {item.typicalUseCases.map((useCase, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    <span>{useCase}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Quick Scaffold action */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 text-slate-400">
                            <div className="flex items-center gap-3 font-mono text-[11px]">
                              <span>Dev: <code className="text-slate-300">{item.defaultDevScript}</code></span>
                              <span>Build: <code className="text-slate-300">{item.defaultBuildScript}</code></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openInstallModal(item.npmPackage, false)}
                                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>{t('Instalar no projeto selecionado')}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setNewProjectType(item.id);
                                  setActiveTab('new');
                                }}
                                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                              >
                                <PlusCircle className="h-3.5 w-3.5" />
                                <span>Criar Projeto com {item.name}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* Libraries & Ecosystem Dependencies Table */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden transition-all">
          <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-indigo-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{t('Bibliotecas e dependências')}</h3>
                <p className="text-[11px] text-slate-400">{t('Versões declaradas, instaladas e disponíveis.')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Add Custom Package Button */}
              <button
                onClick={() => openInstallModal()}
                disabled={!projectPath}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>+ {t('Baixar e instalar biblioteca')}</span>
              </button>

              {isDepsExpanded && (
                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={depSearch}
                    onChange={(e) => setDepSearch(e.target.value)}
                    placeholder={t('Pacote') + ' / Ecossistema...'}
                    className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500 w-44 transition"
                  />
                </div>
              )}

              <button
                onClick={() => setIsDepsExpanded(!isDepsExpanded)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1.5 transition"
              >
                {isDepsExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    <span>{t('Ocultar')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>{t('Expandir')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isDepsExpanded && (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">{t('Pacote')}</th>
                    <th className="px-4 py-2.5">{t('Tipo')}</th>
                    <th className="px-4 py-2.5">Papel no Ecossistema</th>
                    <th className="px-4 py-2.5">{t('Declarada')}</th>
                    <th className="px-4 py-2.5">{t('Instalada')}</th>
                    <th className="px-4 py-2.5">{t('Compatível')}</th>
                    <th className="px-4 py-2.5">{t('Última')}</th>
                    <th className="px-4 py-2.5">{t('Estado')}</th>
                    <th className="px-4 py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDependencies.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        {dependencies.length === 0
                          ? 'Nenhuma dependência inspecionada. Clique em "Verificar dependências".'
                          : 'Nenhum pacote encontrado com o filtro atual.'}
                      </td>
                    </tr>
                  ) : (
                    filteredDependencies.map((dep, idx) => {
                      const isUpToDate = dep.status === 'Atualizada';
                      const isCompatible = dep.status === 'Atualização compatível';
                      const isMissing = dep.status === 'Não instalada';

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-2.5 font-semibold text-slate-200">{dep.name}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                                dep.kind === 'Produção'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}
                            >
                              {t(dep.kind)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-sans">
                            {dep.category ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                                {dep.category}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[10px]">Módulo Node</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">{dep.declared}</td>
                          <td className="px-4 py-2.5 text-slate-300">{dep.installed}</td>
                          <td className="px-4 py-2.5 text-slate-400">{dep.wanted}</td>
                          <td className="px-4 py-2.5 text-slate-300 font-semibold">{dep.latest}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans inline-flex items-center gap-1 ${
                                isUpToDate
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : isCompatible
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : isMissing
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              }`}
                            >
                              {isUpToDate && <Check className="h-3 w-3" />}
                              {t(dep.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-sans">
                            {isMissing ? (
                              <button
                                onClick={() => handleInstallMissing(dep.name)}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow transition"
                                title="Baixar e instalar biblioteca faltante"
                              >
                                <Download className="h-3 w-3" />
                                <span>{t('Instalar esta')}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openInstallModal(dep.name, dep.kind === 'Desenvolvimento', dep.declared)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition"
                                title="Reinstalar ou alterar versão desta biblioteca"
                              >
                                Gerenciar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Command Output Console */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 tracking-wide uppercase font-mono">
                {t('Saída dos comandos')}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">({logs.length} lines)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(logs.join('\n'));
                  notify('Logs copiados!');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title="Copiar log"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setLogs([])}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title={t('Limpar')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-1 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic select-none">
                $ Pronto para gerenciar o ecossistema Node.js. Escolha uma operação acima.
              </div>
            ) : (
              logs.map((log, index) => {
                const isCommand = log.startsWith('$');
                const isError =
                  log.toLowerCase().includes('erro') ||
                  log.toLowerCase().includes('fail') ||
                  log.toLowerCase().includes('falha');
                const isSuccess =
                  log.toLowerCase().includes('concluído') ||
                  log.toLowerCase().includes('ready') ||
                  log.toLowerCase().includes('success');

                return (
                  <div
                    key={index}
                    className={`leading-relaxed break-all ${
                      isCommand
                        ? 'text-cyan-400 font-semibold'
                        : isError
                        ? 'text-red-400'
                        : isSuccess
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {log}
                  </div>
                );
              })
            )}
            <div ref={consoleEndRef} />
          </div>
        </section>
      </main>

      {/* Modal: Selecionar, Baixar e Instalar Biblioteca */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="h-4 w-4 text-indigo-400" />
                  <span>{t('Baixar e instalar biblioteca')}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Destino: {projectInfo?.name || projectPath.split('/').pop()} &bull; {projectInfo?.packageManager || 'npm'}
                </p>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setInstallerTab('catalog')}
                className={`pb-2 border-b-2 flex items-center gap-2 transition ${
                  installerTab === 'catalog'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>{t('Explorador de Bibliotecas')}</span>
              </button>
              <button
                type="button"
                onClick={() => setInstallerTab('custom')}
                className={`pb-2 border-b-2 flex items-center gap-2 transition ${
                  installerTab === 'custom'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>{t('Pacote npm personalizado')}</span>
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {/* TAB A: Popular Libraries Catalog */}
              {installerTab === 'catalog' && (
                <div className="space-y-3">
                  {/* Category Pills & Search */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={libSearchQuery}
                        onChange={(e) => setLibSearchQuery(e.target.value)}
                        placeholder={t('Pesquisar bibliotecas populares...')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'all', label: 'Todas' },
                      { id: 'api', label: 'HTTP & APIs' },
                      { id: 'utils', label: 'Utilitários' },
                      { id: 'validation', label: 'Validação' },
                      { id: 'database', label: 'Banco de Dados' },
                      { id: 'security', label: 'Segurança' },
                      { id: 'ui', label: 'Frontend & UI' },
                      { id: 'dev', label: 'Dev & Testes' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setLibCategoryFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                          libCategoryFilter === cat.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Libraries Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {POPULAR_LIBRARIES_CATALOG.filter((lib) => {
                      const matchesCat = libCategoryFilter === 'all' || lib.category === libCategoryFilter;
                      const matchesSearch =
                        !libSearchQuery.trim() ||
                        lib.name.toLowerCase().includes(libSearchQuery.toLowerCase()) ||
                        lib.description.toLowerCase().includes(libSearchQuery.toLowerCase());
                      return matchesCat && matchesSearch;
                    }).map((lib) => {
                      const isSelected = packageToInstall.toLowerCase() === lib.name.toLowerCase();
                      return (
                        <div
                          key={lib.name}
                          onClick={() => {
                            setPackageToInstall(lib.name);
                            setInstallAsDev(Boolean(lib.isDev));
                            setSelectedLibraryDetails(lib);
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                              : 'bg-slate-950/70 hover:bg-slate-800/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-slate-200">{lib.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-sans">
                              {lib.categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {lib.description}
                          </p>
                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className="text-slate-500">
                              {lib.isDev ? 'Padrão: Desenvolvimento' : 'Padrão: Produção'}
                            </span>
                            {isSelected && (
                              <span className="text-indigo-400 font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Selecionado
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB B: Custom Library Input */}
              {installerTab === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      {t('Nome do pacote ou biblioteca')}:
                    </label>
                    <input
                      type="text"
                      value={packageToInstall}
                      onChange={(e) => {
                        setPackageToInstall(e.target.value);
                        setSelectedLibraryDetails(null);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleInstallCustomPackage()}
                      placeholder="Ex: axios, dotenv, cors, lodash, d3, @types/node..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      {t('Versão opcional')}:
                    </label>
                    <input
                      type="text"
                      value={packageVersion}
                      onChange={(e) => setPackageVersion(e.target.value)}
                      placeholder="latest, ^1.0.0, 4.18.2 (deixe vazio para a versão estável mais recente)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Popular shortcuts */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Atalhos rápidos do ecossistema:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {[
                        'axios',
                        'express',
                        'fastify',
                        'cors',
                        'dotenv',
                        'zod',
                        'lodash',
                        'dayjs',
                        'd3',
                        'bootstrap',
                        'jquery',
                        'socket.io',
                        'bcryptjs',
                        'jsonwebtoken',
                        'chalk',
                        'lucide-react',
                        'uuid',
                        '@types/node',
                        'typescript',
                      ].map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => {
                            setPackageToInstall(sugg);
                            setPackageVersion('');
                          }}
                          className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-300 transition"
                        >
                          +{sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Package Details & Config Box */}
              <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Biblioteca selecionada:</span>
                    <span className="text-sm font-mono font-bold text-white">
                      {packageToInstall.trim() ? packageToInstall.trim() : '(Nenhuma biblioteca selecionada)'}
                      {packageVersion.trim() ? `@${packageVersion.trim()}` : ''}
                    </span>
                  </div>

                  {/* Dependency Type Selection */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInstallAsDev(false)}
                      className={`py-1 px-3 rounded-lg border text-xs font-semibold transition ${
                        !installAsDev
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t('Produção (--save)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallAsDev(true)}
                      className={`py-1 px-3 rounded-lg border text-xs font-semibold transition ${
                        installAsDev
                          ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t('Desenvolvimento (--save-dev)')}
                    </button>
                  </div>
                </div>

                {selectedLibraryDetails && (
                  <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-2 leading-relaxed">
                    <span className="text-indigo-400 font-semibold">{selectedLibraryDetails.name}:</span>{' '}
                    {selectedLibraryDetails.description}
                  </p>
                )}

                {/* Command Preview */}
                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <Terminal className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">$</span>
                  <span>
                    {projectInfo?.packageManager || 'npm'}{' '}
                    {projectInfo?.packageManager === 'yarn'
                      ? `add ${installAsDev ? '-D' : ''} ${packageToInstall || '<pacote>'}`
                      : projectInfo?.packageManager === 'pnpm' || projectInfo?.packageManager === 'bun'
                      ? `add ${installAsDev ? '-D' : ''} ${packageToInstall || '<pacote>'}`
                      : `install ${installAsDev ? '--save-dev' : '--save'} ${packageToInstall || '<pacote>'}${packageVersion ? '@' + packageVersion : ''}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleInstallCustomPackage()}
                disabled={!packageToInstall.trim() || isInstallingPackage}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
              >
                <Download className="h-4 w-4" />
                <span>{isInstallingPackage ? 'Baixando e instalando…' : 'Baixar e Instalar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Choose Folder / Available Projects Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Folder className="h-4 w-4 text-indigo-400" />
                {t('Selecionar a pasta do projeto')}
              </h3>
              <button
                onClick={() => setShowFolderModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {availableProjects.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">Nenhum projeto detectado na pasta padrão.</div>
              ) : (
                availableProjects.map((p) => (
                  <div
                    key={p.path}
                    onClick={() => {
                      selectProject(p.path);
                      setShowFolderModal(false);
                    }}
                    className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                          {p.name}
                          {p.framework && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                              {p.framework}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.path}</div>
                      </div>
                    </div>
                    {p.hasPackageJson && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        package.json
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFolderModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System / Node.js Info Modal */}
      {showSystemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Code2 className="h-4 w-4 text-indigo-400" />
                {t('Abrir pasta do Node.js')}
              </h3>
              <button
                onClick={() => setShowSystemModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Node Version:</span>
                  <span className="text-emerald-400 font-bold">{systemInfo?.nodeVersion || process.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">npm Version:</span>
                  <span className="text-cyan-400 font-bold">{systemInfo?.npmVersion || '10.x'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Platform:</span>
                  <span className="text-slate-300">{systemInfo?.platform || 'linux'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Architecture:</span>
                  <span className="text-slate-300">{systemInfo?.arch || 'x64'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Working Directory:</span>
                  <span className="text-slate-400 truncate max-w-xs">{systemInfo?.cwd || '/'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSystemModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500">
        Vite Project Manager &bull; Suporte Completo ao Ecossistema Node.js &bull; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
