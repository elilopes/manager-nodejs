# Vite Project Manager

Aplicativo desktop em Python para criar e administrar projetos Vite, Next.js e Node.js sem exibir uma janela de Prompt de Comando.
Python desktop application for creating and managing Vite, Next.js, and Node.js projects without displaying a Command Prompt window.

O arquivo compilado como executável e pronto para uso... ManagerNodeJs.exe

Comando para compilar o script Pyhton em arquivo executável...
pyinstaller --clean --onefile --windowed --add-data ManagerNodeJs app.pyw

## Requisitos

- Python 3 com Tkinter (incluído na instalação padrão do Python para Windows).
- Node.js e npm instalados e disponíveis no `PATH` para criar projetos e gerenciar dependências.
- Para criar, iniciar ou compilar um projeto com Yarn, pnpm ou Bun, o gerenciador escolhido precisa estar disponível no `PATH`.

## Executar

No Windows, dê dois cliques em `app.pyw` para abrir sem uma janela de console. Se preferir usar um terminal, execute na pasta do aplicativo:

```powershell
python main.py
```

Os comandos iniciados pela interface rodam sem janela de console, e as mensagens são exibidas na área **Saída dos comandos**.

## Usar

1. Digite ou cole (`Ctrl+V`) o caminho de uma pasta nova, por exemplo `C:/clonesmashyroad2`, ou use **Selecionar pasta…** para escolher um projeto existente.
2. Em uma pasta nova/vazia, escolha **Modelo** e **Gerenciador** e clique em **Criar e instalar projeto**:

   - **Vite + TypeScript** cria o template `vanilla-ts` e instala `three`, `cannon-es` e `@types/three` usando o gerenciador escolhido.
   - **Next.js** executa `npx --yes create-next-app@latest . --yes --use-npm`, `pnpm create next-app@latest . --yes --use-pnpm`, `yarn create next-app@latest . --yes --use-yarn` ou `bun create next-app@latest . --yes --use-bun`, conforme a seleção. O `.` indica a pasta selecionada; `--yes` usa opções padrão sem perguntas. [Next.js CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
   - **Node.js básico** executa `npm init -y`, `pnpm init`, `yarn init -y` ou `bun init -y`, seguido pela instalação de dependências. Opcionalmente, preencha **Dependência dev opcional** para instalar um pacote como dependência de desenvolvimento (`npm install --save-dev`, `pnpm add -D`, `yarn add -D` ou `bun add -d`).

   A pasta selecionada é a raiz do projeto. Para iniciar o Next.js, clique em **Iniciar servidor de desenvolvimento**; o app executa o script de desenvolvimento do projeto no gerenciador configurado.
3. Em um projeto existente com `package.json`, use **Verificar dependências**, **Atualizar dependências**, **Build de produção** ou **Iniciar servidor de desenvolvimento**. A atualização consulta o registro npm e instala a última versão publicada das dependências diretas desatualizadas, atualizando `package.json` e incluindo dependências de desenvolvimento. Isso pode incluir uma nova versão principal.
4. **Build de produção** executa o script `build` definido no `package.json`. O app prefere o gerenciador declarado em `packageManager`; se não houver, identifica-o pelo arquivo de lock. Assim, executa `npm run build`, `yarn build`, `pnpm run build` ou `bun run build`, conforme o projeto. A saída mostra o framework identificado e a pasta gerada: Vite usa `dist`, Create React App usa `build`, Next.js usa `.next` por padrão e exportação estática do Next.js usa `out` por padrão. O Next permite personalizar a pasta por `distDir`.
5. Depois do build, **Pré-visualizar build** serve as saídas estáticas com `npx --yes serve -s dist`, `build` ou `out`. Para Next.js com servidor dinâmico, inicia o script `start` do projeto para servir o build; é necessário que esse script esteja configurado no `package.json`. A prévia e o servidor de desenvolvimento aparecem no console integrado e podem ser encerrados pelo botão **Parar servidor**.
6. Use **Abrir no navegador** ou **Copiar link local** para abrir/copiar o endereço detectado. O servidor de desenvolvimento Vite normalmente usa `http://localhost:5173/`; as prévias usam a porta informada pelo próprio servidor, geralmente `3000`.
7. **Abrir pasta do Node.js** abre no Explorador de Arquivos a localização do `node.exe` encontrada no `PATH`.
8. Em **Comandos personalizados**, digite um comando e clique em **Executar** (ou pressione Enter). Ele roda na pasta selecionada; **Parar comando** encerra um comando que ainda está rodando. A saída aparece no console integrado.
9. Arraste a divisória entre a tabela e a saída para redimensionar o console. **Ocultar/Expandir** recolhe ou mostra a tabela de dependências. Projetos usados ficam na lista de recentes para abrir depois.

O botão de build requer que o projeto tenha um script `build` no `package.json`. Para uma saída personalizada, configure o framework para gerar `dist`, `build` ou `out`; frameworks e configurações diferentes mostram o caminho relatado pelo próprio build no console.

Os comandos personalizados são executados pelo shell do sistema dentro da pasta do projeto. Digite somente comandos que você pretende executar.
Os dez projetos recentes são armazenados em `ViteProjectManager/recent_projects.json` na pasta de configurações do usuário.

A seleção de pasta usa o seletor de diretórios do sistema. A criação da pasta é feita diretamente pelo aplicativo.

## Organização MVC

- `models/project_model.py`: regras de negócio, validação do projeto, leitura de dependências, detecção do gerenciador/framework e execução dos comandos de build e servidor.
- `views/main_view.py`: janela Tkinter, apresentação dos dados e coleta das ações do usuário.
- `controllers/project_controller.py`: conecta os eventos da tela às operações do model e atualiza a View usando uma fila assíncrona.
- `main.py`: cria e conecta Model, View e Controller.

`app.py` permanece como ponto de entrada compatível (`python app.py`), e `app.pyw` abre o mesmo aplicativo sem console no Windows.
