export interface PopularLibrary {
  name: string;
  category: 'api' | 'utils' | 'database' | 'security' | 'ui' | 'dev' | 'validation';
  categoryLabel: string;
  description: string;
  isDev?: boolean;
  version?: string;
}

export interface MissingCheckResult {
  allInstalled: boolean;
  hasNodeModules?: boolean;
  nodeModulesPath?: string;
  totalDeclared: number;
  installedCount?: number;
  missingCount: number;
  missing: string[];
  missingDetails: { name: string; kind: string; declared: string }[];
  installedDetails?: { name: string; kind: string; declared: string; version?: string }[];
}

export interface Dependency {
  name: string;
  kind: string; // 'Produção' | 'Desenvolvimento'
  declared: string;
  installed: string;
  wanted: string;
  latest: string;
  status: string; // 'Atualizada' | 'Atualização compatível' | 'Nova versão fora da faixa' | 'Não instalada' | 'Versão fora da faixa'
  category?: string; // e.g. 'Backend Framework', 'Frontend UI', 'Visualização de Dados', etc.
}

export interface BuildInfo {
  framework: string;
  frameworkCategory: 'backend' | 'frontend' | 'fullstack' | 'library' | 'generic';
  packageManager: string;
  outputDirectory: string;
  staticExport: boolean;
  detectedEcosystem: string[];
}

export interface ProjectInfo {
  name: string;
  path: string;
  framework?: string;
  frameworkCategory?: 'backend' | 'frontend' | 'fullstack' | 'library' | 'generic';
  packageManager?: string;
  dependenciesCount?: number;
  scripts?: Record<string, string>;
  hasPackageJson: boolean;
  detectedEcosystem?: string[];
  version?: string;
}

export interface SystemInfo {
  nodeVersion: string;
  npmVersion: string;
  platform: string;
  cwd: string;
  arch?: string;
}

export type FrameworkTemplateId =
  | 'express'
  | 'fastify'
  | 'koa'
  | 'hapi'
  | 'adonis'
  | 'sails'
  | 'vue'
  | 'nuxt'
  | 'svelte'
  | 'solid'
  | 'alpine'
  | 'meteor'
  | 'bootstrap'
  | 'ember'
  | 'aurelia'
  | 'jquery'
  | 'd3'
  | 'glimmer'
  | 'underscore'
  | 'lodash'
  | 'three'
  | 'electron'
  | 'react'
  | 'angular'
  | 'next'
  | 'vite'
  | 'node';

export interface FrameworkTemplateInfo {
  id: FrameworkTemplateId;
  name: string;
  npmPackage: string;
  category: 'backend' | 'frontend' | 'fullstack' | 'library' | 'desktop';
  description: string;
  iconName: string;
  defaultDevScript?: string;
  defaultBuildScript?: string;
  wikipediaUrl: {
    pt: string;
    en: string;
  };
  technicalOverview: {
    pt: string;
    en: string;
  };
  features: string[];
  typicalUseCases: string[];
}
