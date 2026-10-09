import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { spawn, execSync, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Track active child processes
let activeServerProcess: ChildProcess | null = null;
let activeServerUrl: string = 'http://localhost:5173/';
let activeServerMode: 'dev' | 'preview' | null = null;
let activeCustomProcess: ChildProcess | null = null;

// SSE subscribers for live terminal logs
interface Client {
  id: number;
  res: Response;
}
let sseClients: Client[] = [];
let nextClientId = 1;

function broadcastLog(line: string, channel: 'server' | 'command' | 'general' = 'general') {
  const data = JSON.stringify({ line, channel, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // client disconnected
    }
  }
}

// Clean ANSI escape codes
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

// Recent projects storage
const RECENT_FILE = path.join(__dirname, '.recent_projects.json');

function getRecentProjects(): string[] {
  try {
    if (fs.existsSync(RECENT_FILE)) {
      const data = JSON.parse(fs.readFileSync(RECENT_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        return data.filter(p => typeof p === 'string' && fs.existsSync(p));
      }
    }
  } catch (err) {
    console.error('Error reading recent projects:', err);
  }
  return [];
}

function saveRecentProject(projectPath: string): string[] {
  const recents = getRecentProjects();
  const normalized = path.resolve(projectPath);
  const updated = [normalized, ...recents.filter(p => path.resolve(p) !== normalized)].slice(0, 10);
  try {
    fs.writeFileSync(RECENT_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving recent project:', err);
  }
  return updated;
}

// Known ecosystem keywords and metadata
const ECOSYSTEM_KEYWORDS: Record<string, { label: string; category: string }> = {
  express: { label: 'Express.js', category: 'Backend Framework' },
  fastify: { label: 'Fastify', category: 'Backend Framework' },
  koa: { label: 'Koa.js', category: 'Backend Framework' },
  '@hapi/hapi': { label: 'Hapi.js', category: 'Backend Framework' },
  hapi: { label: 'Hapi.js', category: 'Backend Framework' },
  '@adonisjs/core': { label: 'AdonisJS', category: 'Backend Framework' },
  sails: { label: 'Sails.js', category: 'Backend Framework' },
  vue: { label: 'Vue.js', category: 'Frontend Framework' },
  nuxt: { label: 'Nuxt.js', category: 'Fullstack Framework' },
  svelte: { label: 'Svelte', category: 'Frontend Framework' },
  '@sveltejs/kit': { label: 'SvelteKit', category: 'Fullstack Framework' },
  'solid-js': { label: 'SolidJS', category: 'Frontend Framework' },
  alpinejs: { label: 'Alpine.js', category: 'Frontend Utility' },
  'meteor-node-stubs': { label: 'Meteor.js', category: 'Fullstack Platform' },
  'ember-source': { label: 'Ember.js', category: 'Frontend Framework' },
  'ember-cli': { label: 'Ember.js', category: 'Build Tool' },
  aurelia: { label: 'Aurelia', category: 'Frontend Framework' },
  'aurelia-framework': { label: 'Aurelia', category: 'Frontend Framework' },
  '@glimmer/component': { label: 'Glimmer.js', category: 'UI Component' },
  bootstrap: { label: 'Bootstrap', category: 'UI Library' },
  jquery: { label: 'jQuery', category: 'DOM Library' },
  d3: { label: 'D3.js', category: 'Data Visualization' },
  underscore: { label: 'Underscore.js', category: 'Utility Library' },
  lodash: { label: 'Lodash', category: 'Utility Library' },
  react: { label: 'React', category: 'Frontend UI' },
  '@angular/core': { label: 'Angular', category: 'Frontend Framework' },
  next: { label: 'Next.js', category: 'Fullstack Framework' },
  three: { label: 'Three.js', category: '3D Graphics' },
  'cannon-es': { label: 'Cannon-es', category: 'Physics Engine' },
  vite: { label: 'Vite', category: 'Build Tool' },
};

// Seed diverse Node.js ecosystem demo projects so the user can test right away
function initDemoProjects() {
  const projectsDir = path.join(__dirname, 'projects');
  if (!fs.existsSync(projectsDir)) {
    fs.mkdirSync(projectsDir, { recursive: true });
  }

  // 1. Demo Vite + TypeScript + Three.js
  const viteDemoDir = path.join(projectsDir, 'demo-vite-app');
  if (!fs.existsSync(viteDemoDir)) {
    fs.mkdirSync(viteDemoDir, { recursive: true });
    fs.mkdirSync(path.join(viteDemoDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(viteDemoDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-vite-app',
          private: true,
          version: '1.0.0',
          type: 'module',
          scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
          dependencies: { three: '^0.160.0', 'cannon-es': '^0.20.0' },
          devDependencies: { '@types/three': '^0.160.0', typescript: '^5.7.0', vite: '^6.0.0' },
        },
        null,
        2
      )
    );
    fs.writeFileSync(path.join(viteDemoDir, 'vite.config.ts'), `import { defineConfig } from 'vite';\nexport default defineConfig({});\n`);
    fs.writeFileSync(path.join(viteDemoDir, 'index.html'), `<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`);
    fs.writeFileSync(path.join(viteDemoDir, 'src/main.ts'), `console.log("Vite app initialized");\ndocument.querySelector('#app')!.innerHTML = '<h1>Vite + Three.js + Cannon-es</h1>';`);
  }

  // 2. Demo Express.js Backend API
  const expressDemoDir = path.join(projectsDir, 'demo-express-api');
  if (!fs.existsSync(expressDemoDir)) {
    fs.mkdirSync(expressDemoDir, { recursive: true });
    fs.writeFileSync(
      path.join(expressDemoDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-express-api',
          version: '1.0.0',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            dev: 'node index.js',
            build: 'echo "Express API ready (no build step)"',
            test: 'echo "Express tests passed" && exit 0',
          },
          dependencies: {
            express: '^4.21.2',
            underscore: '^1.13.7',
          },
          devDependencies: {
            '@types/node': '^22.0.0',
          },
        },
        null,
        2
      )
    );
    const expressCode = `const express = require('express');
const _ = require('underscore');
const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.json());

const items = [
  { id: 1, name: 'Servidor Express', category: 'Backend' },
  { id: 2, name: 'Fastify API', category: 'Backend' },
  { id: 3, name: 'Vue Interface', category: 'Frontend' }
];

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    framework: 'Express.js',
    grouped: _.groupBy(items, 'category'),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Express server running on http://0.0.0.0:\${PORT}\`);
});
`;
    fs.writeFileSync(path.join(expressDemoDir, 'index.js'), expressCode);
  }

  // 3. Demo Fastify Backend Service
  const fastifyDemoDir = path.join(projectsDir, 'demo-fastify-service');
  if (!fs.existsSync(fastifyDemoDir)) {
    fs.mkdirSync(fastifyDemoDir, { recursive: true });
    fs.writeFileSync(
      path.join(fastifyDemoDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-fastify-service',
          version: '1.0.0',
          main: 'server.js',
          scripts: {
            start: 'node server.js',
            dev: 'node server.js',
            build: 'echo "Fastify build check OK"',
          },
          dependencies: {
            fastify: '^5.2.0',
          },
        },
        null,
        2
      )
    );
    const fastifyCode = `const fastify = require('fastify')({ logger: true });
const PORT = process.env.PORT || 5173;

fastify.get('/', async (request, reply) => {
  return { hello: 'Fastify High-Speed Server', benchmark: 'ultra-low overhead' };
});

fastify.listen({ port: PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(\`Fastify server listening on \${address}\`);
});
`;
    fs.writeFileSync(path.join(fastifyDemoDir, 'server.js'), fastifyCode);
  }

  // 4. Demo Vue 3 + Vite Frontend
  const vueDemoDir = path.join(projectsDir, 'demo-vue-vite');
  if (!fs.existsSync(vueDemoDir)) {
    fs.mkdirSync(vueDemoDir, { recursive: true });
    fs.mkdirSync(path.join(vueDemoDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(vueDemoDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-vue-vite',
          version: '1.0.0',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
          },
          dependencies: {
            vue: '^3.5.13',
            bootstrap: '^5.3.3',
          },
          devDependencies: {
            '@vitejs/plugin-vue': '^5.2.1',
            vite: '^6.0.0',
          },
        },
        null,
        2
      )
    );
    fs.writeFileSync(
      path.join(vueDemoDir, 'index.html'),
      `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Vue.js Demo</title></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`
    );
    fs.writeFileSync(
      path.join(vueDemoDir, 'src/main.js'),
      `import { createApp } from 'vue';\nimport App from './App.vue';\ncreateApp(App).mount('#app');`
    );
    fs.writeFileSync(
      path.join(vueDemoDir, 'src/App.vue'),
      `<template><div class="container py-4"><h1>Vue.js 3 + Bootstrap</h1><p>Contador: {{ count }}</p><button @click="count++">Incrementar</button></div></template><script setup>import { ref } from 'vue'; const count = ref(0);</script>`
    );
  }

  // 5. Demo D3.js + jQuery Data Visualization
  const d3DemoDir = path.join(projectsDir, 'demo-d3-analytics');
  if (!fs.existsSync(d3DemoDir)) {
    fs.mkdirSync(d3DemoDir, { recursive: true });
    fs.mkdirSync(path.join(d3DemoDir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(d3DemoDir, 'package.json'),
      JSON.stringify(
        {
          name: 'demo-d3-analytics',
          version: '1.0.0',
          scripts: {
            dev: 'vite',
            build: 'vite build',
            preview: 'vite preview',
          },
          dependencies: {
            d3: '^7.9.0',
            jquery: '^3.7.1',
            underscore: '^1.13.7',
          },
          devDependencies: {
            vite: '^6.0.0',
          },
        },
        null,
        2
      )
    );
    fs.writeFileSync(
      path.join(d3DemoDir, 'index.html'),
      `<!DOCTYPE html><html><head><title>D3.js Analytics</title></head><body><div id="chart"></div><script type="module" src="/src/main.js"></script></body></html>`
    );
    fs.writeFileSync(
      path.join(d3DemoDir, 'src/main.js'),
      `import * as d3 from 'd3';\nimport $ from 'jquery';\nimport _ from 'underscore';\nconsole.log("D3 and jQuery loaded", d3.version, $.fn.jquery, _.VERSION);`
    );
  }

  // Seed recents
  const recents = getRecentProjects();
  if (recents.length === 0) {
    saveRecentProject(expressDemoDir);
    saveRecentProject(viteDemoDir);
    saveRecentProject(vueDemoDir);
    saveRecentProject(fastifyDemoDir);
    saveRecentProject(d3DemoDir);
  }
}

