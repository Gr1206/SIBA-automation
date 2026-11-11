"""
Envio de boletins de alojamento para o webservice SIBA.

Por omissão envia para o ambiente de DESENVOLVIMENTO/TESTE.
O ambiente de produção só é usado se pedires explicitamente ambiente="prod".

Uso rápido:
    python3 -m app.services.siba_sender teste_siba_corrigido.xml \
        --nif 121212121 --estabelecimento 00 --chave 999999999
"""
import argparse
import base64
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path
from xml.sax.saxutils import escape

import requests

from app.core.config import settings


SIBA_URLS = {
    "dev": settings.SIBA_WSDL_DEV,
    "prod": settings.SIBA_WSDL_PROD,
}
SOAP_ACTION = "http://sef.pt/EntregaBoletinsAlojamento"


class SibaSendError(Exception):
    """Falha de rede/HTTP ou resposta SOAP ilegível ao falar com o SIBA."""


@dataclass
class SibaResponse:
    success: bool          # True se o SIBA devolveu '0'
    code: str              # '0' ou Codigo_Retorno
    description: str       # Descricao do erro (vazio se sucesso)
    raw: str               # resposta HTTP completa, para debug
    http_status: int


def encode_boletins(xml_string: str) -> str:
    """O parâmetro Boletins exige o XML em Base64."""
    return base64.b64encode(xml_string.encode("utf-8")).decode("ascii")


def build_soap_envelope(nif: str, estabelecimento: str, chave_acesso: str, xml_string: str) -> str:
    """Monta o envelope SOAP 1.1 da operação EntregaBoletinsAlojamento."""
    return (
        '<?xml version="1.0" encoding="utf-8"?>'
        '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
        "<soap:Body>"
        '<EntregaBoletinsAlojamento xmlns="http://sef.pt/">'
        f"<UnidadeHoteleira>{escape(nif)}</UnidadeHoteleira>"
        f"<Estabelecimento>{escape(estabelecimento)}</Estabelecimento>"
        f"<ChaveAcesso>{escape(chave_acesso)}</ChaveAcesso>"
        f"<Boletins>{encode_boletins(xml_string)}</Boletins>"
        "</EntregaBoletinsAlojamento>"
        "</soap:Body>"
        "</soap:Envelope>"
    )


def _local(tag: str) -> str:
    """Nome do elemento sem namespace."""
    return tag.rsplit("}", 1)[-1]


def _find_text(root: ET.Element, name: str) -> str | None:
    for elem in root.iter():
        if _local(elem.tag) == name:
            return (elem.text or "").strip()
    return None


def parse_response(body: str, http_status: int) -> SibaResponse:
    """Interpreta a resposta SOAP: '0' = sucesso; caso contrário vem XML com Codigo_Retorno/Descricao."""
    try:
        root = ET.fromstring(body)
    except ET.ParseError as exc:
        raise SibaSendError(f"Resposta não é XML válido (HTTP {http_status}): {body[:300]}") from exc

    # SOAP Fault (erro de protocolo / pedido mal formado)
    fault = _find_text(root, "faultstring")
    if fault is not None:
        return SibaResponse(False, "SOAP_FAULT", fault, body, http_status)

    result = _find_text(root, "EntregaBoletinsAlojamentoResult")
    if result is None:
        raise SibaSendError(f"Resposta sem EntregaBoletinsAlojamentoResult (HTTP {http_status}): {body[:300]}")

    if result == "0":
        return SibaResponse(True, "0", "", body, http_status)

    # Erro: o resultado é um XML com um ou mais <RetornoBA>
    codes = []
    descriptions = []
    try:
        inner = ET.fromstring(result)
        for retorno in inner.iter():
            if _local(retorno.tag) != "RetornoBA":
                continue
            code = _find_text(retorno, "Codigo_Retorno")
            description = _find_text(retorno, "Descricao")
            if code:
                codes.append(code)
            if description:
                descriptions.append(description)
    except ET.ParseError:
        pass

    return SibaResponse(
        False,
        ", ".join(codes) or result,
        "\n".join(descriptions),
        body,
        http_status,
    )


def enviar_boletins(
    xml_string: str,
    nif: str,
    estabelecimento: str,
    chave_acesso: str,
    ambiente: str = "dev",
    timeout: int = 30,
) -> SibaResponse:
    """
    Envia o XML (string) ao SIBA.

    ambiente: "dev" (desenvolvimento/teste, por omissão) ou "prod".
    Não guarda nem imprime a chave de acesso.
    """
    if ambiente not in SIBA_URLS:
        raise ValueError(f"ambiente inválido '{ambiente}' (usa 'dev' ou 'prod')")
    if not re.fullmatch(r"\d{9}", str(nif)):
        raise ValueError("nif deve ter 9 dígitos")
    if not re.fullmatch(r"\d+", str(estabelecimento)):
        raise ValueError("estabelecimento deve ser numérico (ex.: '00')")
    if not re.fullmatch(r"\d+", str(chave_acesso)):
        raise ValueError("chave_acesso deve conter apenas dígitos")
    if not xml_string or not xml_string.strip():
        raise ValueError("xml_string está vazio")

    envelope = build_soap_envelope(str(nif), str(estabelecimento), str(chave_acesso), xml_string)
    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": f'"{SOAP_ACTION}"',
    }

    try:
        resp = requests.post(
            SIBA_URLS[ambiente],
            data=envelope.encode("utf-8"),
            headers=headers,
            timeout=timeout,
        )
    except requests.RequestException as exc:
        raise SibaSendError(f"Falha de rede ao contactar o SIBA ({ambiente}): {exc}") from exc

    # Um erro SOAP costuma vir com HTTP 500 mas com corpo XML útil, por isso interpretamos sempre o corpo
    return parse_response(resp.text, resp.status_code)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Envia um XML de boletins para o SIBA (teste por omissão).")
    parser.add_argument("xml_file", type=Path)
    parser.add_argument("--nif", required=True)
    parser.add_argument("--estabelecimento", required=True)
    parser.add_argument("--chave", required=True)
    parser.add_argument("--ambiente", default="dev", choices=["dev", "prod"])
    args = parser.parse_args()

    xml_text = args.xml_file.read_text(encoding="utf-8")
    try:
        result = enviar_boletins(xml_text, args.nif, args.estabelecimento, args.chave, args.ambiente)
    except (SibaSendError, ValueError) as exc:
        raise SystemExit(f"Erro: {exc}")

    print(f"HTTP {result.http_status}")
    if result.success:
        print("Sucesso: boletins carregados (retorno '0').")
    else:
        print(f"Falhou: código={result.code} descrição={result.description}")
        print("\nResposta completa:\n" + result.raw)