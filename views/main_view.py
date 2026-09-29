"""Interface Tkinter do gerenciador de projetos Vite."""

from __future__ import annotations

import re
import tkinter as tk
from collections.abc import Callable
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

from models.project_model import Dependency


APP_TITLE = "Vite Project Manager"

LANGUAGE_OPTIONS = {
    "English": "en",
    "Português": "pt",
    "Русский": "ru",
    "中文": "zh",
    "हिन्दी": "hi",
}

TRANSLATIONS = {
    "en": {
        "Idioma": "Language",
        "Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.": "Create Vite, Next.js, or Node.js projects without opening a terminal.",
        "Pasta do projeto": "Project folder",
        "Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.": "Enter a new folder to create a project or choose an existing folder to manage it.",
        "Selecionar pasta…": "Choose folder…",
        "Projetos recentes": "Recent projects",
        "Abrir recente": "Open recent",
        "Novo projeto": "New project",
        "Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.": "Choose a template and package manager. Commands and messages appear in the built-in console.",
        "Modelo": "Template",
        "Node.js básico": "Basic Node.js",
        "Gerenciador": "Package manager",
        "Dependência dev opcional (Node.js)": "Optional dev dependency (Node.js)",
        "Criar e instalar projeto": "Create and install project",
        "Abrir pasta do Node.js": "Open Node.js folder",
        "Projeto selecionado": "Selected project",
        "Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.": "Check dependencies, build for production, or start the selected project's server.",
        "Verificar dependências": "Check dependencies",
        "Atualizar dependências": "Update dependencies",
        "Build de produção": "Production build",
        "Pré-visualizar build": "Preview build",
        "Iniciar servidor de desenvolvimento": "Start development server",
        "Parar servidor": "Stop server",
        "Parar prévia": "Stop preview",
        "Abrir no navegador": "Open in browser",
        "Copiar link local": "Copy local link",
        "Comandos personalizados": "Custom commands",
        "Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.": "Runs the command in the selected folder and shows its output below, without opening a terminal window.",
        "Executar": "Run",
        "Parar comando": "Stop command",
        "Bibliotecas e dependências": "Libraries and dependencies",
        "Ocultar": "Hide",
        "Expandir": "Expand",
        "Versões declaradas, instaladas e disponíveis.": "Declared, installed, and available versions.",
        "Arraste a divisória para ajustar o espaço da tabela e do console.": "Drag the divider to resize the table and console.",
        "Saída dos comandos": "Command output",
        "Limpar": "Clear",
        "Selecionar a pasta do projeto": "Choose the project folder",
        "Pacote": "Package",
        "Tipo": "Type",
        "Declarada": "Declared",
        "Instalada": "Installed",
        "Compatível": "Wanted",
        "Última": "Latest",
        "Estado": "Status",
        "Produção": "Production",
        "Desenvolvimento": "Development",
        "Não instalada": "Not installed",
        "Versão fora da faixa": "Version outside range",
        "Nova versão fora da faixa": "New version outside range",
        "Atualização compatível": "Compatible update",
        "Atualizada": "Up to date",
        "Pronto": "Ready",
        "Projeto aberto": "Project opened",
        "Verificando dependências…": "Checking dependencies…",
        "Atualizando dependências…": "Updating dependencies…",
        "Compilando build de produção…": "Building for production…",
        "Criando projeto Vite…": "Creating Vite project…",
        "Criando projeto Next.js…": "Creating Next.js project…",
        "Inicializando projeto Node.js…": "Initializing Node.js project…",
        "Criando projeto…": "Creating project…",
        "Executando comando…": "Running command…",
        "Iniciando servidor…": "Starting server…",
        "Iniciando prévia de produção…": "Starting production preview…",
        "Prévia de produção em execução": "Production preview running",
        "Servidor em execução": "Server running",
        "Servidor/prévia parado": "Server/preview stopped",
        "Parando servidor…": "Stopping server…",
        "Comando concluído": "Command completed",
        "Comando finalizado com erro": "Command finished with an error",
        "Falha": "Failed",
        "Verificação concluída": "Check complete",
        "Projeto pronto": "Project ready",
        "Build concluído": "Build complete",
        "Atualização concluída": "Update complete",
        "A lista de projetos recentes está vazia.": "The recent projects list is empty.",
        "Pare o servidor antes de iniciar outra operação.": "Stop the server before starting another operation.",
        "Pare o servidor antes de executar outro comando nesta pasta.": "Stop the server before running another command in this folder.",
        "Digite um comando para executar.": "Enter a command to run.",
        "A pasta selecionada ainda não existe.": "The selected folder does not exist yet.",
        "Inicie o servidor ou a prévia antes de abrir o link.": "Start the server or preview before opening the link.",
    },
    "ru": {
        "Idioma": "Язык",
        "Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.": "Создавайте проекты Vite, Next.js или Node.js без открытия терминала.",
        "Pasta do projeto": "Папка проекта",
        "Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.": "Укажите новую папку для проекта или выберите существующую для управления.",
        "Selecionar pasta…": "Выбрать папку…",
        "Projetos recentes": "Недавние проекты",
        "Abrir recente": "Открыть недавний",
        "Novo projeto": "Новый проект",
        "Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.": "Выберите шаблон и менеджер пакетов. Команды и сообщения отображаются во встроенной консоли.",
        "Modelo": "Шаблон",
        "Node.js básico": "Базовый Node.js",
        "Gerenciador": "Менеджер пакетов",
        "Dependência dev opcional (Node.js)": "Дополнительная dev-зависимость (Node.js)",
        "Criar e instalar projeto": "Создать проект и установить пакеты",
        "Abrir pasta do Node.js": "Открыть папку Node.js",
        "Projeto selecionado": "Выбранный проект",
        "Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.": "Проверьте зависимости, соберите проект или запустите сервер выбранного проекта.",
        "Verificar dependências": "Проверить зависимости",
        "Atualizar dependências": "Обновить зависимости",
        "Build de produção": "Сборка для production",
        "Pré-visualizar build": "Предпросмотр сборки",
        "Iniciar servidor de desenvolvimento": "Запустить сервер разработки",
        "Parar servidor": "Остановить сервер",
        "Parar prévia": "Остановить предпросмотр",
        "Abrir no navegador": "Открыть в браузере",
        "Copiar link local": "Скопировать локальную ссылку",
        "Comandos personalizados": "Пользовательские команды",
        "Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.": "Выполняет команду в выбранной папке и показывает вывод ниже без открытия окна терминала.",
        "Executar": "Запустить",
        "Parar comando": "Остановить команду",
        "Bibliotecas e dependências": "Библиотеки и зависимости",
        "Ocultar": "Скрыть",
        "Expandir": "Развернуть",
        "Versões declaradas, instaladas e disponíveis.": "Указанные, установленные и доступные версии.",
        "Arraste a divisória para ajustar o espaço da tabela e do console.": "Перетащите разделитель, чтобы изменить размер таблицы и консоли.",
        "Saída dos comandos": "Вывод команд",
        "Limpar": "Очистить",
        "Selecionar a pasta do projeto": "Выбрать папку проекта",
        "Pacote": "Пакет",
        "Tipo": "Тип",
        "Declarada": "Указана",
        "Instalada": "Установлена",
        "Compatível": "Совместимая",
        "Última": "Последняя",
        "Estado": "Статус",
        "Produção": "Production",
        "Desenvolvimento": "Разработка",
        "Não instalada": "Не установлена",
        "Versão fora da faixa": "Версия вне диапазона",
        "Nova versão fora da faixa": "Новая версия вне диапазона",
        "Atualização compatível": "Совместимое обновление",
        "Atualizada": "Обновлена",
        "Pronto": "Готово",
        "Projeto aberto": "Проект открыт",
        "Verificando dependências…": "Проверка зависимостей…",
        "Atualizando dependências…": "Обновление зависимостей…",
        "Compilando build de produção…": "Сборка для production…",
        "Criando projeto Vite…": "Создание проекта Vite…",
        "Criando projeto Next.js…": "Создание проекта Next.js…",
        "Inicializando projeto Node.js…": "Инициализация проекта Node.js…",
        "Criando projeto…": "Создание проекта…",
        "Executando comando…": "Выполнение команды…",
        "Iniciando servidor…": "Запуск сервера…",
        "Iniciando prévia de produção…": "Запуск предпросмотра production…",
        "Prévia de produção em execução": "Предпросмотр production запущен",
        "Servidor em execução": "Сервер запущен",
        "Servidor/prévia parado": "Сервер/предпросмотр остановлен",
        "Parando servidor…": "Остановка сервера…",
        "Comando concluído": "Команда выполнена",
        "Comando finalizado com erro": "Команда завершилась с ошибкой",
        "Falha": "Ошибка",
        "Verificação concluída": "Проверка завершена",
        "Projeto pronto": "Проект готов",
        "Build concluído": "Сборка завершена",
        "Atualização concluída": "Обновление завершено",
        "A lista de projetos recentes está vazia.": "Список недавних проектов пуст.",
        "Pare o servidor antes de iniciar outra operação.": "Остановите сервер перед запуском другой операции.",
        "Pare o servidor antes de executar outro comando nesta pasta.": "Остановите сервер перед запуском другой команды в этой папке.",
        "Digite um comando para executar.": "Введите команду для запуска.",
        "A pasta selecionada ainda não existe.": "Выбранная папка ещё не существует.",
        "Inicie o servidor ou a prévia antes de abrir o link.": "Запустите сервер или предпросмотр, прежде чем открывать ссылку.",
    },
    "zh": {
        "Idioma": "语言",
        "Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.": "无需打开终端即可创建 Vite、Next.js 或 Node.js 项目。",
        "Pasta do projeto": "项目文件夹",
        "Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.": "输入新文件夹以创建项目，或选择现有文件夹进行管理。",
        "Selecionar pasta…": "选择文件夹…",
        "Projetos recentes": "最近的项目",
        "Abrir recente": "打开最近项目",
        "Novo projeto": "新建项目",
        "Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.": "选择模板和包管理器。命令和消息会显示在内置控制台中。",
        "Modelo": "模板",
        "Node.js básico": "基础 Node.js",
        "Gerenciador": "包管理器",
        "Dependência dev opcional (Node.js)": "可选开发依赖（Node.js）",
        "Criar e instalar projeto": "创建并安装项目",
        "Abrir pasta do Node.js": "打开 Node.js 文件夹",
        "Projeto selecionado": "所选项目",
        "Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.": "检查依赖项、构建生产版本或启动所选项目的服务器。",
        "Verificar dependências": "检查依赖项",
        "Atualizar dependências": "更新依赖项",
        "Build de produção": "生产构建",
        "Pré-visualizar build": "预览构建",
        "Iniciar servidor de desenvolvimento": "启动开发服务器",
        "Parar servidor": "停止服务器",
        "Parar prévia": "停止预览",
        "Abrir no navegador": "在浏览器中打开",
        "Copiar link local": "复制本地链接",
        "Comandos personalizados": "自定义命令",
        "Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.": "在所选文件夹中运行输入的命令，并在下方显示输出，无需打开终端窗口。",
        "Executar": "运行",
        "Parar comando": "停止命令",
        "Bibliotecas e dependências": "库和依赖项",
        "Ocultar": "隐藏",
        "Expandir": "展开",
        "Versões declaradas, instaladas e disponíveis.": "声明、已安装和可用的版本。",
        "Arraste a divisória para ajustar o espaço da tabela e do console.": "拖动分隔线以调整表格和控制台的大小。",
        "Saída dos comandos": "命令输出",
        "Limpar": "清除",
        "Selecionar a pasta do projeto": "选择项目文件夹",
        "Pacote": "包",
        "Tipo": "类型",
        "Declarada": "声明版本",
        "Instalada": "已安装",
        "Compatível": "兼容版本",
        "Última": "最新版本",
        "Estado": "状态",
        "Produção": "生产环境",
        "Desenvolvimento": "开发环境",
        "Não instalada": "未安装",
        "Versão fora da faixa": "版本超出范围",
        "Nova versão fora da faixa": "新版本超出范围",
        "Atualização compatível": "有兼容更新",
        "Atualizada": "已是最新",
        "Pronto": "就绪",
        "Projeto aberto": "项目已打开",
        "Verificando dependências…": "正在检查依赖项…",
        "Atualizando dependências…": "正在更新依赖项…",
        "Compilando build de produção…": "正在构建生产版本…",
        "Criando projeto Vite…": "正在创建 Vite 项目…",
        "Criando projeto Next.js…": "正在创建 Next.js 项目…",
        "Inicializando projeto Node.js…": "正在初始化 Node.js 项目…",
        "Criando projeto…": "正在创建项目…",
        "Executando comando…": "正在运行命令…",
        "Iniciando servidor…": "正在启动服务器…",
        "Iniciando prévia de produção…": "正在启动生产预览…",
        "Prévia de produção em execução": "生产预览运行中",
        "Servidor em execução": "服务器运行中",
        "Servidor/prévia parado": "服务器/预览已停止",
        "Parando servidor…": "正在停止服务器…",
        "Comando concluído": "命令已完成",
        "Comando finalizado com erro": "命令执行出错",
        "Falha": "失败",
        "Verificação concluída": "检查完成",
        "Projeto pronto": "项目已就绪",
        "Build concluído": "构建完成",
        "Atualização concluída": "更新完成",
        "A lista de projetos recentes está vazia.": "最近项目列表为空。",
        "Pare o servidor antes de iniciar outra operação.": "开始其他操作前请先停止服务器。",
        "Pare o servidor antes de executar outro comando nesta pasta.": "在此文件夹中运行其他命令前，请先停止服务器。",
        "Digite um comando para executar.": "请输入要运行的命令。",
        "A pasta selecionada ainda não existe.": "所选文件夹尚不存在。",
        "Inicie o servidor ou a prévia antes de abrir o link.": "请先启动服务器或预览，再打开链接。",
    },
    "hi": {
        "Idioma": "भाषा",
        "Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.": "टर्मिनल खोले बिना Vite, Next.js या Node.js प्रोजेक्ट बनाएँ।",
        "Pasta do projeto": "प्रोजेक्ट फ़ोल्डर",
        "Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.": "प्रोजेक्ट बनाने के लिए नया फ़ोल्डर दर्ज करें या प्रबंधित करने के लिए मौजूदा फ़ोल्डर चुनें।",
        "Selecionar pasta…": "फ़ोल्डर चुनें…",
        "Projetos recentes": "हाल के प्रोजेक्ट",
        "Abrir recente": "हाल का खोलें",
        "Novo projeto": "नया प्रोजेक्ट",
        "Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.": "टेम्पलेट और पैकेज मैनेजर चुनें। कमांड और संदेश इनबिल्ट कंसोल में दिखेंगे।",
        "Modelo": "टेम्पलेट",
        "Node.js básico": "बेसिक Node.js",
        "Gerenciador": "पैकेज मैनेजर",
        "Dependência dev opcional (Node.js)": "वैकल्पिक dev डिपेंडेंसी (Node.js)",
        "Criar e instalar projeto": "प्रोजेक्ट बनाएँ और इंस्टॉल करें",
        "Abrir pasta do Node.js": "Node.js फ़ोल्डर खोलें",
        "Projeto selecionado": "चुना गया प्रोजेक्ट",
        "Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.": "डिपेंडेंसी जाँचें, प्रोडक्शन बिल्ड बनाएँ या चुने गए प्रोजेक्ट का सर्वर शुरू करें।",
        "Verificar dependências": "डिपेंडेंसी जाँचें",
        "Atualizar dependências": "डिपेंडेंसी अपडेट करें",
        "Build de produção": "प्रोडक्शन बिल्ड",
        "Pré-visualizar build": "बिल्ड का पूर्वावलोकन",
        "Iniciar servidor de desenvolvimento": "डेवलपमेंट सर्वर शुरू करें",
        "Parar servidor": "सर्वर रोकें",
        "Parar prévia": "पूर्वावलोकन रोकें",
        "Abrir no navegador": "ब्राउज़र में खोलें",
        "Copiar link local": "लोकल लिंक कॉपी करें",
        "Comandos personalizados": "कस्टम कमांड",
        "Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.": "चुने गए फ़ोल्डर में कमांड चलाता है और टर्मिनल विंडो खोले बिना आउटपुट नीचे दिखाता है।",
        "Executar": "चलाएँ",
        "Parar comando": "कमांड रोकें",
        "Bibliotecas e dependências": "लाइब्रेरी और डिपेंडेंसी",
        "Ocultar": "छिपाएँ",
        "Expandir": "खोलें",
        "Versões declaradas, instaladas e disponíveis.": "घोषित, इंस्टॉल और उपलब्ध संस्करण।",
        "Arraste a divisória para ajustar o espaço da tabela e do console.": "टेबल और कंसोल का आकार बदलने के लिए विभाजक खींचें।",
        "Saída dos comandos": "कमांड आउटपुट",
        "Limpar": "साफ़ करें",
        "Selecionar a pasta do projeto": "प्रोजेक्ट फ़ोल्डर चुनें",
        "Pacote": "पैकेज",
        "Tipo": "प्रकार",
        "Declarada": "घोषित",
        "Instalada": "इंस्टॉल",
        "Compatível": "अनुमत",
        "Última": "नवीनतम",
        "Estado": "स्थिति",
        "Produção": "प्रोडक्शन",
        "Desenvolvimento": "डेवलपमेंट",
        "Não instalada": "इंस्टॉल नहीं",
        "Versão fora da faixa": "संस्करण सीमा से बाहर",
        "Nova versão fora da faixa": "नया संस्करण सीमा से बाहर",
        "Atualização compatível": "संगत अपडेट उपलब्ध",
        "Atualizada": "अप-टू-डेट",
        "Pronto": "तैयार",
        "Projeto aberto": "प्रोजेक्ट खुला",
        "Verificando dependências…": "डिपेंडेंसी जाँची जा रही हैं…",
        "Atualizando dependências…": "डिपेंडेंसी अपडेट हो रही हैं…",
        "Compilando build de produção…": "प्रोडक्शन बिल्ड बन रही है…",
        "Criando projeto Vite…": "Vite प्रोजेक्ट बनाया जा रहा है…",
        "Criando projeto Next.js…": "Next.js प्रोजेक्ट बनाया जा रहा है…",
        "Inicializando projeto Node.js…": "Node.js प्रोजेक्ट शुरू किया जा रहा है…",
        "Criando projeto…": "प्रोजेक्ट बनाया जा रहा है…",
        "Executando comando…": "कमांड चल रही है…",
        "Iniciando servidor…": "सर्वर शुरू हो रहा है…",
        "Iniciando prévia de produção…": "प्रोडक्शन पूर्वावलोकन शुरू हो रहा है…",
        "Prévia de produção em execução": "प्रोडक्शन पूर्वावलोकन चल रहा है",
        "Servidor em execução": "सर्वर चल रहा है",
        "Servidor/prévia parado": "सर्वर/पूर्वावलोकन रुका हुआ है",
        "Parando servidor…": "सर्वर रुक रहा है…",
        "Comando concluído": "कमांड पूरी हुई",
        "Comando finalizado com erro": "कमांड त्रुटि के साथ समाप्त हुई",
        "Falha": "विफल",
        "Verificação concluída": "जाँच पूरी हुई",
        "Projeto pronto": "प्रोजेक्ट तैयार",
        "Build concluído": "बिल्ड पूरी हुई",
        "Atualização concluída": "अपडेट पूरा हुआ",
        "A lista de projetos recentes está vazia.": "हाल के प्रोजेक्ट की सूची खाली है।",
        "Pare o servidor antes de iniciar outra operação.": "दूसरी प्रक्रिया शुरू करने से पहले सर्वर रोकें।",
        "Pare o servidor antes de executar outro comando nesta pasta.": "इस फ़ोल्डर में दूसरी कमांड चलाने से पहले सर्वर रोकें।",
        "Digite um comando para executar.": "चलाने के लिए कमांड दर्ज करें।",
        "A pasta selecionada ainda não existe.": "चुना गया फ़ोल्डर अभी मौजूद नहीं है।",
        "Inicie o servidor ou a prévia antes de abrir o link.": "लिंक खोलने से पहले सर्वर या पूर्वावलोकन शुरू करें।",
    },
}

