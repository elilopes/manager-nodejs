"""Coordena eventos da tela, operações do model e workers assíncronos."""

from __future__ import annotations

import queue
import re
import subprocess
import threading
import webbrowser
from pathlib import Path

from models.project_model import ProjectModel
from utils.ansi import strip_ansi
from views.main_view import MainView

DEFAULT_SERVER_URL = "http://localhost:5173/"
DEFAULT_PREVIEW_URL = "http://localhost:3000/"


class ProjectController:
    def __init__(self, model: ProjectModel, view: MainView) -> None:
        self.model = model
        self.view = view
        self.events: queue.Queue[tuple] = queue.Queue()
        self.busy = False
        self.server_running = False
        self.server_mode: str | None = None
        self.custom_running = False
        self.server_url = DEFAULT_SERVER_URL
        self.server_process: subprocess.Popen[str] | None = None
        self.custom_process: subprocess.Popen[str] | None = None
        self.process_lock = threading.Lock()
        self.closing = False

        self.view.set_actions(
            browse=self.browse_project,
            open_recent=self.open_recent_project,
            open_node_path=self.open_node_path,
            create=self.create_project,
            check=self.check_dependencies,
            update=self.update_dependencies,
            build=self.build_project,
            preview_build=self.preview_build,
            start_server=self.start_server,
            stop_server=self.stop_server,
            open_link=self.open_server_link,
            copy_link=self.copy_server_link,
            run_command=self.run_custom_command,
            stop_command=self.stop_custom_command,
        )
        self.view.set_recent_projects(
            [str(project) for project in self.model.get_recent_projects()]
        )
        self.view.set_close_handler(self.close)
        self.view.schedule(80, self._poll_events)

    def browse_project(self) -> None:
        selected = self.view.choose_project_directory()
        if selected:
            self.view.set_project_path(selected)
            self._remember_recent(Path(selected))

    def _remember_recent(self, directory: Path) -> None:
        try:
            projects = self.model.add_recent_project(directory)
        except OSError as exc:
            self._log(f"Não foi possível salvar a lista de projetos recentes: {exc}")
            return
        self.view.set_recent_projects(
            [str(project) for project in projects], selected=str(directory)
        )

    def open_recent_project(self) -> None:
        selected = self.view.get_selected_recent_project()
        if not selected:
            self.view.show_info("A lista de projetos recentes está vazia.")
            return
        try:
            directory = self.model.resolve_project_path(selected)
            self.model.validate_project(directory)
        except (OSError, ValueError) as exc:
            self.view.set_recent_projects(
                [str(project) for project in self.model.get_recent_projects()]
            )
            self.view.show_error(str(exc))
            return
        self.view.set_project_path(str(directory))
        self._remember_recent(directory)
        self.view.write_log(f"Projeto recente aberto: {directory}")
        self.view.set_status("Projeto aberto", "ready")

    def _selected_project(self) -> Path | None:
        try:
            return self.model.resolve_project_path(self.view.get_project_path())
        except (OSError, ValueError) as exc:
            self.view.show_error(str(exc))
            return None

    def _begin_operation(self, label: str, worker) -> None:
        if self.busy:
            return
        if self.server_running:
            self.view.show_info("Pare o servidor antes de iniciar outra operação.")
            return
        directory = self._selected_project()
        if directory is None:
            return
        if (directory / "package.json").is_file():
            self._remember_recent(directory)

        self.busy = True
        self.view.set_status(label, "working")
        self.view.set_controls(operations_enabled=False, server_running=False)
        threading.Thread(
            target=self._operation_worker,
            args=(worker, directory),
            daemon=True,
        ).start()

    def _operation_worker(self, worker, directory: Path) -> None:
        try:
            worker(directory)
        except Exception as exc:
            self._log(f"Erro: {exc}")
            self.events.put(("task_done", False, "Falha"))

    def _log(self, message: str) -> None:
        self.events.put(("log", message))

    def create_project(self) -> None:
        project_type = self.view.get_new_project_type()
        package_manager = self.view.get_new_project_manager()
        dev_package = self.view.get_new_project_dev_package()
        labels = {
            "vite": "Criando projeto Vite…",
            "next": "Criando projeto Next.js…",
            "node": "Inicializando projeto Node.js…",
        }
        self._begin_operation(
            labels.get(project_type, "Criando projeto…"),
            lambda directory: self._create_project_worker(
                directory, project_type, package_manager, dev_package
            ),
        )

    def _create_project_worker(
        self, directory: Path, project_type: str, package_manager: str, dev_package: str
    ) -> None:
        self.model.create_project(
            directory, self._log, project_type=project_type,
            package_manager=package_manager, dev_package=dev_package,
        )
        try:
            recent = self.model.add_recent_project(directory)
            self.events.put((
                "recent_projects", [str(project) for project in recent], str(directory)
            ))
        except OSError as exc:
            self._log(f"Não foi possível salvar o projeto nos recentes: {exc}")
        self.events.put(("task_done", True, "Projeto pronto"))

    def check_dependencies(self) -> None:
        self.view.expand_dependencies()
        self._begin_operation(
            "Verificando dependências…",
            self._check_dependencies_worker,
        )

    def _check_dependencies_worker(self, directory: Path) -> None:
        dependencies = self.model.inspect_dependencies(directory, self._log)
        self.events.put(("dependencies", dependencies))
        self.events.put(("task_done", True, "Verificação concluída"))

    def update_dependencies(self) -> None:
        self._begin_operation(
            "Atualizando dependências…",
            self._update_dependencies_worker,
        )

    def build_project(self) -> None:
        self._begin_operation("Compilando build de produção…", self._build_project_worker)

    def _build_project_worker(self, directory: Path) -> None:
        self.model.build_project(directory, self._log)
        self.events.put(("task_done", True, "Build concluído"))

    def _update_dependencies_worker(self, directory: Path) -> None:
        self.model.update_dependencies(directory, self._log)
        dependencies = self.model.inspect_dependencies(directory, self._log)
        self.events.put(("dependencies", dependencies))
        self.events.put(("task_done", True, "Atualização concluída"))

    def open_node_path(self) -> None:
        try:
            node_path = self.model.open_node_in_file_explorer()
            self.view.write_log(f"Localização do Node.js aberta no Explorador: {node_path}")
        except (FileNotFoundError, OSError) as exc:
            self.view.show_error(str(exc))

    def run_custom_command(self) -> None:
        if self.busy:
            return
        if self.server_running:
            self.view.show_info("Pare o servidor antes de executar outro comando nesta pasta.")
            return
        command = self.view.get_custom_command().strip()
        if not command:
            self.view.show_error("Digite um comando para executar.")
            return
        directory = self._selected_project()
        if directory is None:
            return
        if not directory.is_dir():
            self.view.show_error("A pasta selecionada ainda não existe.")
            return
        if (directory / "package.json").is_file():
            self._remember_recent(directory)

        self.view.clear_custom_command()
        self.busy = True
        self.view.set_status("Executando comando…", "working")
        self.view.set_controls(operations_enabled=False, server_running=False)
        threading.Thread(
            target=self._custom_command_worker,
            args=(directory, command),
            daemon=True,
        ).start()

    def _custom_command_worker(self, directory: Path, command: str) -> None:
        process: subprocess.Popen[str] | None = None
        success = False
        try:
            self._log("$ " + command)
            process = self.model.start_custom_command(directory, command)
            with self.process_lock:
                self.custom_process = process
            if self.closing:
                self.model.stop_process_tree(process)
                return

            self.events.put(("custom_started",))
            assert process.stdout is not None
            for raw_line in process.stdout:
                line = strip_ansi(raw_line.rstrip("\r\n"))
                if line:
                    self._log(line)
            code = process.wait()
            success = code == 0
            self._log(f"Comando personalizado finalizado com código {code}.")
        except Exception as exc:
            self._log(f"Erro ao executar comando: {exc}")
        finally:
            with self.process_lock:
                self.custom_process = None
            if not self.closing:
                self.events.put(("custom_finished", success))

    def stop_custom_command(self) -> None:
        with self.process_lock:
            process = self.custom_process
        if process is None:
            return
        self._log("Solicitando parada do comando personalizado…")
        threading.Thread(
            target=self.model.stop_process_tree,
            args=(process,),
            daemon=True,
        ).start()

    def open_server_link(self) -> None:
        if not self.server_running:
            self.view.show_info("Inicie o servidor ou a prévia antes de abrir o link.")
            return
        url = self.server_url
        self._log(f"Abrindo no navegador do sistema: {url}")
        threading.Thread(target=self._open_url, args=(url,), daemon=True).start()

    def _open_url(self, url: str) -> None:
        try:
            if not webbrowser.open(url):
                self._log("O navegador do sistema não confirmou a abertura do link.")
        except Exception as exc:
            self._log(f"Não foi possível abrir o navegador: {exc}")

    def copy_server_link(self) -> None:
        try:
            self.view.copy_to_clipboard(self.server_url)
            self._log(f"Link copiado: {self.server_url}")
        except Exception as exc:
            self._log(f"Não foi possível copiar o link: {exc}")

    def start_server(self) -> None:
        if self.busy or self.server_running:
            return
        directory = self._selected_project()
        if directory is None:
            return
        try:
            self.model.validate_project(directory)
        except (OSError, ValueError) as exc:
            self.view.show_error(str(exc))
            return

        self._remember_recent(directory)
        self.view.set_status("Iniciando servidor…", "working")
        self.server_mode = "dev"
        self.server_url = DEFAULT_SERVER_URL
        self.view.set_controls(
            operations_enabled=False, server_running=False, server_mode=self.server_mode
        )
        threading.Thread(
            target=self._server_worker, args=(directory, "dev"), daemon=True
        ).start()

    def preview_build(self) -> None:
        if self.busy or self.server_running:
            return
        directory = self._selected_project()
        if directory is None:
            return
        try:
            self.model.get_build_info(directory)
            self.model.validate_project(directory)
        except (OSError, ValueError) as exc:
            self.view.show_error(str(exc))
            return

        self._remember_recent(directory)
        self.server_mode = "preview"
        self.server_url = DEFAULT_PREVIEW_URL
        self.view.set_status("Iniciando prévia de produção…", "working")
        self.view.set_controls(
            operations_enabled=False, server_running=False, server_mode=self.server_mode
        )
        threading.Thread(
            target=self._server_worker, args=(directory, "preview"), daemon=True
        ).start()

    def _server_worker(self, directory: Path, mode: str) -> None:
        try:
            if mode == "preview":
                process = self.model.start_build_preview(directory, self._log)
            else:
                process = self.model.start_dev_server(directory, self._log)
            with self.process_lock:
                self.server_process = process
            if self.closing:
                self.model.stop_process_tree(process)
                return

            self.events.put(("server_started", mode))
            self._log(f"Link local: {self.server_url}")
            assert process.stdout is not None
            for raw_line in process.stdout:
                line = strip_ansi(raw_line.rstrip("\r\n"))
                if line:
                    self._log(line)
                    match = re.search(r"https?://localhost(?::\d+)?/?", line)
                    if match:
                        url = match.group(0)
                        if not url.endswith("/"):
                            url += "/"
                        if url != self.server_url:
                            self.events.put(("server_url", url))
            code = process.wait()
            self._log(f"Servidor encerrado (código {code}).")
        except Exception as exc:
            self._log(f"Erro ao iniciar servidor: {exc}")
        finally:
            with self.process_lock:
                self.server_process = None
            if not self.closing:
                self.events.put(("server_stopped", mode))

    def stop_server(self) -> None:
        with self.process_lock:
            process = self.server_process
        if process is None:
            return
        self.view.set_status("Parando servidor…", "working")
        self.view.set_controls(
            operations_enabled=False, server_running=False, server_mode=self.server_mode
        )
        self._log("Solicitando parada do servidor…")
        threading.Thread(
            target=self.model.stop_process_tree,
            args=(process,),
            daemon=True,
        ).start()

    def _poll_events(self) -> None:
        try:
            while True:
                event = self.events.get_nowait()
                kind = event[0]
                if kind == "log":
                    self.view.write_log(event[1])
                elif kind == "dependencies":
                    self.view.show_dependencies(event[1])
                elif kind == "recent_projects":
                    self.view.set_recent_projects(event[1], selected=event[2])
                elif kind == "task_done":
                    self.busy = False
                    self.view.set_controls(
                        operations_enabled=not self.server_running,
                        server_running=self.server_running,
                        custom_running=self.custom_running,
                        server_mode=self.server_mode,
                    )
                    self.view.set_status(event[2], "ready" if event[1] else "error")
                elif kind == "server_started":
                    self.server_running = True
                    self.server_mode = event[1]
                    self.view.set_controls(
                        operations_enabled=False, server_running=True,
                        custom_running=self.custom_running,
                        server_mode=self.server_mode,
                    )
                    self.view.set_status(
                        "Prévia de produção em execução" if self.server_mode == "preview"
                        else "Servidor em execução", "ready"
                    )
                elif kind == "server_stopped":
                    self.server_running = False
                    self.server_mode = None
                    self.view.set_controls(
                        operations_enabled=not self.busy, server_running=False,
                        custom_running=self.custom_running,
                        server_mode=None,
                    )
                    self.view.set_status("Servidor/prévia parado", "idle")
                elif kind == "server_url":
                    self.server_url = event[1]
                    self.view.write_log(f"Link local detectado: {self.server_url}")
                elif kind == "custom_started":
                    self.custom_running = True
                    self.view.set_controls(
                        operations_enabled=False, server_running=False,
                        custom_running=True,
                        server_mode=self.server_mode,
                    )
                elif kind == "custom_finished":
                    self.custom_running = False
                    self.busy = False
                    self.view.set_controls(
                        operations_enabled=not self.server_running,
                        server_running=self.server_running,
                        custom_running=False,
                        server_mode=self.server_mode,
                    )
                    self.view.set_status(
                        "Comando concluído" if event[1] else "Comando finalizado com erro",
                        "ready" if event[1] else "error",
                    )
        except queue.Empty:
            pass

        if not self.closing:
            self.view.schedule(80, self._poll_events)

    def close(self) -> None:
        self.closing = True
        with self.process_lock:
            process = self.server_process
            custom_process = self.custom_process
        for active_process in (process, custom_process):
            if active_process is not None:
                self.model.stop_process_tree(active_process)
        self.view.root.destroy()
