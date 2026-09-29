"""Regras de negócio e integração com CLIs de projetos JavaScript/Node.js."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

from utils.ansi import strip_ansi


OutputHandler = Callable[[str], None]
CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
CREATE_NEW_PROCESS_GROUP = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)


@dataclass(frozen=True)
class Dependency:
    name: str
    kind: str
    declared: str
    installed: str
    wanted: str
    latest: str
    status: str


@dataclass(frozen=True)
class BuildInfo:
    framework: str
    package_manager: str
    output_directory: str
    static_export: bool = False


class ProjectModel:
    """Executa operações de projeto sem depender da interface gráfica."""

    def resolve_project_path(self, raw_path: str) -> Path:
        raw_path = raw_path.strip().strip('"')
        if not raw_path:
            raise ValueError("Informe a pasta do projeto.")
        return Path(raw_path).expanduser().resolve()

    def validate_project(self, directory: Path) -> None:
        if not directory.is_dir() or not (directory / "package.json").is_file():
            raise ValueError("Selecione uma pasta de projeto que contenha package.json.")

    @staticmethod
    def _recent_projects_file() -> Path:
        if os.name == "nt":
            config_root = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        elif os.environ.get("XDG_CONFIG_HOME"):
            config_root = Path(os.environ["XDG_CONFIG_HOME"])
        else:
            config_root = Path.home() / ".config"
        return config_root / "ViteProjectManager" / "recent_projects.json"

    def get_recent_projects(self) -> list[Path]:
        recent_file = self._recent_projects_file()
        try:
            stored = json.loads(recent_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []
        if not isinstance(stored, list):
            return []

        projects: list[Path] = []
        seen: set[str] = set()
        for item in stored:
            if not isinstance(item, str):
                continue
            candidate = Path(item).expanduser()
            if not candidate.is_dir() or not (candidate / "package.json").is_file():
                continue
            resolved = candidate.resolve()
            key = os.path.normcase(str(resolved))
            if key not in seen:
                seen.add(key)
                projects.append(resolved)
            if len(projects) == 10:
                break
        return projects

    def add_recent_project(self, directory: Path) -> list[Path]:
        if not directory.is_dir() or not (directory / "package.json").is_file():
            return self.get_recent_projects()
        resolved = directory.resolve()
        key = os.path.normcase(str(resolved))
        projects = [resolved]
        projects.extend(
            item for item in self.get_recent_projects()
            if os.path.normcase(str(item)) != key
        )
        projects = projects[:10]

        recent_file = self._recent_projects_file()
        recent_file.parent.mkdir(parents=True, exist_ok=True)
        temp_file = recent_file.with_suffix(".tmp")
        temp_file.write_text(
            json.dumps([str(path) for path in projects], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        os.replace(temp_file, recent_file)
        return projects

    def _find_npm(self) -> str:
        npm = shutil.which("npm.cmd") or shutil.which("npm")
        if not npm:
            raise FileNotFoundError(
                "npm não foi encontrado. Instale o Node.js e abra o programa novamente."
            )
        return npm

    @staticmethod
    def _find_executable(name: str) -> str:
        candidates = (f"{name}.cmd", f"{name}.exe", name) if os.name == "nt" else (name,)
        for candidate in candidates:
            executable = shutil.which(candidate)
            if executable:
                return executable
        raise FileNotFoundError(
            f"{name} não foi encontrado. Instale-o ou configure-o no PATH."
        )

    def open_node_in_file_explorer(self) -> Path:
        node_path = Path(self._find_executable("node")).resolve()
        if os.name == "nt":
            subprocess.Popen(
                ["explorer.exe", "/select,", str(node_path)],
                creationflags=CREATE_NO_WINDOW,
            )
        elif sys.platform == "darwin":
            subprocess.Popen(["open", "-R", str(node_path)])
        else:
            subprocess.Popen(["xdg-open", str(node_path.parent)])
        return node_path

    def _package_manager(self, directory: Path, manifest: dict | None = None) -> tuple[str, str]:
        if manifest is None:
            manifest = json.loads((directory / "package.json").read_text(encoding="utf-8"))

        declared = str(manifest.get("packageManager", "")).split("@", 1)[0].lower()
        if declared in {"npm", "yarn", "pnpm", "bun"}:
            return declared, "packageManager em package.json"

        lockfiles = {
            "npm": ("npm-shrinkwrap.json", "package-lock.json"),
            "yarn": ("yarn.lock",),
            "pnpm": ("pnpm-lock.yaml",),
            "bun": ("bun.lock", "bun.lockb"),
        }
        detected = [
            manager for manager, names in lockfiles.items()
            if any((directory / name).is_file() for name in names)
        ]
        if not detected:
            return "npm", "padrão na ausência de arquivo de lock"
        if len(detected) > 1:
            # package-lock é a escolha mais comum quando há arquivos de lock concorrentes.
            selected = "npm" if "npm" in detected else detected[0]
            return selected, "arquivos de lock encontrados: " + ", ".join(detected)
        return detected[0], "arquivo de lock do projeto"

    def _package_command(self, manager: str, args: list[str], directory: Path,
                         output: OutputHandler, *, stream_output: bool = True,
                         log_nonzero_output: bool = True,
                         log_exit_code: bool = True) -> tuple[int, list[str]]:
        command = [self._find_executable(manager), *args]
        output("$ " + subprocess.list2cmdline(command))
        kwargs: dict = {
            "cwd": str(directory), "stdout": subprocess.PIPE,
            "stderr": subprocess.STDOUT, "text": True, "encoding": "utf-8",
            "errors": "replace", "bufsize": 1,
        }
        if os.name == "nt":
            kwargs["creationflags"] = CREATE_NO_WINDOW
            kwargs["shell"] = True
            kwargs["executable"] = os.environ.get("COMSPEC", "cmd.exe")
        else:
            kwargs["start_new_session"] = True
        process = subprocess.Popen(command, **kwargs)
        captured: list[str] = []
        assert process.stdout is not None
        for raw_line in process.stdout:
            line = strip_ansi(raw_line.rstrip("\r\n"))
            captured.append(line)
            if stream_output and line:
                output(line)
        return_code = process.wait()
        if not stream_output and log_nonzero_output and return_code != 0:
            for line in captured:
                if line:
                    output(line)
        if log_exit_code:
            output(f"Comando finalizado com código {return_code}.")
        return return_code, captured

    def get_build_info(self, directory: Path) -> BuildInfo:
        self.validate_project(directory)
        manifest = json.loads((directory / "package.json").read_text(encoding="utf-8"))
        scripts = manifest.get("scripts", {}) or {}
        if not scripts.get("build"):
            raise ValueError("Este projeto não define o script 'build' em package.json.")

        dependencies = {
            **(manifest.get("dependencies", {}) or {}),
            **(manifest.get("devDependencies", {}) or {}),
        }
        build_script_source = str(scripts.get("build", ""))
        build_script = build_script_source.lower()
        if "next" in dependencies or re.search(r"\bnext\s+build\b", build_script):
            framework, output_directory = "Next.js", ".next"
            static_export = bool(re.search(r"\bnext\s+export\b", build_script))
            if static_export:
                output_directory = "out"
            for config_name in ("next.config.js", "next.config.mjs", "next.config.cjs", "next.config.ts"):
                config_path = directory / config_name
                if not config_path.is_file():
                    continue
                config = config_path.read_text(encoding="utf-8", errors="replace")
                if re.search(r"\boutput\s*:\s*['\"]export['\"]", config):
                    output_directory = "out"
                    static_export = True
                dist_match = re.search(r"\bdistDir\s*:\s*['\"]([^'\"]+)['\"]", config)
                if dist_match:
                    output_directory = dist_match.group(1)
                break
        elif "react-scripts" in dependencies or "react-scripts build" in build_script:
            framework, output_directory, static_export = "Create React App", "build", True
        elif "vite" in dependencies or re.search(r"\bvite\s+build\b", build_script):
            framework, output_directory, static_export = "Vite", "dist", True
            for config_name in ("vite.config.js", "vite.config.mjs", "vite.config.cjs", "vite.config.ts"):
                config_path = directory / config_name
                if not config_path.is_file():
                    continue
                config = config_path.read_text(encoding="utf-8", errors="replace")
                out_dir_match = re.search(r"\boutDir\s*:\s*(['\"])([^'\"]+)\1", config)
                if out_dir_match:
                    output_directory = out_dir_match.group(2)
                break
            script_out_dir = re.search(
                r"--outDir(?:=|\s+)(?:['\"])?([^\s'\"]+)", build_script_source
            )
            if script_out_dir:
                output_directory = script_out_dir.group(1)
        else:
            framework, output_directory, static_export = "Projeto", "", True

        manager, _reason = self._package_manager(directory, manifest)
        return BuildInfo(framework, manager, output_directory, static_export)

    def build_project(self, directory: Path, output: OutputHandler) -> BuildInfo:
        info = self.get_build_info(directory)
        _, reason = self._package_manager(directory)
        output(f"Framework detectado: {info.framework}.")
        output(f"Gerenciador detectado: {info.package_manager} ({reason}).")
        output(f"Executando build de produção com {info.package_manager}…")
        build_args = ["build"] if info.package_manager == "yarn" else ["run", "build"]
        code, _ = self._package_command(
            info.package_manager, build_args, directory, output
        )
        if code != 0:
            raise RuntimeError(f"O build de produção falhou (código {code}).")

        output_path = info.output_directory
        if not output_path:
            output_path = next(
                (name for name in ("dist", "build", "out", ".next")
                 if (directory / name).is_dir()),
                "",
            )
        if output_path:
            output(f"Build concluído. Pasta de saída: {directory / output_path}")
        else:
            output("Build concluído. A pasta de saída é definida pela configuração do projeto.")
        return BuildInfo(info.framework, info.package_manager, output_path, info.static_export)

    def start_build_preview(self, directory: Path, output: OutputHandler) -> subprocess.Popen[str]:
        info = self.get_build_info(directory)
        output_directory = info.output_directory
        if not output_directory:
            output_directory = next(
                (name for name in ("dist", "build", "out") if (directory / name).is_dir()),
                "",
            )
        if not output_directory or not (directory / output_directory).is_dir():
            raise FileNotFoundError(
                "A saída de produção não foi encontrada. Compile o projeto antes de iniciar a prévia."
            )

        if info.framework == "Next.js" and not info.static_export:
            manifest = json.loads((directory / "package.json").read_text(encoding="utf-8"))
            if not (manifest.get("scripts", {}) or {}).get("start"):
                raise ValueError(
                    "O Next.js não tem o script 'start' em package.json para servir o build."
                )
            output("Iniciando o servidor de produção do Next.js…")
            return self._start_package_script(directory, info.package_manager, "start", output)

        try:
            npx = self._find_executable("npx")
            command = [npx, "--yes", "serve", "-s", output_directory]
        except FileNotFoundError:
            fallback = {
                "yarn": ("yarn", "dlx"),
                "pnpm": ("pnpm", "dlx"),
                "bun": ("bunx", "--yes"),
            }.get(info.package_manager)
            if fallback is None:
                raise
            launcher = "bunx" if info.package_manager == "bun" else info.package_manager
            command = [self._find_executable(launcher), *fallback[1:], "serve", "-s", output_directory]
        output("$ " + subprocess.list2cmdline(command))
        return self._popen_hidden(command, directory, process_group=True)

    def _start_package_script(self, directory: Path, manager: str, script: str,
                              output: OutputHandler) -> subprocess.Popen[str]:
        command_args = ["run", script] if manager in {"npm", "pnpm", "bun"} else [script]
        command = [self._find_executable(manager), *command_args]
        output("$ " + subprocess.list2cmdline(command))
        return self._popen_hidden(command, directory, process_group=True)

    @staticmethod
    def _popen_hidden(command: list[str], directory: Path, *,
                      process_group: bool = False) -> subprocess.Popen[str]:
        kwargs: dict = {
            "cwd": str(directory), "stdout": subprocess.PIPE,
            "stderr": subprocess.STDOUT, "text": True, "encoding": "utf-8",
            "errors": "replace", "bufsize": 1,
        }
        if os.name == "nt":
            kwargs["creationflags"] = CREATE_NO_WINDOW | (CREATE_NEW_PROCESS_GROUP if process_group else 0)
            kwargs["shell"] = True
            kwargs["executable"] = os.environ.get("COMSPEC", "cmd.exe")
        else:
            kwargs["start_new_session"] = True
        return subprocess.Popen(command, **kwargs)

    @staticmethod
    def _parse_npm_json(lines: list[str]) -> dict:
        """Lê JSON mesmo que o npm tenha prefixado avisos no stdout."""
        text = "\n".join(lines)
        if not text.strip():
            return {}
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end < start:
            raise json.JSONDecodeError("Nenhum objeto JSON na saída do npm", text, 0)
        parsed = json.loads(text[start : end + 1])
        return parsed if isinstance(parsed, dict) else {}

    def _run_npm(
        self,
        args: list[str],
        directory: Path,
        output: OutputHandler,
        *,
        stream_output: bool = True,
        log_nonzero_output: bool = True,
        log_exit_code: bool = True,
    ) -> tuple[int, list[str]]:
        command = [self._find_npm(), *args]
        output("$ " + subprocess.list2cmdline(command))
        kwargs: dict = {
            "cwd": str(directory),
            "stdout": subprocess.PIPE,
            "stderr": subprocess.STDOUT,
            "text": True,
            "encoding": "utf-8",
            "errors": "replace",
            "bufsize": 1,
        }
        if os.name == "nt":
            kwargs["creationflags"] = CREATE_NO_WINDOW
            # npm.cmd é um shim batch; a janela do cmd.exe fica oculta.
            kwargs["shell"] = True
            kwargs["executable"] = os.environ.get("COMSPEC", "cmd.exe")
        else:
            kwargs["start_new_session"] = True

        process = subprocess.Popen(command, **kwargs)
        captured: list[str] = []
        assert process.stdout is not None
        for raw_line in process.stdout:
            line = strip_ansi(raw_line.rstrip("\r\n"))
            captured.append(line)
            if stream_output and line:
                output(line)

        return_code = process.wait()
        if not stream_output and log_nonzero_output and return_code != 0:
            for line in captured:
                if line:
                    output(line)
        if log_exit_code:
            output(f"Comando finalizado com código {return_code}.")
        return return_code, captured

    def create_project(
        self,
        directory: Path,
        output: OutputHandler,
        *,
        project_type: str = "vite",
        package_manager: str = "npm",
        dev_package: str = "",
    ) -> None:
        if project_type not in {"vite", "next", "node"}:
            raise ValueError("Tipo de projeto desconhecido.")
        if package_manager not in {"npm", "pnpm", "yarn", "bun"}:
            raise ValueError("Gerenciador de pacotes desconhecido.")
        package = dev_package.strip() if project_type == "node" else ""
        if package and not re.fullmatch(
            r"(?:@[A-Za-z0-9._-]+/)?[A-Za-z0-9][A-Za-z0-9._-]*(?:@[A-Za-z0-9.*+_-]+)?",
            package,
        ):
            raise ValueError(
                "Informe um nome de pacote válido, como express ou @types/node@latest."
            )
        if directory.exists() and not directory.is_dir():
            raise ValueError("O caminho escolhido existe e não é uma pasta.")
        directory.mkdir(parents=True, exist_ok=True)
        if any(directory.iterdir()):
            raise ValueError("A pasta não está vazia. Escolha uma pasta vazia para o novo projeto.")

        output(f"Pasta do projeto: {directory}")
        output(f"Gerenciador selecionado: {package_manager}.")

        if project_type == "vite":
            create_args = {
                "npm": ["create", "vite@latest", ".", "--", "--template", "vanilla-ts"],
                "pnpm": ["create", "vite@latest", ".", "--template", "vanilla-ts"],
                "yarn": ["create", "vite", ".", "--template", "vanilla-ts"],
                "bun": ["create", "vite", ".", "--template", "vanilla-ts"],
            }[package_manager]
            self._run_required(package_manager, create_args, directory, output,
                               "Criando o projeto Vite vanilla-ts")
            install_args = {
                "npm": ["install", "three", "cannon-es"],
                "pnpm": ["add", "three", "cannon-es"],
                "yarn": ["add", "three", "cannon-es"],
                "bun": ["add", "three", "cannon-es"],
            }[package_manager]
            self._run_required(package_manager, install_args, directory, output,
                               "Instalando three e cannon-es")
            dev_args = {
                "npm": ["install", "--save-dev", "@types/three"],
                "pnpm": ["add", "-D", "@types/three"],
                "yarn": ["add", "-D", "@types/three"],
                "bun": ["add", "-d", "@types/three"],
            }[package_manager]
            self._run_required(package_manager, dev_args, directory, output,
                               "Instalando @types/three")
        elif project_type == "next":
            output("Criando o projeto Next.js com as opções padrão, sem perguntas interativas…")
            if package_manager == "npm":
                self._run_required(
                    "npx", ["--yes", "create-next-app@latest", ".", "--yes", "--use-npm"],
                    directory, output, "Criando o projeto Next.js",
                )
            else:
                self._run_required(
                    package_manager,
                    ["create", "next-app@latest", ".", "--yes", f"--use-{package_manager}"],
                    directory, output, "Criando o projeto Next.js",
                )
        else:
            init_args = {
                "npm": ["init", "-y"],
                "pnpm": ["init"],
                "yarn": ["init", "-y"],
                "bun": ["init", "-y"],
            }[package_manager]
            self._run_required(package_manager, init_args, directory, output,
                               "Inicializando o projeto Node.js")
            if package:
                add_args = {
                    "npm": ["install", "--save-dev", package],
                    "pnpm": ["add", "-D", package],
                    "yarn": ["add", "-D", package],
                    "bun": ["add", "-d", package],
                }[package_manager]
                self._run_required(package_manager, add_args, directory, output,
                                   f"Instalando {package} como dependência de desenvolvimento")
            else:
                install_args = ["install"]
                self._run_required(package_manager, install_args, directory, output,
                                   "Preparando as dependências do projeto")

        output("Projeto criado e dependências instaladas.")

    def _run_required(self, tool: str, args: list[str], directory: Path,
                      output: OutputHandler, description: str) -> None:
        output(description + "…")
        code, _ = self._package_command(tool, args, directory, output)
        if code != 0:
            raise RuntimeError(f"A etapa falhou com código {code}: {description}.")

    def inspect_dependencies(self, directory: Path, output: OutputHandler) -> list[Dependency]:
        manifest_path = directory / "package.json"
        if not manifest_path.is_file():
            raise FileNotFoundError(f"Não encontrei package.json em {directory}.")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

        code, installed_output = self._run_npm(
            ["list", "--depth=0", "--json"], directory, output, stream_output=False
        )
        try:
            installed_data = self._parse_npm_json(installed_output)
        except json.JSONDecodeError as exc:
            if code != 0:
                raise RuntimeError("npm list não conseguiu ler as dependências instaladas.") from exc
            installed_data = {}

        outdated_code, outdated_output = self._run_npm(
            ["outdated", "--json"], directory, output,
            stream_output=False, log_nonzero_output=False, log_exit_code=False,
        )
        try:
            outdated = self._parse_npm_json(outdated_output)
        except json.JSONDecodeError as exc:
            for line in outdated_output:
                if line:
                    output(line)
            if outdated_code != 0:
                raise RuntimeError("npm outdated falhou; confira a mensagem acima.") from exc
            outdated = {}

        installed = installed_data.get("dependencies", {}) or {}
        dependencies: list[Dependency] = []
        sections = (("dependencies", "Produção"), ("devDependencies", "Desenvolvimento"))
        for section, kind in sections:
            declared_packages = manifest.get(section, {}) or {}
            for name, declared in declared_packages.items():
                package_info = installed.get(name, {}) or {}
                version = package_info.get("version", "—")
                update_info = outdated.get(name, {}) or {}
                latest = update_info.get("latest", "—")
                wanted = update_info.get("wanted", version)
                if package_info.get("missing") or version == "—":
                    status = "Não instalada"
                elif package_info.get("invalid"):
                    status = "Versão fora da faixa"
                elif latest != "—" and version != latest:
                    if str(wanted) == str(version):
                        status = "Nova versão fora da faixa"
                    else:
                        status = "Atualização compatível"
                else:
                    status = "Atualizada"
                dependencies.append(Dependency(
                    name, kind, str(declared), version, str(wanted), str(latest), status
                ))

        output(f"Dependências encontradas: {len(dependencies)}.")
        if code != 0:
            output("npm list informou dependências ausentes ou inválidas; veja a tabela.")
        if not outdated_output:
            output("npm outdated não retornou versões novas (ou não foi possível consultar o registro).")
        return dependencies

    def update_dependencies(self, directory: Path, output: OutputHandler) -> None:
        self.validate_project(directory)
        manifest = json.loads((directory / "package.json").read_text(encoding="utf-8"))
        outdated_code, outdated_output = self._run_npm(
            ["outdated", "--json"], directory, output,
            stream_output=False, log_nonzero_output=False, log_exit_code=False,
        )
        try:
            outdated = self._parse_npm_json(outdated_output)
        except json.JSONDecodeError as exc:
            for line in outdated_output:
                if line:
                    output(line)
            raise RuntimeError("Não foi possível consultar as versões no registro npm.") from exc
        if outdated_code not in (0, 1):
            raise RuntimeError(f"npm outdated terminou com código {outdated_code}.")

        production_updates: list[str] = []
        development_updates: list[str] = []
        for section, packages in (
            ("dependencies", production_updates),
            ("devDependencies", development_updates),
        ):
            for name in (manifest.get(section, {}) or {}):
                available = outdated.get(name, {}) or {}
                current = available.get("current")
                latest = available.get("latest")
                if latest and latest != current:
                    output(f"{name}: {current or 'ausente'} → {latest}")
                    packages.append(f"{name}@latest")

        if not production_updates and not development_updates:
            output("Todas as dependências diretas já estão na versão mais recente.")
            return

        steps = (
            (production_updates, ["install", "--save"], "dependências de produção"),
            (development_updates, ["install", "--save-dev"], "dependências de desenvolvimento"),
        )
        for packages, args, label in steps:
            if not packages:
                continue
            output(f"Instalando versões mais recentes das {label}…")
            code, _ = self._run_npm([*args, *packages], directory, output)
            if code != 0:
                raise RuntimeError(f"A atualização das {label} falhou (código {code}).")
        output("Atualização das versões mais recentes concluída.")

    def start_dev_server(self, directory: Path, output: OutputHandler) -> subprocess.Popen[str]:
        self.validate_project(directory)
        manifest = json.loads((directory / "package.json").read_text(encoding="utf-8"))
        manager, reason = self._package_manager(directory, manifest)
        output(f"Usando {manager} ({reason}) para o servidor de desenvolvimento.")
        return self._start_package_script(directory, manager, "dev", output)

    def start_custom_command(
        self, directory: Path, command: str
    ) -> subprocess.Popen[str]:
        if not directory.is_dir():
            raise FileNotFoundError(f"A pasta de trabalho não existe: {directory}")
        command = command.strip()
        if not command:
            raise ValueError("Digite um comando para executar.")
        kwargs: dict = {
            "cwd": str(directory),
            "stdout": subprocess.PIPE,
            "stderr": subprocess.STDOUT,
            "text": True,
            "encoding": "utf-8",
            "errors": "replace",
            "bufsize": 1,
            "shell": True,
        }
        if os.name == "nt":
            kwargs["creationflags"] = CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP
            kwargs["executable"] = os.environ.get("COMSPEC", "cmd.exe")
        else:
            kwargs["start_new_session"] = True
        return subprocess.Popen(command, **kwargs)

    @staticmethod
    def stop_process_tree(process: subprocess.Popen[str]) -> None:
        if process.poll() is not None:
            return
        try:
            if os.name == "nt":
                taskkill = shutil.which("taskkill.exe") or shutil.which("taskkill")
                if taskkill:
                    subprocess.run(
                        [taskkill, "/PID", str(process.pid), "/T", "/F"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=CREATE_NO_WINDOW,
                        timeout=8,
                        check=False,
                    )
                else:
                    process.terminate()
            else:
                import signal

                os.killpg(process.pid, signal.SIGTERM)
        except (OSError, subprocess.TimeoutExpired):
            try:
                process.terminate()
            except OSError:
                pass