# Console text is translated separately from UI labels so arbitrary output from
# npm, Vite, or user commands remains untouched.
CONSOLE_EXACT_TRANSLATIONS = {
    "Selecione um projeto ou crie uma pasta nova para começar.": (
        "Select a project or create a new folder to get started.",
        "Выберите проект или создайте новую папку, чтобы начать.",
        "选择一个项目或创建新文件夹以开始。",
        "शुरू करने के लिए कोई प्रोजेक्ट चुनें या नया फ़ोल्डर बनाएँ।",
    ),
    "Criando o projeto Vite vanilla-ts…": (
        "Creating the Vite vanilla-ts project…", "Создание проекта Vite vanilla-ts…",
        "正在创建 Vite vanilla-ts 项目…", "Vite vanilla-ts प्रोजेक्ट बनाया जा रहा है…",
    ),
    "Instalando three e cannon-es…": (
        "Installing three and cannon-es…", "Установка three и cannon-es…",
        "正在安装 three 和 cannon-es…", "three और cannon-es इंस्टॉल हो रहे हैं…",
    ),
    "Instalando @types/three…": (
        "Installing @types/three…", "Установка @types/three…",
        "正在安装 @types/three…", "@types/three इंस्टॉल हो रहा है…",
    ),
    "Criando o projeto Next.js com as opções padrão, sem perguntas interativas…": (
        "Creating the Next.js project with default options and no interactive prompts…",
        "Создание проекта Next.js с параметрами по умолчанию без интерактивных вопросов…",
        "正在使用默认选项创建 Next.js 项目，不显示交互式提示…",
        "डिफ़ॉल्ट विकल्पों के साथ और इंटरैक्टिव सवालों के बिना Next.js प्रोजेक्ट बनाया जा रहा है…",
    ),
    "Criando o projeto Next.js…": (
        "Creating the Next.js project…", "Создание проекта Next.js…",
        "正在创建 Next.js 项目…", "Next.js प्रोजेक्ट बनाया जा रहा है…",
    ),
    "Inicializando o projeto Node.js…": (
        "Initializing the Node.js project…", "Инициализация проекта Node.js…",
        "正在初始化 Node.js 项目…", "Node.js प्रोजेक्ट शुरू किया जा रहा है…",
    ),
    "Preparando as dependências do projeto…": (
        "Preparing project dependencies…", "Подготовка зависимостей проекта…",
        "正在准备项目依赖项…", "प्रोजेक्ट डिपेंडेंसी तैयार की जा रही हैं…",
    ),
    "Projeto criado e dependências instaladas.": (
        "Project created and dependencies installed.", "Проект создан, зависимости установлены.",
        "项目已创建，依赖项已安装。", "प्रोजेक्ट बनाया गया और डिपेंडेंसी इंस्टॉल हो गईं।",
    ),
    "npm list informou dependências ausentes ou inválidas; veja a tabela.": (
        "npm list reported missing or invalid dependencies; see the table.",
        "npm list сообщил об отсутствующих или некорректных зависимостях; см. таблицу.",
        "npm list 报告了缺失或无效的依赖项；请查看表格。",
        "npm list ने अनुपलब्ध या अमान्य डिपेंडेंसी बताई हैं; टेबल देखें।",
    ),
    "npm outdated não retornou versões novas (ou não foi possível consultar o registro).": (
        "npm outdated returned no newer versions (or the registry could not be checked).",
        "npm outdated не нашёл новых версий (или не удалось проверить реестр).",
        "npm outdated 未返回更新版本（或无法查询注册表）。",
        "npm outdated ने नए संस्करण नहीं लौटाए (या रजिस्ट्री की जाँच नहीं हो सकी)।",
    ),
    "Todas as dependências diretas já estão na versão mais recente.": (
        "All direct dependencies are already up to date.",
        "Все прямые зависимости уже обновлены до последних версий.",
        "所有直接依赖项均已是最新版本。", "सभी डायरेक्ट डिपेंडेंसी पहले से अप-टू-डेट हैं।",
    ),
    "Instalando versões mais recentes das dependências de produção…": (
        "Installing the latest production dependency versions…",
        "Установка последних версий production-зависимостей…",
        "正在安装最新的生产依赖项版本…", "प्रोडक्शन डिपेंडेंसी के नवीनतम संस्करण इंस्टॉल हो रहे हैं…",
    ),
    "Instalando versões mais recentes das dependências de desenvolvimento…": (
        "Installing the latest development dependency versions…",
        "Установка последних версий зависимостей разработки…",
        "正在安装最新的开发依赖项版本…", "डेवलपमेंट डिपेंडेंसी के नवीनतम संस्करण इंस्टॉल हो रहे हैं…",
    ),
    "Atualização das versões mais recentes concluída.": (
        "Latest dependency versions installed.", "Установка последних версий завершена.",
        "最新依赖项版本已安装。", "डिपेंडेंसी के नवीनतम संस्करण इंस्टॉल हो गए।",
    ),
    "Solicitando parada do comando personalizado…": (
        "Requesting custom command to stop…", "Запрос остановки пользовательской команды…",
        "正在请求停止自定义命令…", "कस्टम कमांड रोकने का अनुरोध किया जा रहा है…",
    ),
    "O navegador do sistema não confirmou a abertura do link.": (
        "The system browser did not confirm that the link opened.",
        "Системный браузер не подтвердил открытие ссылки.",
        "系统浏览器未确认链接已打开。", "सिस्टम ब्राउज़र ने लिंक खुलने की पुष्टि नहीं की।",
    ),
    "Solicitando parada do servidor…": (
        "Requesting server to stop…", "Запрос остановки сервера…",
        "正在请求停止服务器…", "सर्वर रोकने का अनुरोध किया जा रहा है…",
    ),
    "npm list não conseguiu ler as dependências instaladas.": (
        "npm list could not read the installed dependencies.",
        "npm list не удалось прочитать установленные зависимости.",
        "npm list 无法读取已安装的依赖项。", "npm list इंस्टॉल की गई डिपेंडेंसी नहीं पढ़ सका।",
    ),
    "npm outdated falhou; confira a mensagem acima.": (
        "npm outdated failed; see the message above.",
        "npm outdated завершился с ошибкой; см. сообщение выше.",
        "npm outdated 执行失败；请查看上方消息。", "npm outdated विफल हुआ; ऊपर दिया संदेश देखें।",
    ),
    "Não foi possível consultar as versões no registro npm.": (
        "Could not check package versions in the npm registry.",
        "Не удалось проверить версии пакетов в реестре npm.",
        "无法查询 npm 注册表中的包版本。", "npm रजिस्ट्री में पैकेज संस्करण नहीं जाँचे जा सके।",
    ),
    "Build concluído. A pasta de saída é definida pela configuração do projeto.": (
        "Build complete. The output folder is defined by the project configuration.",
        "Сборка завершена. Папка вывода задана в конфигурации проекта.",
        "构建完成。输出文件夹由项目配置决定。", "बिल्ड पूरी हुई। आउटपुट फ़ोल्डर प्रोजेक्ट कॉन्फ़िगरेशन में तय है।",
    ),
    "Tipo de projeto desconhecido.": (
        "Unknown project type.", "Неизвестный тип проекта.", "未知的项目类型。", "अज्ञात प्रोजेक्ट प्रकार।",
    ),
    "Gerenciador de pacotes desconhecido.": (
        "Unknown package manager.", "Неизвестный менеджер пакетов.", "未知的包管理器。", "अज्ञात पैकेज मैनेजर।",
    ),
    "Informe um nome de pacote válido, como express ou @types/node@latest.": (
        "Enter a valid package name, such as express or @types/node@latest.",
        "Укажите корректное имя пакета, например express или @types/node@latest.",
        "请输入有效的包名，例如 express 或 @types/node@latest。",
        "मान्य पैकेज नाम दर्ज करें, जैसे express या @types/node@latest।",
    ),
    "O caminho escolhido existe e não é uma pasta.": (
        "The selected path exists and is not a folder.", "Выбранный путь существует и не является папкой.",
        "所选路径存在，但不是文件夹。", "चुना गया पथ मौजूद है और फ़ोल्डर नहीं है।",
    ),
    "A pasta não está vazia. Escolha uma pasta vazia para o novo projeto.": (
        "The folder is not empty. Choose an empty folder for the new project.",
        "Папка не пуста. Выберите пустую папку для нового проекта.",
        "文件夹不为空。请为新项目选择一个空文件夹。", "फ़ोल्डर खाली नहीं है। नए प्रोजेक्ट के लिए खाली फ़ोल्डर चुनें।",
    ),
    "Este projeto não define o script 'build' em package.json.": (
        "This project does not define a 'build' script in package.json.",
        "В package.json этого проекта не задан скрипт 'build'.",
        "此项目的 package.json 未定义 'build' 脚本。", "इस प्रोजेक्ट के package.json में 'build' स्क्रिप्ट नहीं है।",
    ),
    "packageManager em package.json": (
        "packageManager in package.json", "packageManager в package.json",
        "package.json 中的 packageManager", "package.json में packageManager",
    ),
    "padrão na ausência de arquivo de lock": (
        "default because no lockfile was found", "по умолчанию, так как lock-файл не найден",
        "未找到锁定文件，因此使用默认值", "लॉकफ़ाइल न मिलने पर डिफ़ॉल्ट",
    ),
    "arquivo de lock do projeto": (
        "project lockfile", "lock-файл проекта", "项目锁定文件", "प्रोजेक्ट लॉकफ़ाइल",
    ),
    "dependências de produção": (
        "production dependencies", "production-зависимости", "生产依赖项", "प्रोडक्शन डिपेंडेंसी",
    ),
    "dependências de desenvolvimento": (
        "development dependencies", "зависимости разработки", "开发依赖项", "डेवलपमेंट डिपेंडेंसी",
    ),
    "Iniciando o servidor de produção do Next.js…": (
        "Starting the Next.js production server…", "Запуск production-сервера Next.js…",
        "正在启动 Next.js 生产服务器…", "Next.js प्रोडक्शन सर्वर शुरू हो रहा है…",
    ),
    "Criando o projeto Vite vanilla-ts": (
        "Creating the Vite vanilla-ts project", "Создание проекта Vite vanilla-ts",
        "正在创建 Vite vanilla-ts 项目", "Vite vanilla-ts प्रोजेक्ट बनाया जा रहा है",
    ),
    "Instalando three e cannon-es": (
        "Installing three and cannon-es", "Установка three и cannon-es",
        "正在安装 three 和 cannon-es", "three और cannon-es इंस्टॉल हो रहे हैं",
    ),
    "Instalando @types/three": (
        "Installing @types/three", "Установка @types/three",
        "正在安装 @types/three", "@types/three इंस्टॉल हो रहा है",
    ),
    "Criando o projeto Next.js": (
        "Creating the Next.js project", "Создание проекта Next.js",
        "正在创建 Next.js 项目", "Next.js प्रोजेक्ट बनाया जा रहा है",
    ),
    "Inicializando o projeto Node.js": (
        "Initializing the Node.js project", "Инициализация проекта Node.js",
        "正在初始化 Node.js 项目", "Node.js प्रोजेक्ट शुरू किया जा रहा है",
    ),
    "Preparando as dependências do projeto": (
        "Preparing project dependencies", "Подготовка зависимостей проекта",
        "正在准备项目依赖项", "प्रोजेक्ट डिपेंडेंसी तैयार की जा रही हैं",
    ),
    "Projeto": ("Project", "Проект", "项目", "प्रोजेक्ट"),
}