initDemoProjects();

// Comprehensive Framework and Ecosystem Detection
function detectFrameworkAndManager(projectDir: string) {
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return {
      framework: 'Desconhecido',
      frameworkCategory: 'generic' as const,
      packageManager: 'npm',
      outputDirectory: 'dist',
      staticExport: true,
      detectedEcosystem: [],
    };
  }

  let manifest: any = {};
  try {
    manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    manifest = {};
  }

  const allDeps = {
    ...(manifest.dependencies || {}),
    ...(manifest.devDependencies || {}),
  };
  const scripts = manifest.scripts || {};
  const buildScript = (scripts.build || '').toLowerCase();
  const devScript = (scripts.dev || scripts.start || '').toLowerCase();

  // Find all detected ecosystem packages
  const detectedEcosystem: string[] = [];
  for (const [depName, info] of Object.entries(ECOSYSTEM_KEYWORDS)) {
    if (allDeps[depName]) {
      detectedEcosystem.push(info.label);
    }
  }

  let framework = 'Node.js básico';
  let frameworkCategory: 'backend' | 'frontend' | 'fullstack' | 'library' | 'generic' = 'backend';
  let outputDirectory = '';
  let staticExport = true;

  // 1. Backend frameworks
  if (allDeps['fastify']) {
    framework = 'Fastify';
    frameworkCategory = 'backend';
    outputDirectory = '';
  } else if (allDeps['express']) {
    framework = 'Express.js';
    frameworkCategory = 'backend';
    outputDirectory = '';
  } else if (allDeps['koa']) {
    framework = 'Koa.js';
    frameworkCategory = 'backend';
    outputDirectory = '';
  } else if (allDeps['@hapi/hapi'] || allDeps['hapi']) {
    framework = 'Hapi.js';
    frameworkCategory = 'backend';
    outputDirectory = '';
  } else if (allDeps['@adonisjs/core']) {
    framework = 'AdonisJS';
    frameworkCategory = 'backend';
    outputDirectory = 'build';
  } else if (allDeps['sails']) {
    framework = 'Sails.js';
    frameworkCategory = 'backend';
    outputDirectory = '';
  }

  // 2. Fullstack & Frontend frameworks (override if primary app layer)
  else if (allDeps['nuxt'] || buildScript.includes('nuxt build')) {
    framework = 'Nuxt.js';
    frameworkCategory = 'fullstack';
    outputDirectory = '.output/public';
    staticExport = false;
  } else if (allDeps['next'] || buildScript.includes('next build')) {
    framework = 'Next.js';
    frameworkCategory = 'fullstack';
    outputDirectory = buildScript.includes('next export') ? 'out' : '.next';
    staticExport = outputDirectory === 'out';
  } else if (allDeps['@sveltejs/kit'] || allDeps['svelte']) {
    framework = 'Svelte';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['solid-js'] || allDeps['solid-start']) {
    framework = 'SolidJS';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['vue']) {
    framework = 'Vue.js';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['@angular/core'] || buildScript.includes('ng build')) {
    framework = 'Angular';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['ember-source'] || allDeps['ember-cli']) {
    framework = 'Ember.js';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['aurelia'] || allDeps['aurelia-framework']) {
    framework = 'Aurelia';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['alpinejs']) {
    framework = 'Alpine.js';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['meteor-node-stubs']) {
    framework = 'Meteor.js';
    frameworkCategory = 'fullstack';
    outputDirectory = 'build';
    staticExport = false;
  } else if (allDeps['@glimmer/component']) {
    framework = 'Glimmer.js';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['react'] || allDeps['react-dom']) {
    framework = 'React';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['vite'] || buildScript.includes('vite build')) {
    framework = 'Vite';
    frameworkCategory = 'frontend';
    outputDirectory = 'dist';
    staticExport = true;
  }

  // 3. Primary library projects
  else if (allDeps['d3']) {
    framework = 'D3.js';
    frameworkCategory = 'library';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['bootstrap']) {
    framework = 'Bootstrap';
    frameworkCategory = 'library';
    outputDirectory = 'dist';
    staticExport = true;
  } else if (allDeps['jquery']) {
    framework = 'jQuery';
    frameworkCategory = 'library';
    outputDirectory = '';
    staticExport = true;
  } else if (allDeps['underscore']) {
    framework = 'Underscore.js';
    frameworkCategory = 'library';
    outputDirectory = '';
    staticExport = true;
  }

  // Detect Package Manager
  let packageManager = 'npm';
  if (manifest.packageManager) {
    const declared = manifest.packageManager.split('@')[0].toLowerCase();
    if (['npm', 'yarn', 'pnpm', 'bun'].includes(declared)) {
      packageManager = declared;
    }
  } else if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (fs.existsSync(path.join(projectDir, 'bun.lockb')) || fs.existsSync(path.join(projectDir, 'bun.lock'))) {
    packageManager = 'bun';
  }

  return { framework, frameworkCategory, packageManager, outputDirectory, staticExport, detectedEcosystem };
}

