# SIBA Automation

O SIBA Automation é um protótipo para anfitriões de alojamento gerirem reservas, prepararem boletins de alojamento e os enviarem ao Sistema de Informação de Boletins de Alojamento (SIBA) a partir de um único painel. O envio usa o serviço web do SIBA e dispensa a introdução dos dados no portal.

## Problema e valor operacional

A gestão de uma reserva inclui recolher os dados dos hóspedes, preparar os boletins e confirmar que foram aceites pelo SIBA. O projeto reúne a transcrição, a revisão, o envio e o acompanhamento de cada reserva no mesmo fluxo. O painel permite identificar reservas pendentes e envios com erro, ajudando o anfitrião a perceber onde precisa de intervir.

A decisão de produto foi preservar a assinatura pelo hóspede e simplificar as tarefas administrativas do anfitrião. O benefício esperado é reduzir o tempo de tratamento por reserva e facilitar o seguimento de erros. Para avaliar esse benefício num piloto, compararia com o processo pelo portal do SIBA usando três indicadores:

- Tempo de trabalho do anfitrião por reserva, da transcrição à confirmação do envio.
- Percentagem de boletins aceites à primeira tentativa.
- Tempo entre uma rejeição e o reenvio com sucesso.

O protótipo ainda não mediu estes indicadores.

## Do protótipo online ao fluxo atual

A versão na tag `prototype-deployed` foi preparada para alojamento no Render. O ficheiro `render.yaml` dessa versão configurava o serviço web e previa uma base de dados indicada através de `DATABASE_URL`. Nesse protótipo, o anfitrião criava a reserva e partilhava uma ligação para os hóspedes preencherem os dados.

Como o processo exige a assinatura do hóspede, o fluxo foi revisto. A assinatura é recolhida fora da aplicação. A ligação associada à reserva serve como acesso interno ao formulário pelo anfitrião autenticado.

1. O anfitrião cria a reserva no painel.
2. Depois de recolher os dados e a assinatura, abre o formulário da reserva e transcreve os dados dos hóspedes.
3. Revê a informação e escolhe **Enviar para o SIBA**. A aplicação guarda os dados, gera o boletim em XML e submete-o por SOAP.
4. O anfitrião acompanha o resultado no painel e pode corrigir os dados se o SIBA devolver um erro.

A versão atual destina-se a demonstração local. Os pedidos de leitura e gravação dos formulários exigem agora sessão e validam a titularidade da reserva. Os dados dos hóspedes, incluindo rascunhos incompletos, são guardados cifrados na base de dados, não no armazenamento do navegador, nem incluídos nos registos da aplicação; o XML do envio também não é escrito em disco. A validação completa continua a ser exigida antes do envio ao SIBA. As tentativas de envio são associadas à reserva e um resultado incerto bloqueia o reenvio automático até à confirmação manual do estado no portal do SIBA. Antes de disponibilizar a aplicação online, continua a ser necessário validar o fluxo de ponta a ponta no ambiente de testes do SIBA e rever/eliminar dados em texto simples de execuções anteriores.

A configuração histórica pode ser consultada com `git show prototype-deployed:render.yaml`.

## Executar localmente

Requer Python 3.12. Os comandos abaixo assumem uma shell Bash e devem ser executados na raiz do repositório.

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp -n .env.example .env
export DEBUG=False
```

No ficheiro `.env`, mantém `DATABASE_URL=sqlite:///./siba.db` para usar SQLite e `SIBA_ENV=dev` para apontar para o ambiente de testes do SIBA. Gera um valor para `SECRET_KEY` e uma chave Fernet distinta para cada uma das variáveis `SIBA_ENCRYPT_KEY` e `ENCRYPTION_KEY`:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(32))'
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode()); print(Fernet.generate_key().decode())'
```

Quando a base de dados estiver vazia, cria uma conta local para aceder ao painel. O registo pela interface está desativado. O comando pede uma palavra-passe e guarda o respetivo hash:

```bash
python - <<'PY'
from getpass import getpass

from app.main import app  # Inicializa as tabelas da aplicação.
from app.db.session import SessionLocal
from app.models.login import User
from app.utils.sec import get_password_hash

email = "admin@siba.local"
with SessionLocal() as db:
    if db.query(User).filter_by(email=email).first() is None:
        password = getpass("Palavra-passe da conta local: ")
        if not password:
            raise SystemExit("Indica uma palavra-passe.")
        db.add(User(
            full_name="Anfitrião de demonstração",
            email=email,
            hashed_password=get_password_hash(password),
        ))
        db.commit()
PY
```

```bash
python -m uvicorn app.main:app --reload
```

Abre [http://localhost:8000](http://localhost:8000), entra com a conta local e cria uma reserva com dados fictícios. Usa `localhost` para que o navegador aceite o cookie de sessão configurado com o atributo `Secure`. O endpoint `/health` devolve o estado da aplicação.

Para testar o envio, preenche no perfil os dados do alojamento e as credenciais do ambiente de testes do SIBA. A aplicação corre na máquina local, mas a submissão comunica com um serviço externo.

## Tecnologia

- **Aplicação web:** FastAPI, Jinja2 e JavaScript.
- **Dados:** SQLAlchemy com SQLite para uso local. Campos dos boletins e a chave do SIBA são cifrados com Fernet.
- **Integração:** geração dos boletins em XML e envio via SOAP para o SIBA.