CONSOLE_TEMPLATE_TRANSLATIONS = {
    "Não foi possível salvar a lista de projetos recentes: {}": (
        "Could not save the recent projects list: {}", "Не удалось сохранить список недавних проектов: {}",
        "无法保存最近项目列表：{}", "हाल के प्रोजेक्ट की सूची सेव नहीं हो सकी: {}",
    ),
    "Não foi possível salvar o projeto nos recentes: {}": (
        "Could not add the project to recent projects: {}", "Не удалось добавить проект в список недавних: {}",
        "无法将项目添加到最近项目：{}", "प्रोजेक्ट हाल के प्रोजेक्ट में नहीं जोड़ा जा सका: {}",
    ),
    "Projeto recente aberto: {}": (
        "Recent project opened: {}", "Открыт недавний проект: {}", "已打开最近项目：{}", "हाल का प्रोजेक्ट खोला गया: {}",
    ),
    "Erro: {}": ("Error: {}", "Ошибка: {}", "错误：{}", "त्रुटि: {}"),
    "Localização do Node.js aberta no Explorador: {}": (
        "Node.js location opened in File Explorer: {}", "Папка Node.js открыта в проводнике: {}",
        "已在文件资源管理器中打开 Node.js 所在位置：{}", "Node.js लोकेशन फ़ाइल एक्सप्लोरर में खोली गई: {}",
    ),
    "Comando personalizado finalizado com código {}.": (
        "Custom command finished with code {}.", "Пользовательская команда завершилась с кодом {}.",
        "自定义命令已结束，退出代码为 {}。", "कस्टम कमांड {} कोड के साथ पूरी हुई।",
    ),
    "Erro ao executar comando: {}": (
        "Error running command: {}", "Ошибка выполнения команды: {}", "运行命令时出错：{}", "कमांड चलाने में त्रुटि: {}",
    ),
    "Abrindo no navegador do sistema: {}": (
        "Opening in the system browser: {}", "Открытие в системном браузере: {}",
        "正在系统浏览器中打开：{}", "सिस्टम ब्राउज़र में खोला जा रहा है: {}",
    ),
    "Não foi possível abrir o navegador: {}": (
        "Could not open the browser: {}", "Не удалось открыть браузер: {}", "无法打开浏览器：{}", "ब्राउज़र नहीं खुल सका: {}",
    ),
    "Link copiado: {}": ("Link copied: {}", "Ссылка скопирована: {}", "链接已复制：{}", "लिंक कॉपी किया गया: {}"),
    "Não foi possível copiar o link: {}": (
        "Could not copy the link: {}", "Не удалось скопировать ссылку: {}", "无法复制链接：{}", "लिंक कॉपी नहीं हो सका: {}",
    ),
    "Link local: {}": ("Local link: {}", "Локальная ссылка: {}", "本地链接：{}", "लोकल लिंक: {}"),
    "Servidor encerrado (código {}).": (
        "Server stopped (code {}).", "Сервер остановлен (код {}).", "服务器已停止（代码 {}）。", "सर्वर {} कोड के साथ बंद हुआ।",
    ),
    "Erro ao iniciar servidor: {}": (
        "Error starting server: {}", "Ошибка запуска сервера: {}", "启动服务器时出错：{}", "सर्वर शुरू करने में त्रुटि: {}",
    ),
    "Link local detectado: {}": (
        "Local link detected: {}", "Обнаружена локальная ссылка: {}", "检测到本地链接：{}", "लोकल लिंक मिला: {}",
    ),
    "Framework detectado: {}.": (
        "Detected framework: {}.", "Обнаружен фреймворк: {}.", "检测到框架：{}。", "फ्रेमवर्क मिला: {}।",
    ),
    "Gerenciador detectado: {} ({}).": (
        "Detected package manager: {} ({}).", "Обнаружен менеджер пакетов: {} ({}).",
        "检测到包管理器：{}（{}）。", "पैकेज मैनेजर मिला: {} ({}).",
    ),
    "Executando build de produção com {}…": (
        "Running the production build with {}…", "Запуск production-сборки с помощью {}…",
        "正在使用 {} 执行生产构建…", "{} के साथ प्रोडक्शन बिल्ड चल रही है…",
    ),
    "Build concluído. Pasta de saída: {}": (
        "Build complete. Output folder: {}", "Сборка завершена. Папка с результатом: {}",
        "构建完成。输出文件夹：{}", "बिल्ड पूरी हुई। आउटपुट फ़ोल्डर: {}",
    ),
    "Comando finalizado com código {}.": (
        "Command finished with code {}.", "Команда завершилась с кодом {}.",
        "命令已结束，退出代码为 {}。", "कमांड {} कोड के साथ पूरी हुई।",
    ),
    "Pasta do projeto: {}": (
        "Project folder: {}", "Папка проекта: {}", "项目文件夹：{}", "प्रोजेक्ट फ़ोल्डर: {}",
    ),
    "Gerenciador selecionado: {}.": (
        "Selected package manager: {}.", "Выбранный менеджер пакетов: {}.",
        "所选包管理器：{}。", "चुना गया पैकेज मैनेजर: {}।",
    ),
    "Instalando {} como dependência de desenvolvimento…": (
        "Installing {} as a development dependency…", "Установка {} как зависимости разработки…",
        "正在将 {} 安装为开发依赖项…", "{} को डेवलपमेंट डिपेंडेंसी के रूप में इंस्टॉल किया जा रहा है…",
    ),
    "Instalando {} como dependência de desenvolvimento": (
        "Installing {} as a development dependency", "Установка {} как зависимости разработки",
        "正在将 {} 安装为开发依赖项", "{} को डेवलपमेंट डिपेंडेंसी के रूप में इंस्टॉल किया जा रहा है",
    ),
    "Dependências encontradas: {}.": (
        "Dependencies found: {}.", "Найдено зависимостей: {}.", "找到的依赖项：{}。", "डिपेंडेंसी मिलीं: {}।",
    ),
    "Usando {} ({}) para o servidor de desenvolvimento.": (
        "Using {} ({}) for the development server.", "Для сервера разработки используется {} ({}).",
        "开发服务器使用 {}（{}）。", "डेवलपमेंट सर्वर के लिए {} ({}) का उपयोग हो रहा है।",
    ),
    "Não encontrei package.json em {}.": (
        "Could not find package.json in {}.", "Не найден package.json в {}.", "在 {} 中找不到 package.json。", "{} में package.json नहीं मिला।",
    ),
    "A pasta de trabalho não existe: {}": (
        "The working folder does not exist: {}", "Рабочая папка не существует: {}",
        "工作文件夹不存在：{}", "वर्किंग फ़ोल्डर मौजूद नहीं है: {}",
    ),
    "O build de produção falhou (código {}).": (
        "Production build failed (code {}).", "Сборка production завершилась с ошибкой (код {}).",
        "生产构建失败（代码 {}）。", "प्रोडक्शन बिल्ड विफल हुई (कोड {})।",
    ),
    "A etapa falhou com código {}: {}.": (
        "Step failed with code {}: {}.", "Этап завершился с ошибкой (код {}): {}.",
        "步骤失败，代码 {}：{}。", "चरण {} कोड के साथ विफल हुआ: {}।",
    ),
    "{}: ausente → {}": (
        "{}: missing → {}", "{}: отсутствует → {}", "{}：缺失 → {}", "{}: अनुपलब्ध → {}",
    ),
    "Instalando versões mais recentes das {}…": (
        "Installing the latest versions of {}…", "Установка последних версий: {}…",
        "正在安装 {} 的最新版本…", "{} के नवीनतम संस्करण इंस्टॉल हो रहे हैं…",
    ),
    "A atualização das {} falhou (código {}).": (
        "Updating {} failed (code {}).", "Не удалось обновить {} (код {}).",
        "更新 {} 失败（代码 {}）。", "{} अपडेट विफल हुआ (कोड {})।",
    ),
    "npm outdated terminou com código {}.": (
        "npm outdated finished with code {}.", "npm outdated завершился с кодом {}.",
        "npm outdated 已结束，代码为 {}。", "npm outdated {} कोड के साथ समाप्त हुआ।",
    ),
    "arquivos de lock encontrados: {}": (
        "lockfiles found: {}", "найдены lock-файлы: {}", "找到锁定文件：{}", "लॉकफ़ाइल मिलीं: {}",
    ),
}