// API Routes

// SSE live log streaming
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = nextClientId++;
  const client: Client = { id: clientId, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify({ line: 'Connected to console stream', channel: 'general' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// System info
app.get('/api/system-info', (_req: Request, res: Response) => {
  let npmVersion = '10.x';
  try {
    npmVersion = execSync('npm -v', { encoding: 'utf-8' }).trim();
  } catch {
    // fallback
  }

  res.json({
    nodeVersion: process.version,
    npmVersion,
    platform: process.platform,
    cwd: process.cwd(),
    arch: process.arch,
  });
});

// Recent projects
app.get('/api/projects/recent', (_req: Request, res: Response) => {
  res.json({ projects: getRecentProjects() });
});

app.post('/api/projects/recent', (req: Request, res: Response) => {
  const { path: projPath } = req.body;
  if (!projPath) {
    return res.status(400).json({ error: 'Path required' });
  }
  const updated = saveRecentProject(projPath);
  res.json({ projects: updated });
});

// Discover existing projects in directory
app.get('/api/projects/list', (_req: Request, res: Response) => {
  const projectsDir = path.join(__dirname, 'projects');
  const results: { name: string; path: string; hasPackageJson: boolean; framework?: string }[] = [];

  if (fs.existsSync(projectsDir)) {
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const full = path.join(projectsDir, entry.name);
        const hasPkg = fs.existsSync(path.join(full, 'package.json'));
        const detected = hasPkg ? detectFrameworkAndManager(full).framework : undefined;
        results.push({ name: entry.name, path: full, hasPackageJson: hasPkg, framework: detected });
      }
    }
  }
  res.json({ projects: results });
});

// Validate project folder and gather metadata
app.post('/api/projects/validate', (req: Request, res: Response) => {
  let { projectPath } = req.body;
  if (!projectPath) {
    return res.status(400).json({ error: 'Informe a pasta do projeto.' });
  }

  projectPath = path.resolve(projectPath);
  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    return res.status(404).json({ error: 'A pasta selecionada não existe.', exists: false });
  }

  const pkgPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return res.json({
      exists: true,
      hasPackageJson: false,
      path: projectPath,
      name: path.basename(projectPath),
    });
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const info = detectFrameworkAndManager(projectPath);
    saveRecentProject(projectPath);

    return res.json({
      exists: true,
      hasPackageJson: true,
      path: projectPath,
      name: manifest.name || path.basename(projectPath),
      version: manifest.version || '1.0.0',
      framework: info.framework,
      frameworkCategory: info.frameworkCategory,
      packageManager: info.packageManager,
      scripts: manifest.scripts || {},
      dependenciesCount:
        Object.keys(manifest.dependencies || {}).length + Object.keys(manifest.devDependencies || {}).length,
      detectedEcosystem: info.detectedEcosystem,
    });
  } catch (err: any) {
    return res.status(500).json({ error: `Erro ao ler package.json: ${err.message}` });
  }
});

