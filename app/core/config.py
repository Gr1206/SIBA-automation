from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Configurações gerais da aplicação
    PROJECT_NAME: str = "SIBA Automation"
    PROJECT_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Credenciais e endpoints do SIBA
    SIBA_ENV: str = "dev"  # "dev" ou "prod"
    SIBA_WSDL_DEV: str = ""
    SIBA_WSDL_PROD: str = ""

    DATABASE_URL: str

    # Segurança
    SECRET_KEY: str
    SIBA_ENCRYPT_KEY: str

    # Leitura automática do ficheiro .env na raiz do projeto
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def siba_wsdl(self) -> str:
        """Devolve o WSDL correto com base no ambiente."""
        return self.SIBA_WSDL_PROD if self.SIBA_ENV == "prod" else self.SIBA_WSDL_DEV


settings = Settings()