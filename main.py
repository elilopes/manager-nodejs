"""Ponto de entrada do aplicativo MVC."""

import tkinter as tk

from controllers.project_controller import ProjectController
from models.project_model import ProjectModel
from views.main_view import MainView


def main() -> None:
    root = tk.Tk()
    view = MainView(root)
    ProjectController(ProjectModel(), view)
    root.mainloop()


if __name__ == "__main__":
    main()