// Create project supporting ALL requested frameworks and libraries
app.post('/api/projects/create', async (req: Request, res: Response) => {
  const { directory, projectType = 'vite', packageManager = 'npm', devPackage = '' } = req.body;

  if (!directory) {
    return res.status(400).json({ error: 'Informe a pasta do projeto.' });
  }

  const targetDir = path.resolve(directory);
  broadcastLog(`Pasta do projeto: ${targetDir}`, 'general');
  broadcastLog(`Framework/Modelo: ${projectType} | Gerenciador: ${packageManager}.`, 'general');

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      return res.status(400).json({
        error: 'A pasta não está vazia. Escolha uma pasta vazia para o novo projeto.',
      });
    }

    const safeName = path.basename(targetDir).toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    // Scaffolding based on requested ecosystem technology
    switch (projectType) {
      case 'express': {
        broadcastLog('Inicializando projeto Express.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
            dev: 'node index.js',
            build: 'echo "Express build ready"',
            test: 'echo "Express test passed" && exit 0',
          },
          dependencies: { express: '^4.21.2' },
          devDependencies: { '@types/node': '^22.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'index.js'),
          `const express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 5173;\n\napp.use(express.json());\napp.get('/', (req, res) => res.json({ message: 'Express API pronta', time: new Date() }));\n\napp.listen(PORT, '0.0.0.0', () => console.log('Express rodando na porta ' + PORT));\n`
        );
        break;
      }

      case 'fastify': {
        broadcastLog('Inicializando projeto Fastify…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          main: 'server.js',
          scripts: {
            start: 'node server.js',
            dev: 'node server.js',
            build: 'echo "Fastify build ready"',
          },
          dependencies: { fastify: '^5.2.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'server.js'),
          `const fastify = require('fastify')({ logger: true });\nconst PORT = process.env.PORT || 5173;\n\nfastify.get('/', async () => ({ status: 'Fastify OK', highThroughput: true }));\nfastify.listen({ port: PORT, host: '0.0.0.0' }, () => console.log('Fastify rodando na porta ' + PORT));\n`
        );
        break;
      }

      case 'koa': {
        broadcastLog('Inicializando projeto Koa.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          main: 'app.js',
          scripts: {
            start: 'node app.js',
            dev: 'node app.js',
            build: 'echo "Koa ready"',
          },
          dependencies: { koa: '^2.15.3', '@koa/router': '^13.1.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'app.js'),
          `const Koa = require('koa');\nconst Router = require('@koa/router');\nconst app = new Koa();\nconst router = new Router();\nconst PORT = process.env.PORT || 5173;\n\nrouter.get('/', (ctx) => { ctx.body = { message: 'Koa.js async middleware stack ready' }; });\napp.use(router.routes()).use(router.allowedMethods());\napp.listen(PORT, '0.0.0.0', () => console.log('Koa rodando na porta ' + PORT));\n`
        );
        break;
      }

      case 'hapi': {
        broadcastLog('Inicializando projeto Hapi.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          main: 'server.js',
          scripts: {
            start: 'node server.js',
            dev: 'node server.js',
            build: 'echo "Hapi ready"',
          },
          dependencies: { '@hapi/hapi': '^21.3.12' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'server.js'),
          `const Hapi = require('@hapi/hapi');\n\nconst init = async () => {\n  const server = Hapi.server({ port: process.env.PORT || 5173, host: '0.0.0.0' });\n  server.route({ method: 'GET', path: '/', handler: () => ({ hapi: 'Hapi.js Enterprise Service', ok: true }) });\n  await server.start();\n  console.log('Hapi server running on %s', server.info.uri);\n};\ninit();\n`
        );
        break;
      }

      case 'adonis': {
        broadcastLog('Inicializando projeto AdonisJS…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: {
            start: 'node server.js',
            dev: 'node server.js',
            build: 'echo "AdonisJS build ready"',
          },
          dependencies: { '@adonisjs/core': '^6.14.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'server.js'),
          `console.log("AdonisJS Service Ready");\n`
        );
        break;
      }

      case 'sails': {
        broadcastLog('Inicializando projeto Sails.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: {
            start: 'node app.js',
            dev: 'node app.js',
            build: 'echo "Sails ready"',
          },
          dependencies: { sails: '^1.5.11' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'app.js'),
          `console.log("Sails.js Realtime MVC ready");\n`
        );
        break;
      }

      case 'vue': {
        broadcastLog('Criando projeto Vue.js com Vite…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { vue: '^3.5.13' },
          devDependencies: { '@vitejs/plugin-vue': '^5.2.1', vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'vite.config.js'),
          `import { defineConfig } from 'vite';\nimport vue from '@vitejs/plugin-vue';\nexport default defineConfig({ plugins: [vue()] });\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>Vue 3 App</title></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import { createApp } from 'vue';\nimport App from './App.vue';\ncreateApp(App).mount('#app');\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/App.vue'),
          `<template><div style="font-family:sans-serif;padding:2rem;"><h1>Vue 3 + Vite</h1><p>Reatividade ativa: {{ count }}</p><button @click="count++">Incrementar</button></div></template><script setup>import { ref } from 'vue'; const count = ref(0);</script>`
        );
        break;
      }

      case 'nuxt': {
        broadcastLog('Criando projeto Nuxt.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'nuxt dev', build: 'nuxt build', start: 'node .output/server/index.mjs' },
          dependencies: { nuxt: '^3.15.0', vue: '^3.5.13' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'app.vue'),
          `<template><div><h1>Nuxt.js App Ready</h1><p>Full-stack SSR com Vue</p></div></template>`
        );
        fs.writeFileSync(path.join(targetDir, 'nuxt.config.ts'), `export default defineNuxtConfig({});\n`);
        break;
      }

      case 'svelte': {
        broadcastLog('Criando projeto Svelte com Vite…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { svelte: '^5.16.0' },
          devDependencies: { '@sveltejs/vite-plugin-svelte': '^5.0.3', vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'vite.config.js'),
          `import { defineConfig } from 'vite';\nimport { svelte } from '@sveltejs/vite-plugin-svelte';\nexport default defineConfig({ plugins: [svelte()] });\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>Svelte App</title></head><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import { mount } from 'svelte';\nimport App from './App.svelte';\nmount(App, { target: document.getElementById('app') });\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/App.svelte'),
          `<script>let count = $state(0);</script><main style="font-family:sans-serif;padding:2rem;"><h1>Svelte + Vite</h1><button onclick={() => count++}>Cliques: {count}</button></main>`
        );
        break;
      }

      case 'solid': {
        broadcastLog('Criando projeto SolidJS com Vite…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { 'solid-js': '^1.9.3' },
          devDependencies: { 'vite-plugin-solid': '^2.11.6', vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'vite.config.js'),
          `import { defineConfig } from 'vite';\nimport solidPlugin from 'vite-plugin-solid';\nexport default defineConfig({ plugins: [solidPlugin()] });\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>SolidJS App</title></head><body><div id="app"></div><script type="module" src="/src/index.jsx"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/index.jsx'),
          `import { render } from 'solid-js/web';\nimport App from './App';\nrender(() => <App />, document.getElementById('app'));\n`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/App.jsx'),
          `import { createSignal } from 'solid-js';\nexport default function App() {\n  const [count, setCount] = createSignal(0);\n  return <div style="font-family:sans-serif;padding:2rem;"><h1>SolidJS Reativo</h1><button onClick={() => setCount(c => c + 1)}>Contador: {count()}</button></div>;\n}\n`
        );
        break;
      }

      case 'alpine': {
        broadcastLog('Criando projeto Alpine.js com Vite…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { alpinejs: '^3.14.8' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>Alpine.js</title></head><body style="font-family:sans-serif;padding:2rem;"><div x-data="{ count: 0, open: false }"><h1>Alpine.js Declarativo</h1><button @click="count++">Contador: <span x-text="count"></span></button><button @click="open = !open">Alternar Detalhes</button><div x-show="open" style="margin-top:1rem;color:#6366f1;">Detalhes exibidos pelo Alpine!</div></div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import Alpine from 'alpinejs';\nwindow.Alpine = Alpine;\nAlpine.start();\n`
        );
        break;
      }

      case 'bootstrap': {
        broadcastLog('Criando projeto com Bootstrap 5…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { bootstrap: '^5.3.3', '@popperjs/core': '^2.11.8' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>Bootstrap Demo</title><link rel="stylesheet" href="node_modules/bootstrap/dist/css/bootstrap.min.css"></head><body><div class="container py-5"><div class="card p-4 shadow-sm"><h2>Bootstrap 5 no Node.js</h2><button class="btn btn-primary mt-2">Botão Bootstrap</button></div></div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import 'bootstrap/dist/js/bootstrap.bundle.min.js';\nconsole.log('Bootstrap interativo inicializado');\n`
        );
        break;
      }

      case 'jquery': {
        broadcastLog('Criando projeto jQuery…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { jquery: '^3.7.1' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>jQuery Demo</title></head><body style="font-family:sans-serif;padding:2rem;"><h1 id="title">jQuery no ecossistema Node.js</h1><button id="btn">Animar e Alterar</button><div id="box" style="margin-top:1rem;padding:1rem;background:#e2e8f0;">Caixa de teste</div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import $ from 'jquery';\n$('#btn').on('click', () => { $('#box').text('Texto atualizado com jQuery v' + $.fn.jquery).css('background', '#a7f3d0'); });\n`
        );
        break;
      }

      case 'd3': {
        broadcastLog('Criando projeto D3.js para visualização de dados…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { d3: '^7.9.0' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>D3.js Visualization</title></head><body style="font-family:sans-serif;padding:2rem;"><h1>Visualização D3.js</h1><div id="chart"></div><script type="module" src="/src/main.js"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.js'),
          `import * as d3 from 'd3';\nconst data = [30, 86, 168, 281, 303, 365];\nconst svg = d3.select('#chart').append('svg').attr('width', 400).attr('height', 150);\nsvg.selectAll('rect').data(data).enter().append('rect').attr('x', (d, i) => i * 60).attr('y', d => 150 - d / 3).attr('width', 50).attr('height', d => d / 3).attr('fill', '#4f46e5');\n`
        );
        break;
      }

      case 'underscore': {
        broadcastLog('Criando projeto Underscore.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          main: 'index.js',
          scripts: { start: 'node index.js', dev: 'node index.js' },
          dependencies: { underscore: '^1.13.7' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(
          path.join(targetDir, 'index.js'),
          `const _ = require('underscore');\nconst numbers = [10, 5, 100, 2, 1000];\nconsole.log('Underscore.js Max:', _.max(numbers));\nconsole.log('Underscore.js Shuffled:', _.shuffle(numbers));\n`
        );
        break;
      }

      case 'meteor': {
        broadcastLog('Criando projeto Meteor.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { start: 'node server.js', dev: 'node server.js' },
          dependencies: { 'meteor-node-stubs': '^1.2.9' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.writeFileSync(path.join(targetDir, 'server.js'), `console.log("Meteor.js service initialized");\n`);
        break;
      }

      case 'ember': {
        broadcastLog('Criando projeto Ember.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { build: 'echo "Ember build ready"', dev: 'echo "Ember dev ready"' },
          dependencies: { 'ember-source': '^5.12.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        break;
      }

      case 'aurelia': {
        broadcastLog('Criando projeto Aurelia…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { aurelia: '^2.0.0' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        break;
      }

      case 'glimmer': {
        broadcastLog('Criando projeto Glimmer.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { '@glimmer/component': '^1.1.2' },
          devDependencies: { vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        break;
      }

      case 'react': {
        broadcastLog('Criando projeto React com Vite…', 'general');
        const pkgJson = {
          name: safeName,
          version: '1.0.0',
          scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
          dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
          devDependencies: { '@vitejs/plugin-react': '^4.3.4', vite: '^6.0.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'index.html'),
          `<!DOCTYPE html><html><head><title>React App</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
        );
        fs.writeFileSync(
          path.join(targetDir, 'src/main.jsx'),
          `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nReactDOM.createRoot(document.getElementById('root')).render(<h1>React App Pronto</h1>);\n`
        );
        break;
      }

      case 'next': {
        broadcastLog('Criando projeto Next.js…', 'general');
        const pkgJson = {
          name: safeName,
          version: '0.1.0',
          private: true,
          scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
          dependencies: { next: '^14.2.0', react: '^18.3.0', 'react-dom': '^18.3.0' },
        };
        fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
        fs.mkdirSync(path.join(targetDir, 'pages'), { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'pages/index.js'),
          `export default function Home() { return <h1>Next.js Project Ready</h1>; }\n`
        );
        break;
      }

      default: {
        // 'vite' or 'node'
        if (projectType === 'vite') {
          broadcastLog('Criando o projeto Vite vanilla-ts…', 'general');
          const pkgJson = {
            name: safeName,
            private: true,
            version: '0.0.0',
            type: 'module',
            scripts: { dev: 'vite', build: 'tsc && vite build', preview: 'vite preview' },
            dependencies: { three: '^0.160.0', 'cannon-es': '^0.20.0' },
            devDependencies: { '@types/three': '^0.160.0', typescript: '^5.7.0', vite: '^6.0.0' },
          };
          fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
          fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });
          fs.writeFileSync(
            path.join(targetDir, 'vite.config.ts'),
            `import { defineConfig } from 'vite';\nexport default defineConfig({});\n`
          );
          fs.writeFileSync(
            path.join(targetDir, 'index.html'),
            `<!DOCTYPE html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`
          );
          fs.writeFileSync(
            path.join(targetDir, 'src/main.ts'),
            `import * as THREE from 'three';\nconsole.log('Scene:', THREE.REVISION);\ndocument.querySelector('#app')!.innerHTML = '<h1>Vite + Three.js + Cannon-es</h1>';\n`
          );
        } else {
          // Node.js basic
          broadcastLog('Inicializando projeto Node.js…', 'general');
          const pkgJson: any = {
            name: safeName,
            version: '1.0.0',
            main: 'index.js',
            scripts: { start: 'node index.js', dev: 'node index.js', test: 'echo "Tests passed" && exit 0' },
            dependencies: {},
            devDependencies: {},
          };
          if (devPackage) {
            pkgJson.devDependencies[devPackage.split('@')[0]] = devPackage.includes('@')
              ? devPackage.split('@')[1]
              : '^1.0.0';
          }
          fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
          fs.writeFileSync(path.join(targetDir, 'index.js'), `console.log("Hello Node.js!");\n`);
        }
      }
    }

    // Install dependencies using selected package manager
    broadcastLog(`Instalando dependências com ${packageManager}…`, 'general');
    broadcastLog(`$ ${packageManager} install`, 'general');
    try {
      execSync(`${packageManager} install`, { cwd: targetDir, stdio: 'pipe' });
    } catch {
      // If pnpm/yarn/bun not installed globally, fallback to npm
      if (packageManager !== 'npm') {
        broadcastLog(`Aviso: ${packageManager} não disponível no PATH, usando npm…`, 'general');
        execSync('npm install', { cwd: targetDir, stdio: 'pipe' });
      }
    }

    broadcastLog('Projeto criado e dependências configuradas com sucesso!', 'general');
    saveRecentProject(targetDir);
    res.json({ success: true, path: targetDir });
  } catch (err: any) {
    broadcastLog(`Erro ao criar projeto: ${err.message}`, 'general');
    res.status(500).json({ error: err.message });
  }
});

// Inspect dependencies with full ecosystem mapping
app.post('/api/projects/dependencies/check', async (req: Request, res: Response) => {
  const { directory } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  const targetDir = path.resolve(directory);
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return res.status(404).json({ error: `Não encontrei package.json em ${targetDir}.` });
  }

  broadcastLog('$ npm list --depth=0 --json', 'general');
  try {
    const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    let installedData: any = {};
    try {
      const out = execSync('npm list --depth=0 --json', {
        cwd: targetDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      installedData = JSON.parse(out);
    } catch (err: any) {
      if (err.stdout) {
        try {
          installedData = JSON.parse(err.stdout);
        } catch {
          // ignore
        }
      }
    }

    broadcastLog('$ npm outdated --json', 'general');
    let outdatedData: any = {};
    try {
      const out = execSync('npm outdated --json', {
        cwd: targetDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      outdatedData = JSON.parse(out);
    } catch (err: any) {
      if (err.stdout) {
        try {
          outdatedData = JSON.parse(err.stdout);
        } catch {
          // ignore
        }
      }
    }

    const installed = installedData.dependencies || {};
    const dependencies: any[] = [];

    const sections: [string, string][] = [
      ['dependencies', 'Produção'],
      ['devDependencies', 'Desenvolvimento'],
    ];

    for (const [section, kind] of sections) {
      const declaredPackages = manifest[section] || {};
      for (const [name, declared] of Object.entries(declaredPackages)) {
        const pkgInfo = installed[name] || {};
        const version = pkgInfo.version || '—';
        const updateInfo = outdatedData[name] || {};
        const latest = updateInfo.latest || '—';
        const wanted = updateInfo.wanted || version;

        let status = 'Atualizada';
        if (pkgInfo.missing || version === '—') {
          status = 'Não instalada';
        } else if (pkgInfo.invalid) {
          status = 'Versão fora da faixa';
        } else if (latest !== '—' && version !== latest) {
          if (String(wanted) === String(version)) {
            status = 'Nova versão fora da faixa';
          } else {
            status = 'Atualização compatível';
          }
        }

        const category = ECOSYSTEM_KEYWORDS[name]?.category;

        dependencies.push({
          name,
          kind,
          declared: String(declared),
          installed: version,
          wanted: String(wanted),
          latest: String(latest),
          status,
          category,
        });
      }
    }

    broadcastLog(`Dependências inspecionadas: ${dependencies.length}.`, 'general');
    res.json({ dependencies });
  } catch (err: any) {
    broadcastLog(`Erro: ${err.message}`, 'general');
    res.status(500).json({ error: err.message });
  }
});

// Update dependencies
app.post('/api/projects/dependencies/update', async (req: Request, res: Response) => {
  const { directory } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  const targetDir = path.resolve(directory);
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return res.status(404).json({ error: 'package.json não encontrado.' });

  try {
    broadcastLog('Atualizando dependências…', 'general');
    broadcastLog('$ npm update', 'general');
    const out = execSync('npm update', { cwd: targetDir, encoding: 'utf-8' });
    if (out) broadcastLog(stripAnsi(out), 'general');
    broadcastLog('Atualização das dependências concluída.', 'general');
    res.json({ success: true });
  } catch (err: any) {
    broadcastLog(`Erro na atualização: ${err.message}`, 'general');
    res.status(500).json({ error: err.message });
  }
});

// Verify missing dependencies in project directory (checks node_modules)
app.post('/api/projects/dependencies/verify-missing', (req: Request, res: Response) => {
  const { directory } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  const targetDir = path.resolve(directory);
  const pkgPath = path.join(targetDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return res.status(404).json({ error: 'package.json não encontrado.' });

  try {
    const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const dependencies = manifest.dependencies || {};
    const devDependencies = manifest.devDependencies || {};
    const nodeModulesDir = path.join(targetDir, 'node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesDir);

    const missingDetails: { name: string; kind: string; declared: string }[] = [];
    const installedDetails: { name: string; kind: string; declared: string; version?: string }[] = [];
    const missing: string[] = [];

    const sections: [string, Record<string, string>, string][] = [
      ['dependencies', dependencies, 'Produção'],
      ['devDependencies', devDependencies, 'Desenvolvimento'],
    ];

    for (const [, packages, kind] of sections) {
      for (const [pkgName, declaredVersion] of Object.entries(packages)) {
        let isPresent = false;
        let installedVersion: string | undefined;

        if (hasNodeModules) {
          const directPath = path.join(nodeModulesDir, pkgName);
          if (fs.existsSync(directPath)) {
            isPresent = true;
            try {
              const subPkgJson = path.join(directPath, 'package.json');
              if (fs.existsSync(subPkgJson)) {
                const subManifest = JSON.parse(fs.readFileSync(subPkgJson, 'utf-8'));
                installedVersion = subManifest.version;
              }
            } catch {
              // ignore
            }
          }
        }

        if (!isPresent) {
          missing.push(pkgName);
          missingDetails.push({ name: pkgName, kind, declared: String(declaredVersion) });
        } else {
          installedDetails.push({
            name: pkgName,
            kind,
            declared: String(declaredVersion),
            version: installedVersion || 'instalada',
          });
        }
      }
    }

    const totalDeclared = Object.keys(dependencies).length + Object.keys(devDependencies).length;
    const allInstalled = missing.length === 0;

    if (!hasNodeModules && totalDeclared > 0) {
      broadcastLog(`Aviso: A pasta node_modules não existe em ${targetDir}. Nenhuma das ${totalDeclared} bibliotecas declaradas está instalada.`, 'general');
    } else if (allInstalled) {
      broadcastLog(`Diagnóstico de integridade: Todas as ${totalDeclared} bibliotecas declaradas estão presentes e instaladas em node_modules.`, 'general');
    } else {
      broadcastLog(`Atenção: ${missing.length} biblioteca(s) ausente(s) em node_modules: ${missing.join(', ')}.`, 'general');
    }

    res.json({
      allInstalled,
      hasNodeModules,
      nodeModulesPath: nodeModulesDir,
      totalDeclared,
      installedCount: totalDeclared - missing.length,
      missingCount: missing.length,
      missing,
      missingDetails,
      installedDetails,
    });
  } catch (err: any) {
    broadcastLog(`Erro ao verificar integridade: ${err.message}`, 'general');
    res.status(500).json({ error: err.message });
  }
});

// Install all or selected missing dependencies (runs npm install or package manager)
app.post('/api/projects/dependencies/install-missing', (req: Request, res: Response) => {
  const { directory, packageNames } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  const targetDir = path.resolve(directory);
  const info = detectFrameworkAndManager(targetDir);

  let pm = info.packageManager;
  try {
    execSync(`${pm} -v`, { stdio: 'ignore' });
  } catch {
    if (pm !== 'npm') {
      broadcastLog(`Aviso: ${pm} não encontrado no sistema. Usando npm como fallback.`, 'general');
      pm = 'npm';
    }
  }

  let args: string[];
  if (Array.isArray(packageNames) && packageNames.length > 0) {
    broadcastLog(`Baixando e instalando pacotes selecionados com ${pm}: ${packageNames.join(', ')}…`, 'general');
    if (pm === 'yarn' || pm === 'pnpm' || pm === 'bun') {
      args = ['add', ...packageNames];
    } else {
      args = ['install', ...packageNames];
    }
  } else {
    broadcastLog(`Baixando e instalando todas as dependências com ${pm}…`, 'general');
    args = ['install'];
  }

  const installCmd = `${pm} ${args.join(' ')}`;
  broadcastLog(`$ ${installCmd}`, 'general');

  const proc = spawn(pm, args, {
    cwd: targetDir,
    shell: true,
  });

  proc.stdout.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.stderr.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.on('close', (code) => {
    if (code === 0) {
      broadcastLog('Bibliotecas instaladas com sucesso no projeto!', 'general');
      res.json({ success: true, message: 'Dependências instaladas com sucesso.' });
    } else {
      broadcastLog(`Falha ao instalar dependências (código ${code}).`, 'general');
      res.status(500).json({ error: `Instalação falhou com código ${code}` });
    }
  });
});

// Install any specific custom package into the project
app.post('/api/projects/dependencies/install-package', (req: Request, res: Response) => {
  const { directory, packageName, isDev = false, version } = req.body;
  if (!directory || !packageName) {
    return res.status(400).json({ error: 'Informe a pasta e o nome do pacote.' });
  }

  let pkg = String(packageName).trim();
  if (version && String(version).trim() && !pkg.includes('@', 1)) {
    pkg = `${pkg}@${String(version).trim()}`;
  }

  const targetDir = path.resolve(directory);
  const info = detectFrameworkAndManager(targetDir);

  let pm = info.packageManager;
  try {
    execSync(`${pm} -v`, { stdio: 'ignore' });
  } catch {
    if (pm !== 'npm') {
      broadcastLog(`Aviso: ${pm} não encontrado no sistema. Usando npm como fallback.`, 'general');
      pm = 'npm';
    }
  }

  broadcastLog(`Baixando e instalando "${pkg}" como dependência de ${isDev ? 'desenvolvimento (--save-dev)' : 'produção (--save)'} via ${pm}…`, 'general');

  let args: string[];
  if (pm === 'yarn') {
    args = ['add', isDev ? '-D' : '', pkg].filter(Boolean);
  } else if (pm === 'pnpm') {
    args = ['add', isDev ? '-D' : '', pkg].filter(Boolean);
  } else if (pm === 'bun') {
    args = ['add', isDev ? '-d' : '', pkg].filter(Boolean);
  } else {
    // npm
    args = ['install', isDev ? '--save-dev' : '--save', pkg];
  }

  const fullCmd = `${pm} ${args.join(' ')}`;
  broadcastLog(`$ ${fullCmd}`, 'general');

  const proc = spawn(pm, args, {
    cwd: targetDir,
    shell: true,
  });

  proc.stdout.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.stderr.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.on('close', (code) => {
    if (code === 0) {
      broadcastLog(`Biblioteca "${pkg}" baixada e instalada com sucesso!`, 'general');
      res.json({ success: true, packageName: pkg });
    } else {
      broadcastLog(`Falha na instalação de "${pkg}" (código de saída ${code}).`, 'general');
      res.status(500).json({ error: `Instalação de ${pkg} falhou com código ${code}` });
    }
  });
});

// Production build
app.post('/api/projects/build', (req: Request, res: Response) => {
  const { directory } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  const targetDir = path.resolve(directory);
  const info = detectFrameworkAndManager(targetDir);

  broadcastLog(`Framework detectado: ${info.framework}.`, 'general');
  broadcastLog(`Gerenciador detectado: ${info.packageManager}.`, 'general');
  broadcastLog(`Executando build de produção com ${info.packageManager}…`, 'general');

  const pkgPath = path.join(targetDir, 'package.json');
  let hasBuildScript = false;
  if (fs.existsSync(pkgPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      hasBuildScript = Boolean(manifest.scripts?.build);
    } catch {
      // ignore
    }
  }

  const buildCmd = hasBuildScript
    ? info.packageManager === 'yarn'
      ? 'yarn build'
      : `${info.packageManager} run build`
    : 'echo "Nenhum script build especificado. Execução direta pronta."';

  broadcastLog(`$ ${buildCmd}`, 'general');

  const proc = spawn(buildCmd, [], {
    cwd: targetDir,
    shell: true,
  });

  proc.stdout.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.stderr.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'general'));
  });

  proc.on('close', (code) => {
    if (code === 0) {
      const outFolder = info.outputDirectory ? path.join(targetDir, info.outputDirectory) : targetDir;
      broadcastLog(`Build concluído. Pasta de saída: ${outFolder}`, 'general');
      res.json({ success: true, outputDirectory: info.outputDirectory, framework: info.framework });
    } else {
      broadcastLog(`O build falhou (código ${code}).`, 'general');
      res.status(500).json({ error: `Build falhou com código ${code}` });
    }
  });
});

// Start dev server or build preview
app.post('/api/projects/server/start', (req: Request, res: Response) => {
  const { directory, mode = 'dev' } = req.body;
  if (!directory) return res.status(400).json({ error: 'Informe a pasta do projeto.' });

  if (activeServerProcess) {
    return res.status(400).json({ error: 'Pare o servidor antes de iniciar outra operação.' });
  }

  const targetDir = path.resolve(directory);
  const info = detectFrameworkAndManager(targetDir);
  activeServerMode = mode;

  const pkgPath = path.join(targetDir, 'package.json');
  let scripts: any = {};
  if (fs.existsSync(pkgPath)) {
    try {
      scripts = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).scripts || {};
    } catch {
      // ignore
    }
  }

  let cmd: string;
  let args: string[];

  if (mode === 'preview') {
    broadcastLog(`Iniciando prévia com ${info.outputDirectory || 'dist'}…`, 'server');
    cmd = 'npx';
    args = ['--yes', 'serve', '-s', info.outputDirectory || 'dist', '-p', '5173'];
    activeServerUrl = 'http://localhost:5173/';
  } else {
    // Determine command based on framework & available scripts
    if (scripts.dev) {
      cmd = info.packageManager;
      args = info.packageManager === 'yarn' ? ['dev'] : ['run', 'dev'];
    } else if (scripts.start) {
      cmd = info.packageManager;
      args = info.packageManager === 'yarn' ? ['start'] : ['run', 'start'];
    } else if (fs.existsSync(path.join(targetDir, 'server.js'))) {
      cmd = 'node';
      args = ['server.js'];
    } else if (fs.existsSync(path.join(targetDir, 'index.js'))) {
      cmd = 'node';
      args = ['index.js'];
    } else {
      cmd = 'node';
      args = ['index.js'];
    }
    broadcastLog(`Iniciando projeto ${info.framework}…`, 'server');
    activeServerUrl = 'http://localhost:5173/';
  }

  broadcastLog(`$ ${cmd} ${args.join(' ')}`, 'server');

  activeServerProcess = spawn(cmd, args, {
    cwd: targetDir,
    shell: true,
  });

  activeServerProcess.stdout?.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => {
      broadcastLog(line, 'server');
      const match = line.match(/https?:\/\/[^\s]+/);
      if (match) {
        activeServerUrl = match[0];
      }
    });
  });

  activeServerProcess.stderr?.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'server'));
  });

  activeServerProcess.on('close', (code) => {
    broadcastLog(`Servidor encerrado com código ${code}.`, 'server');
    activeServerProcess = null;
    activeServerMode = null;
  });

  res.json({
    success: true,
    mode,
    url: activeServerUrl,
  });
});

// Stop server
app.post('/api/projects/server/stop', (_req: Request, res: Response) => {
  if (!activeServerProcess) {
    return res.json({ success: true, message: 'Nenhum servidor em execução.' });
  }

  broadcastLog('Parando servidor…', 'server');
  try {
    activeServerProcess.kill('SIGTERM');
    activeServerProcess = null;
    activeServerMode = null;
    broadcastLog('Servidor/prévia parado.', 'server');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Custom command run
app.post('/api/projects/command/run', (req: Request, res: Response) => {
  const { directory, command } = req.body;
  if (!directory || !command) {
    return res.status(400).json({ error: 'Informe a pasta e o comando.' });
  }

  if (activeCustomProcess) {
    return res.status(400).json({ error: 'Já existe um comando em execução.' });
  }

  const targetDir = path.resolve(directory);
  broadcastLog(`$ ${command}`, 'command');

  activeCustomProcess = spawn(command, [], {
    cwd: targetDir,
    shell: true,
  });

  activeCustomProcess.stdout?.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'command'));
  });

  activeCustomProcess.stderr?.on('data', (chunk) => {
    const text = stripAnsi(chunk.toString());
    text.split('\n').filter(Boolean).forEach((line) => broadcastLog(line, 'command'));
  });

  activeCustomProcess.on('close', (code) => {
    broadcastLog(`Comando finalizado com código ${code}.`, 'command');
    activeCustomProcess = null;
  });

  res.json({ success: true });
});

// Stop custom command
app.post('/api/projects/command/stop', (_req: Request, res: Response) => {
  if (!activeCustomProcess) {
    return res.json({ success: true, message: 'Nenhum comando em execução.' });
  }

  broadcastLog('Parando comando…', 'command');
  try {
    activeCustomProcess.kill('SIGTERM');
    activeCustomProcess = null;
    broadcastLog('Comando encerrado.', 'command');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current server status
app.get('/api/projects/server/status', (_req: Request, res: Response) => {
  res.json({
    running: activeServerProcess !== null,
    mode: activeServerMode,
    url: activeServerUrl,
    customRunning: activeCustomProcess !== null,
  });
});

// Setup Vite development middleware or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vite Project Manager running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
