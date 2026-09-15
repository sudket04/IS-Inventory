"""Local, on-disk storage for the SQL Server connection settings entered on
setup.html. This has to live outside the database itself — the app needs
these settings before it can open a connection at all. The password is
encrypted at rest with a locally-generated Fernet key (secret.key); both
files are gitignored.
"""
import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from cryptography.fernet import Fernet

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
KEY_PATH = BASE_DIR / "secret.key"


@dataclass
class AppConfig:
    server: str
    database: str
    auth: str  # "sql" or "windows"
    username: str = ""
    password: str = ""


def _get_fernet() -> Fernet:
    if KEY_PATH.exists():
        key = KEY_PATH.read_bytes()
    else:
        key = Fernet.generate_key()
        KEY_PATH.write_bytes(key)
        try:
            os.chmod(KEY_PATH, 0o600)
        except OSError:
            pass
    return Fernet(key)


def load_config() -> Optional[AppConfig]:
    if not CONFIG_PATH.exists():
        return None
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    password = ""
    if data.get("password_enc"):
        password = _get_fernet().decrypt(data["password_enc"].encode()).decode()
    return AppConfig(
        server=data.get("server", ""),
        database=data.get("database", ""),
        auth=data.get("auth", "sql"),
        username=data.get("username", ""),
        password=password,
    )


def save_config(cfg: AppConfig) -> None:
    password_enc = ""
    if cfg.password:
        password_enc = _get_fernet().encrypt(cfg.password.encode()).decode()
    data = {
        "server": cfg.server,
        "database": cfg.database,
        "auth": cfg.auth,
        "username": cfg.username,
        "password_enc": password_enc,
    }
    CONFIG_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    try:
        os.chmod(CONFIG_PATH, 0o600)
    except OSError:
        pass
