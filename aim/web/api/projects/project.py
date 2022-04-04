import os

from aim.sdk.repo import Repo
from aim.sdk.configs import get_aim_repo_name
from aim.web.utils import get_root_path, get_artifact_path


class Project:
    def __init__(self):
        root_path = get_root_path()
        repo_path = f'{root_path}/{get_aim_repo_name()}'
        artifact_path = get_artifact_path()

        self.name = 'My awesome project'
        self.path = root_path
        self.repo_path = repo_path
        self.description = ''
        self.repo = Repo.from_path(self.repo_path, artifact_path=artifact_path)
        self.repo.container_pool.clear()
        self.repo.container_view_pool.clear()
        self.repo.persistent_pool.clear()

    def exists(self):
        """
        Checks whether .aim repository is created
        """
        return self.repo and os.path.exists(self.repo_path)
