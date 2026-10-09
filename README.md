# Vite Project Manager &bull; Node.js Ecosystem

[Português](#versão-em-português) | [English](#english-version)

---

## <a id="versão-em-português"></a>Versão em Português

Aplicativo híbrido completo: formato web react e formato desktop python. Com as funções de criar, inspecionar e, gerenciar projetos do ecossistema Node.js, com prompt de comando integrado.

O projeto oferece suporte duplo: o **aplicativo desktop clássico em Python** e a **versão moderna full-stack em Node.js/React com suporte a Electron**.

---

### Ecossistema Node.js Integrado: Frameworks e Bibliotecas

A aplicação reconhece, cria, inspeciona dependências e executa comandos para todas as seguintes tecnologias do ecossistema Node.js:

#### 1. Backend, APIs & Servidores HTTP
| Tecnologia | Pacote npm Principal | Categoria | Recursos Integrados |
| :--- | :--- | :--- | :--- |
| **Express.js** | `express` | Servidor Web REST | Criação de rotas, middlewares, parsing JSON e dev server |
| **Fastify** | `fastify` | Servidor de Alta Vazão | Baixo overhead, validação de esquemas e rotas assíncronas |
| **Koa.js** | `koa`, `@koa/router` | Servidor Modular | Middlewares encadeados com `async/await` nativo |
| **Hapi.js** | `@hapi/hapi` | Framework Corporativo | Ciclo de vida robusto e arquitetura centrada em configuração |
| **AdonisJS** | `@adonisjs/core` | MVC Full-Stack | Estrutura MVC tipada com TypeScript e ORM integrado |
| **Sails.js** | `sails` | MVC em Tempo Real | Padrão MVC para Node.js com suporte a WebSockets/rotas |
| **Node.js Básico** | `node` nativo | Core Runtime | `package.json` limpo com scripts configuráveis e dependências dev |

#### 2. Frontend, Frameworks Reativos & SSR
| Tecnologia | Pacote npm Principal | Categoria | Recursos Integrados |
| :--- | :--- | :--- | :--- |
| **React** | `react`, `react-dom` | UI Declarativa | Componentes funcionais, hooks e build otimizado com Vite |
| **Vue.js** | `vue`, `@vitejs/plugin-vue` | Framework Progressivo | Vue 3 com Composition API e Single-File Components (`.vue`) |
| **Nuxt.js** | `nuxt` | Framework Full-Stack SSR | Renderização universal, rotas automáticas e SSR para Vue |
| **Svelte** | `svelte`, `@sveltejs/vite-plugin-svelte` | Compilador Reativo | Reatividade sem Virtual DOM com compilação ultra rápida |
| **SvelteKit** | `@sveltejs/kit` | Framework de Aplicação | Roteamento baseado em arquivos e renderização híbrida |
| **SolidJS** | `solid-js`, `vite-plugin-solid` | Reatividade Fina | Desempenho extremo com sintaxe JSX |
| **Next.js** | `next` | Framework React SSR | App Router, Server Components e exportação estática (`out`) |
| **Angular** | `@angular/core` | Plataforma Corporativa | Estrutura modular em TypeScript com injeção de dependência |
| **Alpine.js** | `alpinejs` | Frontend Declarativo Leve | Diretivas reativas direto no HTML (`x-data`, `x-text`) |
| **Meteor.js** | `meteor-node-stubs` | Plataforma Reativa | Conexão de dados em tempo real e prototipagem rápida |
| **Ember.js** | `ember-source`, `ember-cli` | Framework por Convenção | Arquitetura corporativa estável para aplicações complexas |
| **Aurelia** | `aurelia`, `aurelia-framework` | Padrões Web | Data-binding bidirecional e arquitetura desacoplada |
| **Glimmer.js** | `@glimmer/component` | Componentes Rápidos | Componentes de interface baseados na VM Glimmer do Ember |
| **Vite + TS** | `vite`, `typescript` | Bundler & Dev Server | Template Vanilla TS com Three.js e Cannon-es pré-configurados |

#### 3. Bibliotecas de Interface, DOM, Dados & 3D
| Tecnologia | Pacote npm Principal | Categoria | Recursos Integrados |
| :--- | :--- | :--- | :--- |
| **Bootstrap** | `bootstrap`, `@popperjs/core` | Componentes UI & Grid | Sistema de grid responsivo e componentes JS interativos |
| **jQuery** | `jquery` | Manipulação de DOM | Seletores simplificados, eventos, animações e chamadas AJAX |
| **D3.js** | `d3` | Visualização de Dados | Manipulação de SVG/Canvas orientada a dados e gráficos |
| **Underscore.js** | `underscore` | Programação Funcional | Operações de alto desempenho sobre arrays, coleções e objetos |
| **Lodash** | `lodash` | Biblioteca Utilitária | Funções utilitárias avançadas para estruturas de dados |
| **Three.js** | `three` | Computação Gráfica 3D | Renderização WebGL com câmeras, malhas, luzes e sombras |
| **Cannon-es** | `cannon-es` | Motor de Física 3D | Simulação de corpos rígidos e colisões físicas para web |

#### 4. Ambientes de Empacotamento Desktop & Ferramental
| Tecnologia | Pacote / Ferramenta | Categoria | Finalidade |
| :--- | :--- | :--- | :--- |
| **Electron** | `electron` | Desktop Multiplataforma | Janela nativa sem necessidade de navegador aberto |
| **Electron Builder** | `electron-builder` | Empacotador Windows | Geração de executáveis `.exe` e instaladores NSIS |
| **PyInstaller** | `pyinstaller` | Compilador Python | Compilação do app Tkinter clássico em `ManagerNodeJs.exe` |
| **Gerenciadores** | `npm`, `pnpm`, `yarn`, `bun` | Gerenciamento de Pacotes | Seleção dinâmica de gerenciador para install/build/dev |

---

### Ambiente 1: Aplicativo Desktop Clássico em Python

Este ambiente utiliza a interface nativa Tkinter e executa diretamente no Windows sem janelas de console.

#### Requisitos
- Python 3 com Tkinter instalado.
- Node.js e gerenciador de pacotes (`npm`, `pnpm`, `yarn` ou `bun`) no `PATH`.

#### Executar no Windows
Dê dois cliques em `app.pyw` ou execute pelo terminal:
```powershell
python main.py
```
*(ou `python app.py`)*

#### Compilar para Executável Windows (.exe) via PyInstaller
Para gerar o arquivo executável nativo `ManagerNodeJs.exe`:
```powershell
pip install pyinstaller
pyinstaller --clean --onefile --windowed --add-data ManagerNodeJs app.pyw
```
Ou utilizando a especificação do projeto:
```powershell
pyinstaller --clean ManagerNodeJs.spec
```
O executável compilado será salvo na pasta `dist/`.

---

### Ambiente 2: Servidor Web Full-Stack e Desktop Electron (Node.js + React)

Este ambiente oferece interface gráfica moderna com streaming de console em tempo real, suporte multilíngue (Português, Inglês, Russo, Chinês e Hindi), inspeção de dependências com categorização no ecossistema e suporte a empacotamento desktop via **Electron**.

#### Requisitos
- Node.js 18+ (recomendado Node.js 20 ou 22) e npm.

#### Executar como Servidor Web
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra no navegador: `http://localhost:3000`

#### Executar como Aplicativo Desktop Moderno com Electron
Para executar a interface diretamente em uma janela nativa desktop (sem necessidade de navegador aberto):
```bash
npm run electron:dev
```

#### Compilar para Executável Windows (.exe) via Electron
Para gerar o instalador/executável Windows `.exe` moderno:
```bash
npm run electron:build
```
Os executáveis serão gerados na pasta `release/`.

---

### Funcionalidades Principais

1. **Criação Rápida de Projetos:** Cria projetos estruturados e com dependências pré-instaladas para Express, Fastify, Vue, Svelte, SolidJS, Next.js, Vite e todo o ecossistema.
2. **Inspeção de Dependências:** Análise em tempo real de versões declaradas, instaladas, compatíveis e mais recentes no registro npm, rotulando a função de cada biblioteca no ecossistema.
3. **Atualização Automática:** Atualização de dependências diretas para a versão mais recente em um clique.
4. **Build e Pré-visualização:** Detecção automática do script de build e inicialização de prévia estática ou de servidor.
5. **Servidor de Desenvolvimento Integrado:** Inicialização e encerramento com detecção de portas e links locais.
6. **Console Interativo:** Execução de comandos personalizados com streaming de saída, remoção de códigos ANSI e histórico de comandos.

---

---

## <a id="english-version"></a>English Version

Application to create, inspect, and manage Node.js ecosystem projects without opening command prompt or terminal windows.

This repository provides dual environment support: the **classic Python desktop application** and the **modern full-stack Node.js/React version with Electron support**.

---

### Integrated Node.js Ecosystem: Frameworks and Libraries

The application detects, scaffolds, inspects dependencies, and runs tasks for all of the following Node.js ecosystem technologies:

#### 1. Backend, APIs & HTTP Servers
| Technology | Primary npm Package | Category | Integrated Features |
| :--- | :--- | :--- | :--- |
| **Express.js** | `express` | REST Web Server | Route generation, middleware stack, JSON body parsing & dev server |
| **Fastify** | `fastify` | High-Throughput Server | Ultra-low overhead, schema validation and async request routing |
| **Koa.js** | `koa`, `@koa/router` | Modular Web Framework | Cascading middleware using native `async/await` |
| **Hapi.js** | `@hapi/hapi` | Enterprise Framework | Configuration-centric architecture and robust lifecycle hooks |
| **AdonisJS** | `@adonisjs/core` | Full-Stack MVC | Strongly-typed TypeScript MVC architecture with ORM support |
| **Sails.js** | `sails` | Realtime MVC Framework | Rails-inspired MVC pattern for Node.js with WebSockets |
| **Basic Node.js** | `node` runtime | Core Runtime | Clean `package.json` with customizable scripts and dev dependencies |

#### 2. Frontend, Reactive Frameworks & SSR
| Technology | Primary npm Package | Category | Integrated Features |
| :--- | :--- | :--- | :--- |
| **React** | `react`, `react-dom` | Declarative UI | Functional components, Hooks and optimized Vite builds |
| **Vue.js** | `vue`, `@vitejs/plugin-vue` | Progressive Framework | Vue 3 with Composition API and Single-File Components (`.vue`) |
| **Nuxt.js** | `nuxt` | Full-Stack SSR Framework | Universal rendering, auto-imports and SSR for Vue |
| **Svelte** | `svelte`, `@sveltejs/vite-plugin-svelte` | Reactive Compiler | Virtual-DOM-free reactivity with ultra-fast compilation |
| **SvelteKit** | `@sveltejs/kit` | Application Framework | File-based routing and hybrid rendering |
| **SolidJS** | `solid-js`, `vite-plugin-solid` | Fine-Grained Reactivity | Extreme runtime performance with JSX syntax |
| **Next.js** | `next` | React SSR Framework | App Router, Server Components and static exports (`out`) |
| **Angular** | `@angular/core` | Enterprise Platform | Modular TypeScript structure with dependency injection |
| **Alpine.js** | `alpinejs` | Lightweight Declarative UI | Reactive directives directly in HTML (`x-data`, `x-text`) |
| **Meteor.js** | `meteor-node-stubs` | Realtime Platform | Real-time data synchronization and rapid prototyping |
| **Ember.js** | `ember-source`, `ember-cli` | Convention Framework | Stable enterprise architecture for complex applications |
| **Aurelia** | `aurelia`, `aurelia-framework` | Web Standards Framework | Powerful two-way data-binding and clean decoupled architecture |
| **Glimmer.js** | `@glimmer/component` | Lightweight UI Components | Fast UI components built on Ember's Glimmer VM |
| **Vite + TS** | `vite`, `typescript` | Bundler & Dev Server | Vanilla TS template preconfigured with Three.js and Cannon-es |

#### 3. UI, DOM, Data Visualization & 3D Graphics
| Technology | Primary npm Package | Category | Integrated Features |
| :--- | :--- | :--- | :--- |
| **Bootstrap** | `bootstrap`, `@popperjs/core` | UI Components & Grid | Responsive grid layout and interactive JS components |
| **jQuery** | `jquery` | DOM Manipulation | Simplified element selection, events, animations and AJAX |
| **D3.js** | `d3` | Data Visualization | Data-driven document manipulation with interactive SVG/Canvas charts |
| **Underscore.js** | `underscore` | Functional Programming | High-performance utilities for arrays, objects and collections |
| **Lodash** | `lodash` | Utility Library | Advanced data structure manipulation and functional helpers |
| **Three.js** | `three` | 3D Graphics | WebGL rendering with cameras, meshes, lighting and shadows |
| **Cannon-es** | `cannon-es` | 3D Physics Engine | Rigid-body simulation and collision detection for web apps |

#### 4. Desktop Packaging & Tooling
| Technology | Package / Tool | Category | Role |
| :--- | :--- | :--- | :--- |
| **Electron** | `electron` | Cross-Platform Desktop | Native desktop window without requiring an open browser |
| **Electron Builder** | `electron-builder` | Windows Packager | Generates `.exe` standalone packages and NSIS installers |
| **PyInstaller** | `pyinstaller` | Python Compiler | Compiles classic Tkinter app into `ManagerNodeJs.exe` |
| **Package Managers** | `npm`, `pnpm`, `yarn`, `bun` | Package Management | Dynamic manager resolution for installs, builds, and dev servers |

---

### Environment 1: Classic Python Desktop Application

This environment uses a native Tkinter interface and runs directly on Windows without console windows.

#### Requirements
- Python 3 with Tkinter installed.
- Node.js and package manager (`npm`, `pnpm`, `yarn`, or `bun`) available in `PATH`.

#### Running on Windows
Double-click `app.pyw` or run from the terminal:
```powershell
python main.py
```
*(or `python app.py`)*

#### Compiling to Windows Executable (.exe) via PyInstaller
To generate the native standalone `ManagerNodeJs.exe`:
```powershell
pip install pyinstaller
pyinstaller --clean --onefile --windowed --add-data ManagerNodeJs app.pyw
```
Or using the project spec file:
```powershell
pyinstaller --clean ManagerNodeJs.spec
```
The compiled executable will be located in the `dist/` directory.

---

### Environment 2: Full-Stack Web Server & Electron Desktop (Node.js + React)

This environment provides a modern web interface with real-time streaming console, multi-language support (Portuguese, English, Russian, Chinese, and Hindi), detailed dependency inspection with ecosystem role tagging, and desktop packaging via **Electron**.

#### Requirements
- Node.js 18+ (Node.js 20 or 22 recommended) and npm.

#### Running as a Web Server
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open in your browser: `http://localhost:3000`

#### Running as a Modern Desktop App with Electron
To run the interface directly in a native desktop window (no separate browser needed):
```bash
npm run electron:dev
```

#### Compiling to Windows Executable (.exe) via Electron
To build the modern Windows `.exe` installer/executable:
```bash
npm run electron:build
```
Binaries and installers will be generated in the `release/` directory.

---

### Core Features

1. **Rapid Project Scaffolding:** Create structured projects with pre-installed dependencies for Express, Fastify, Vue, Svelte, SolidJS, Next.js, Vite, and the entire ecosystem.
2. **Dependency Inspector:** Real-time analysis of declared, installed, wanted, and latest npm registry versions, with ecosystem role classification.
3. **One-Click Updates:** Automated update of direct dependencies to their latest releases.
4. **Build & Preview:** Automatic detection of framework build scripts and static/server preview launchers.
5. **Integrated Dev Server:** Start, monitor, and stop project dev servers with local link detection.
6. **Interactive Terminal:** Execute custom shell commands with live streaming output and ANSI code stripping.