CONSOLE_TEMPLATE_PATTERNS = tuple(
    (
        re.compile(r"^" + r"(.*?)".join(re.escape(part) for part in source.split("{}")) + r"$"),
        source,
        translations,
    )
    for source, translations in CONSOLE_TEMPLATE_TRANSLATIONS.items()
)


class MainView:
    """Constrói a janela e expõe operações de apresentação ao controller."""

    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.actions: dict[str, Callable[[], None]] = {}
        self.language_code = "pt"
        self._widget_texts: dict[tk.Widget, str] = {}
        self._log_entries: list[tuple[str, str]] = []
        self._status_message = "Pronto"
        self._dependencies_data: list[Dependency] = []
        self._initial_console_split_sized = False
        self.current_server_mode: str | None = None
        self.project_path = tk.StringVar(value=str(Path.home() / "Projects" / "meu-projeto"))
        self.recent_project_text = tk.StringVar()
        self.status_text = tk.StringVar(value="Pronto")

        self.root.title(APP_TITLE)
        self.root.geometry("1080x960")
        self.root.minsize(900, 760)
        self.root.configure(bg="#10131a")
        self._configure_styles()
        self._build_interface()
        self._capture_widget_texts()
        self.write_log("Selecione um projeto ou crie uma pasta nova para começar.")
        self.root.after_idle(self._set_initial_console_size)

    def set_actions(self, **actions: Callable[[], None]) -> None:
        self.actions = actions

    def set_close_handler(self, handler: Callable[[], None]) -> None:
        self.root.protocol("WM_DELETE_WINDOW", handler)

    def schedule(self, delay_ms: int, callback: Callable[[], None]) -> None:
        self.root.after(delay_ms, callback)

    def _translate(self, text: str) -> str:
        return TRANSLATIONS.get(self.language_code, {}).get(text, text)

    def _capture_widget_texts(self) -> None:
        def capture(widget: tk.Misc) -> None:
            try:
                text = widget.cget("text")
            except tk.TclError:
                text = ""
            if isinstance(text, str) and text:
                self._widget_texts[widget] = text
            for child in widget.winfo_children():
                capture(child)

        capture(self.root)

    def _on_language_selected(self, _event=None) -> None:
        self.set_language(LANGUAGE_OPTIONS.get(self.language_text.get(), "pt"))

    def set_language(self, language_code: str) -> None:
        if language_code not in {"en", "pt", "ru", "zh", "hi"}:
            return
        selected_project_type = self.get_new_project_type()
        self.language_code = language_code
        for widget, original_text in self._widget_texts.items():
            try:
                widget.configure(text=self._translate(original_text))
            except tk.TclError:
                continue

        project_types = ("Vite + TypeScript", "Next.js", "Node.js básico")
        self.project_type_combo.configure(
            values=tuple(self._translate(label) for label in project_types)
        )
        project_type_labels = {"vite": project_types[0], "next": project_types[1], "node": project_types[2]}
        self.project_type_text.set(
            self._translate(project_type_labels.get(selected_project_type, project_types[0]))
        )
        for column, (original_label, _width) in self.dependency_heading_labels.items():
            self.dependencies.heading(column, text=self._translate(original_label))
        self.toggle_dependencies_button.configure(
            text=self._translate("Ocultar" if self.dependencies_expanded else "Expandir")
        )
        self.stop_button.configure(
            text=self._translate("Parar prévia" if self.current_server_mode == "preview" else "Parar servidor")
        )
        self.status_text.set(self._translate(self._status_message))
        self._render_dependencies()
        self._refresh_log()

    def _invoke(self, action: str) -> None:
        callback = self.actions.get(action)
        if callback:
            callback()

    def _configure_styles(self) -> None:
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TFrame", background="#10131a")
        style.configure("Card.TFrame", background="#191e29")
        style.configure("TLabel", background="#10131a", foreground="#edf1fa", font=("Segoe UI", 10))
        style.configure("Card.TLabel", background="#191e29", foreground="#edf1fa", font=("Segoe UI", 10))
        style.configure("Title.TLabel", background="#10131a", foreground="#f5f7ff", font=("Segoe UI", 23, "bold"))
        style.configure("Subtitle.TLabel", background="#10131a", foreground="#9da8bc", font=("Segoe UI", 10))
        style.configure("Section.TLabel", background="#191e29", foreground="#f3f5fb", font=("Segoe UI", 12, "bold"))
        style.configure("Muted.Card.TLabel", background="#191e29", foreground="#9da8bc", font=("Segoe UI", 9))
        style.configure("TButton", font=("Segoe UI", 10), padding=(12, 8), background="#293246", foreground="#f2f5fc", borderwidth=0)
        style.map("TButton", background=[("active", "#35435d"), ("disabled", "#202634")])
        style.configure("Accent.TButton", background="#6d5dfc", foreground="white", font=("Segoe UI", 10, "bold"))
        style.map("Accent.TButton", background=[("active", "#8174ff"), ("disabled", "#393658")])
        style.configure("Danger.TButton", background="#6d3540", foreground="#ffecef", font=("Segoe UI", 10, "bold"))
        style.map("Danger.TButton", background=[("active", "#894450"), ("disabled", "#33262b")])
        style.configure("TEntry", fieldbackground="#111620", foreground="#edf1fa", insertcolor="#edf1fa", bordercolor="#30394a", padding=9)
        style.configure("Treeview", background="#111620", fieldbackground="#111620", foreground="#e8edf7", rowheight=28, borderwidth=0, font=("Segoe UI", 9))
        style.configure("Treeview.Heading", background="#252d3c", foreground="#cbd4e5", font=("Segoe UI", 9, "bold"), relief="flat", padding=7)
        style.map("Treeview", background=[("selected", "#443c86")])

    def _build_interface(self) -> None:
        outer = ttk.Frame(self.root, padding=(26, 23, 26, 18))
        outer.pack(fill="both", expand=True)

        header = ttk.Frame(outer)
        header.pack(fill="x", pady=(0, 19))
        title_area = ttk.Frame(header)
        title_area.pack(side="left", fill="x", expand=True)
        ttk.Label(
            title_area,
            text="Crie projetos Vite, Next.js ou Node.js sem abrir um terminal.",
            style="Subtitle.TLabel",
        ).pack(anchor="w")
        self.status_badge = tk.Label(
            header, textvariable=self.status_text, bg="#20382f", fg="#8be0b5",
            font=("Segoe UI", 9, "bold"), padx=13, pady=7,
        )
        self.status_badge.pack(side="right", anchor="n", pady=5)
        language_row = ttk.Frame(header)
        language_row.pack(side="right", anchor="n", padx=(0, 12))
        ttk.Label(language_row, text="Idioma", style="Subtitle.TLabel").pack(side="left", padx=(0, 6))
        self.language_text = tk.StringVar(value="Português")
        self.language_combo = ttk.Combobox(
            language_row, textvariable=self.language_text, state="readonly",
            values=tuple(LANGUAGE_OPTIONS), width=11,
        )
        self.language_combo.pack(side="left")
        self.language_combo.bind("<<ComboboxSelected>>", self._on_language_selected)

        project_card = self._card(outer)
        project_card.pack(fill="x", pady=(0, 13))
        ttk.Label(project_card, text="Pasta do projeto", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            project_card,
            text="Digite uma nova pasta para criar o projeto ou escolha uma pasta existente para gerenciá-la.",
            style="Muted.Card.TLabel",
        ).pack(anchor="w", pady=(4, 12))
        path_row = ttk.Frame(project_card, style="Card.TFrame")
        path_row.pack(fill="x")
        self.path_entry = ttk.Entry(path_row, textvariable=self.project_path)
        self.path_entry.pack(side="left", fill="x", expand=True)
        self.path_entry.bind("<Control-v>", self._paste_project_path)
        self.path_entry.bind("<Control-V>", self._paste_project_path)
        self.browse_button = ttk.Button(path_row, text="Selecionar pasta…", command=lambda: self._invoke("browse"))
        self.browse_button.pack(side="left", padx=(9, 0))
        recent_row = ttk.Frame(project_card, style="Card.TFrame")
        recent_row.pack(fill="x", pady=(12, 0))
        ttk.Label(recent_row, text="Projetos recentes", style="Muted.Card.TLabel").pack(side="left", padx=(0, 9))
        self.recent_combo = ttk.Combobox(
            recent_row, textvariable=self.recent_project_text, state="readonly"
        )
        self.recent_combo.pack(side="left", fill="x", expand=True)
        self.open_recent_button = ttk.Button(
            recent_row, text="Abrir recente", command=lambda: self._invoke("open_recent")
        )
        self.open_recent_button.pack(side="left", padx=(9, 0))

        actions = ttk.Frame(outer)
        actions.pack(fill="x", pady=(0, 13))
        create_card = self._card(actions)
        create_card.pack(side="left", fill="both", expand=True, padx=(0, 7))
        ttk.Label(create_card, text="Novo projeto", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            create_card,
            text="Escolha o modelo e o gerenciador. Os comandos e mensagens aparecem no console integrado.",
            style="Muted.Card.TLabel", wraplength=440, justify="left",
        ).pack(anchor="w", pady=(5, 12))

        creation_options = ttk.Frame(create_card, style="Card.TFrame")
        creation_options.pack(fill="x", pady=(0, 8))
        ttk.Label(creation_options, text="Modelo", style="Muted.Card.TLabel").pack(side="left")
        self.project_type_text = tk.StringVar(value="Vite + TypeScript")
        self.project_type_combo = ttk.Combobox(
            creation_options, textvariable=self.project_type_text, state="readonly",
            values=("Vite + TypeScript", "Next.js", "Node.js básico"), width=19,
        )
        self.project_type_combo.pack(side="left", padx=(6, 12))
        self.project_type_combo.bind("<<ComboboxSelected>>", self._on_project_type_changed)
        ttk.Label(creation_options, text="Gerenciador", style="Muted.Card.TLabel").pack(side="left")
        self.package_manager_text = tk.StringVar(value="npm")
        self.package_manager_combo = ttk.Combobox(
            creation_options, textvariable=self.package_manager_text, state="readonly",
            values=("npm", "pnpm", "yarn", "bun"), width=8,
        )
        self.package_manager_combo.pack(side="left", padx=(6, 0))

        self.dev_package_text = tk.StringVar()
        self.dev_package_row = ttk.Frame(create_card, style="Card.TFrame")
        self.dev_package_row.pack(fill="x", pady=(0, 9))
        ttk.Label(
            self.dev_package_row, text="Dependência dev opcional (Node.js)",
            style="Muted.Card.TLabel",
        ).pack(side="left", padx=(0, 7))
        self.dev_package_entry = ttk.Entry(
            self.dev_package_row, textvariable=self.dev_package_text, state="disabled"
        )
        self.dev_package_entry.pack(side="left", fill="x", expand=True)

        create_actions = ttk.Frame(create_card, style="Card.TFrame")
        create_actions.pack(fill="x")
        self.create_button = ttk.Button(
            create_actions, text="Criar e instalar projeto", style="Accent.TButton",
            command=lambda: self._invoke("create"),
        )
        self.create_button.pack(side="left")
        self.open_node_button = ttk.Button(
            create_actions, text="Abrir pasta do Node.js",
            command=lambda: self._invoke("open_node_path"),
        )
        self.open_node_button.pack(side="left", padx=(8, 0))

        manage_card = self._card(actions)
        manage_card.pack(side="left", fill="both", expand=True, padx=(7, 0))
        ttk.Label(manage_card, text="Projeto selecionado", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            manage_card,
            text="Confira dependências, compile para produção ou inicie o servidor do projeto selecionado.",
            style="Muted.Card.TLabel", wraplength=440, justify="left",
        ).pack(anchor="w", pady=(5, 12))
        button_row = ttk.Frame(manage_card, style="Card.TFrame")
        button_row.pack(anchor="w")
        self.check_button = ttk.Button(button_row, text="Verificar dependências", command=lambda: self._invoke("check"))
        self.check_button.pack(side="left", padx=(0, 7))
        self.update_button = ttk.Button(
            button_row, text="Atualizar dependências",
            command=lambda: self._invoke("update"),
        )
        self.update_button.pack(side="left")
        build_row = ttk.Frame(manage_card, style="Card.TFrame")
        build_row.pack(anchor="w", pady=(7, 0))
        self.build_button = ttk.Button(
            build_row, text="Build de produção", style="Accent.TButton",
            command=lambda: self._invoke("build"),
        )
        self.build_button.pack(side="left", padx=(0, 7))
        self.preview_build_button = ttk.Button(
            build_row, text="Pré-visualizar build",
            command=lambda: self._invoke("preview_build"),
        )
        self.preview_build_button.pack(side="left")
        server_row = ttk.Frame(manage_card, style="Card.TFrame")
        server_row.pack(anchor="w", pady=(7, 0))
        self.start_button = ttk.Button(
            server_row, text="Iniciar servidor de desenvolvimento", style="Accent.TButton",
            command=lambda: self._invoke("start_server"),
        )
        self.start_button.pack(side="left", padx=(0, 7))
        self.stop_button = ttk.Button(
            server_row, text="Parar servidor", style="Danger.TButton",
            command=lambda: self._invoke("stop_server"), state="disabled",
        )
        self.stop_button.pack(side="left")
        link_row = ttk.Frame(manage_card, style="Card.TFrame")
        link_row.pack(anchor="w", pady=(7, 0))
        self.open_link_button = ttk.Button(
            link_row, text="Abrir no navegador", command=lambda: self._invoke("open_link"),
            state="disabled",
        )
        self.open_link_button.pack(side="left", padx=(0, 7))
        self.copy_link_button = ttk.Button(
            link_row, text="Copiar link local", command=lambda: self._invoke("copy_link")
        )
        self.copy_link_button.pack(side="left")

        command_card = self._card(outer)
        command_card.pack(fill="x", pady=(0, 13))
        ttk.Label(command_card, text="Comandos personalizados", style="Section.TLabel").pack(anchor="w")
        ttk.Label(
            command_card,
            text="Executa o comando digitado na pasta selecionada e mostra a saída abaixo, sem abrir uma janela de terminal.",
            style="Muted.Card.TLabel",
        ).pack(anchor="w", pady=(4, 10))
        command_row = ttk.Frame(command_card, style="Card.TFrame")
        command_row.pack(fill="x")
        self.custom_command_text = tk.StringVar()
        self.command_entry = ttk.Entry(command_row, textvariable=self.custom_command_text)
        self.command_entry.pack(side="left", fill="x", expand=True)
        self.command_entry.bind("<Return>", self._submit_custom_command)
        self.run_command_button = ttk.Button(
            command_row, text="Executar", style="Accent.TButton",
            command=lambda: self._invoke("run_command"),
        )
        self.run_command_button.pack(side="left", padx=(9, 7))
        self.stop_command_button = ttk.Button(
            command_row, text="Parar comando", style="Danger.TButton",
            command=lambda: self._invoke("stop_command"), state="disabled",
        )
        self.stop_command_button.pack(side="left")

        deps_heading = self._card(outer)
        deps_heading.pack(fill="x", pady=(0, 5))
        deps_heading_row = ttk.Frame(deps_heading, style="Card.TFrame")
        deps_heading_row.pack(fill="x")
        ttk.Label(
            deps_heading_row, text="Bibliotecas e dependências", style="Section.TLabel"
        ).pack(side="left")
        self.toggle_dependencies_button = ttk.Button(
            deps_heading_row, text="Expandir", command=self._toggle_dependencies
        )
        self.toggle_dependencies_button.pack(side="right")
        ttk.Label(
            deps_heading,
            text="Versões declaradas, instaladas e disponíveis.",
            style="Muted.Card.TLabel",
        ).pack(anchor="w", pady=(4, 0))

        self.output_panes = ttk.Panedwindow(outer, orient="vertical")
        self.output_panes.pack(fill="both", expand=True)
        self.dependencies_expanded = False
        self.dependencies_panel = self._card(self.output_panes)
        table_wrap = ttk.Frame(self.dependencies_panel, style="Card.TFrame")
        table_wrap.pack(fill="both", expand=True)
        columns = (
            "package", "kind", "declared", "installed", "wanted", "latest", "state"
        )
        self.dependencies = ttk.Treeview(table_wrap, columns=columns, show="headings", height=5)
        self.dependency_heading_labels = {
            "package": ("Pacote", 185), "kind": ("Tipo", 100), "declared": ("Declarada", 105),
            "installed": ("Instalada", 100), "wanted": ("Compatível", 105),
            "latest": ("Última", 105), "state": ("Estado", 180),
        }
        for column, (label, width) in self.dependency_heading_labels.items():
            self.dependencies.heading(column, text=self._translate(label))
            self.dependencies.column(column, width=width, minwidth=70, anchor="w")
        vertical = ttk.Scrollbar(table_wrap, orient="vertical", command=self.dependencies.yview)
        self.dependencies.configure(yscrollcommand=vertical.set)
        self.dependencies.pack(side="left", fill="both", expand=True)
        vertical.pack(side="right", fill="y")
        self.console_panel = ttk.Frame(self.output_panes)
        ttk.Label(
            self.console_panel,
            text="Arraste a divisória para ajustar o espaço da tabela e do console.",
            style="Subtitle.TLabel",
        ).pack(anchor="w", pady=(0, 5))
        self.log_card = self._card(self.console_panel)
        self.log_card.pack(fill="both", expand=True)
        log_card = self.log_card
        log_header = ttk.Frame(log_card, style="Card.TFrame")
        log_header.pack(fill="x", pady=(0, 9))
        ttk.Label(log_header, text="Saída dos comandos", style="Section.TLabel").pack(side="left")
        ttk.Button(log_header, text="Limpar", command=self._clear_log).pack(side="right")
        text_wrap = ttk.Frame(log_card, style="Card.TFrame")
        text_wrap.pack(fill="both", expand=True)
        self.log = tk.Text(
            text_wrap, height=3, wrap="word", bg="#0d1118", fg="#c5d0e2",
            insertbackground="#edf1fa", selectbackground="#443c86", relief="flat",
            font=("Consolas", 9), padx=12, pady=10, state="disabled",
        )
        log_scroll = ttk.Scrollbar(text_wrap, orient="vertical", command=self.log.yview)
        self.log.configure(yscrollcommand=log_scroll.set)
        self.log.pack(side="left", fill="both", expand=True)
        log_scroll.pack(side="right", fill="y")
        self.output_panes.add(self.console_panel, weight=3)

    def _set_initial_console_size(self) -> None:
        if not self.dependencies_expanded or self._initial_console_split_sized:
            return
        self.root.update_idletasks()
        pane_height = self.output_panes.winfo_height()
        console_height = max(175, self.console_panel.winfo_reqheight())
        if pane_height > console_height + 90:
            self.output_panes.sashpos(0, pane_height - console_height)
            self._initial_console_split_sized = True

    @staticmethod
    def _card(parent: tk.Misc) -> ttk.Frame:
        return ttk.Frame(parent, style="Card.TFrame", padding=15)

    def get_project_path(self) -> str:
        return self.project_path.get()

    def set_project_path(self, path: str) -> None:
        self.project_path.set(path)

    def get_selected_recent_project(self) -> str:
        return self.recent_project_text.get()

    def set_recent_projects(
        self, projects: list[str], *, selected: str | None = None
    ) -> None:
        self.recent_combo.configure(values=projects)
        if selected in projects:
            self.recent_project_text.set(selected)
        elif self.recent_project_text.get() in projects:
            return
        elif projects:
            self.recent_project_text.set(projects[0])
        else:
            self.recent_project_text.set("")

    def get_custom_command(self) -> str:
        return self.custom_command_text.get()

    def get_new_project_type(self) -> str:
        project_types = {
            "Vite + TypeScript": "vite",
            "Next.js": "next",
            "Node.js básico": "node",
        }
        for label, project_type in project_types.items():
            if self.project_type_text.get() == self._translate(label):
                return project_type
        return "vite"

    def get_new_project_manager(self) -> str:
        return self.package_manager_text.get().strip().lower() or "npm"

    def get_new_project_dev_package(self) -> str:
        return self.dev_package_text.get().strip()

    def _on_project_type_changed(self, _event=None) -> None:
        self.dev_package_entry.configure(
            state="normal" if self.get_new_project_type() == "node" else "disabled"
        )

    def clear_custom_command(self) -> None:
        self.custom_command_text.set("")

    def _paste_project_path(self, _event=None) -> str:
        try:
            pasted = self.root.clipboard_get().strip().strip('"')
        except tk.TclError:
            return "break"
        try:
            self.path_entry.delete("sel.first", "sel.last")
        except tk.TclError:
            pass
        self.path_entry.insert("insert", pasted)
        return "break"

    def choose_project_directory(self) -> str:
        current = self.get_project_path().strip().strip('"')
        initial = current if Path(current).is_dir() else str(Path.home())
        return filedialog.askdirectory(
            title=self._translate("Selecionar a pasta do projeto"),
            initialdir=initial, mustexist=True,
        )

    def write_log(self, message: str) -> None:
        from datetime import datetime

        timestamp = datetime.now().strftime("%H:%M:%S")
        self._log_entries.append((timestamp, message))
        self.log.configure(state="normal")
        self.log.insert("end", f"[{timestamp}] {self._translate_console_message(message)}\n")
        self.log.see("end")
        self.log.configure(state="disabled")

    def _translate_console_message(self, message: str) -> str:
        if self.language_code == "pt" or message.startswith("$ "):
            return message

        language_index = {"en": 0, "ru": 1, "zh": 2, "hi": 3}.get(self.language_code)
        if language_index is None:
            return message

        exact_translation = CONSOLE_EXACT_TRANSLATIONS.get(message)
        if exact_translation is not None:
            return exact_translation[language_index]
        ui_translation = self._translate(message)
        if ui_translation != message:
            return ui_translation

        for pattern, source_template, translations in CONSOLE_TEMPLATE_PATTERNS:
            match = pattern.fullmatch(message)
            if match:
                localized = translations[language_index]
                arguments = tuple(
                    self._translate_console_message(argument)
                    for argument in match.groups()
                )
                return localized.format(*arguments)
        return message

    def _refresh_log(self) -> None:
        first_visible, last_visible = self.log.yview()
        self.log.configure(state="normal")
        self.log.delete("1.0", "end")
        for timestamp, message in self._log_entries:
            translated = self._translate_console_message(message)
            self.log.insert("end", f"[{timestamp}] {translated}\n")
        if last_visible >= 0.99:
            self.log.see("end")
        else:
            self.log.yview_moveto(first_visible)
        self.log.configure(state="disabled")

    def show_dependencies(self, dependencies: list[Dependency]) -> None:
        self._dependencies_data = dependencies
        self._render_dependencies()

    def _render_dependencies(self) -> None:
        self.dependencies.delete(*self.dependencies.get_children())
        for dependency in self._dependencies_data:
            self.dependencies.insert(
                "", "end",
                values=(dependency.name, self._translate(dependency.kind), dependency.declared,
                        dependency.installed, dependency.wanted, dependency.latest,
                        self._translate(dependency.status)),
            )

    def _toggle_dependencies(self) -> None:
        if self.dependencies_expanded:
            self.output_panes.forget(self.dependencies_panel)
            self.dependencies_expanded = False
            self.toggle_dependencies_button.configure(text=self._translate("Expandir"))
        else:
            self.expand_dependencies()

    def expand_dependencies(self) -> None:
        if self.dependencies_expanded:
            return
        self.output_panes.insert(0, self.dependencies_panel, weight=2)
        self.dependencies_expanded = True
        self.toggle_dependencies_button.configure(text=self._translate("Ocultar"))
        if not self._initial_console_split_sized:
            self.root.after_idle(self._set_initial_console_size)

    def set_status(self, message: str, tone: str = "ready") -> None:
        colors = {
            "ready": ("#20382f", "#8be0b5"),
            "working": ("#3b3425", "#f2cb78"),
            "error": ("#452b32", "#ff9ba8"),
            "idle": ("#303746", "#bec8d8"),
        }
        background, foreground = colors.get(tone, colors["ready"])
        self._status_message = message
        self.status_text.set(self._translate(message))
        self.status_badge.configure(bg=background, fg=foreground)

    def set_controls(
        self, *, operations_enabled: bool, server_running: bool,
        custom_running: bool = False, server_mode: str | None = None,
    ) -> None:
        self.current_server_mode = server_mode
        state = "normal" if operations_enabled else "disabled"
        for button in (
            self.path_entry, self.browse_button, self.create_button,
            self.open_node_button, self.open_recent_button, self.check_button,
            self.update_button, self.build_button, self.preview_build_button,
            self.command_entry, self.run_command_button,
        ):
            button.configure(state=state)
        combo_state = "readonly" if operations_enabled else "disabled"
        self.project_type_combo.configure(state=combo_state)
        self.package_manager_combo.configure(state=combo_state)
        self.recent_combo.configure(state=combo_state)
        self.dev_package_entry.configure(
            state=state if self.get_new_project_type() == "node" else "disabled"
        )
        self.start_button.configure(state=state if not server_running else "disabled")
        self.stop_button.configure(
            text=self._translate("Parar prévia" if server_mode == "preview" else "Parar servidor")
        )
        self.stop_button.configure(state="normal" if server_running else "disabled")
        self.open_link_button.configure(state="normal" if server_running else "disabled")
        self.stop_command_button.configure(state="normal" if custom_running else "disabled")

    def show_error(self, message: str) -> None:
        messagebox.showerror(APP_TITLE, self._translate(message))

    def show_info(self, message: str) -> None:
        messagebox.showinfo(APP_TITLE, self._translate(message))

    def copy_to_clipboard(self, value: str) -> None:
        self.root.clipboard_clear()
        self.root.clipboard_append(value)
        self.root.update_idletasks()

    def _clear_log(self) -> None:
        self._log_entries.clear()
        self.log.configure(state="normal")
        self.log.delete("1.0", "end")
        self.log.configure(state="disabled")

    def _submit_custom_command(self, _event=None) -> str:
        self._invoke("run_command")
        return "break"
