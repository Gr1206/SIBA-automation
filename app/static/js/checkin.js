import { postJSON } from "./helpers/utils.js";
document.addEventListener("DOMContentLoaded", () => {
    let hospedes = [criarHospede()];
    let indiceAtual = 0;
    let gravacaoPendente = Promise.resolve();
    let ultimaListaGuardada;
    let temporizadorGravacao;
    let houveEdicao = false;

    function criarHospede() {
        return {
            full_name: "",
            birth_date: "",
            nationality: "",
            country_of_residence: "",
            city_of_residence: "",
            id_type: "",
            id_number: "",
            country_of_issue: ""
        };
    }

    function obterTokenReserva() {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        return pathSegments[pathSegments.length - 1];
    }

    const chaveRascunhoAntigo = `siba_hospedes_draft_${obterTokenReserva()}`;
    try {
        localStorage.removeItem(chaveRascunhoAntigo);
    } catch (error) {
        console.warn("Não foi possível remover um rascunho local antigo.", error);
    }

    async function carregarHospedes() {
        const token = obterTokenReserva();
        const response = await fetch(`/forms/get/${encodeURIComponent(token)}`);

        if (response.status === 404) {
            return [criarHospede()];
        }

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Erro ao carregar os dados (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.guests) || data.guests.length === 0) {
            return [criarHospede()];
        }

        return data.guests.map(normalizarHospede);
    }

    function normalizarHospede(hospede) {
        return {
            full_name: hospede.full_name || hospede.nome || "",
            birth_date: hospede.birth_date || hospede.nascimento || "",
            nationality: hospede.nationality || hospede.nacionalidade || "",
            country_of_residence: hospede.country_of_residence || hospede.paisResidencia || "",
            city_of_residence: hospede.city_of_residence || hospede.cidadeResidencia || "",
            id_type: hospede.id_type || hospede.tipoDocumento || "",
            id_number: hospede.id_number || hospede.documento || "",
            country_of_issue: hospede.country_of_issue || hospede.paisEmissao || ""
        };
    }

    const tabsContainer = document.getElementById("tabs-container");
    const btnSendSiba = document.getElementById("btn-sendSiba");
    const inputNome = document.getElementById("campo-nome");
    const inputNascimento = document.getElementById("campo-nascimento");
    const inputNacionalidade = document.getElementById("campo-nacionalidade");
    const inputPaisResidencia = document.getElementById("campo-pais-residencia");
    const inputCidadeResidencia = document.getElementById("campo-cidade-residencia");
    const inputTipoDocumento = document.getElementById("campo-tipo-doc");
    const inputDoc = document.getElementById("campo-doc");
    const inputPaisEmissao = document.getElementById("campo-pais-emissao");
    const btnAdd = document.getElementById("btn-add-hospede");
    const btnRemove = document.getElementById("btn-remove-hospede");
    const btnAnterior = document.getElementById("btn-anterior");
    const btnSeguinte = document.getElementById("btn-seguinte");
    const returnBtn = document.getElementById("btn-back");
    const sibaStatusModal = document.getElementById("siba-status-modal");
    const sibaStatusTitle = document.getElementById("siba-status-title");
    const sibaStatusMessage = document.getElementById("siba-status-message");
    const sibaStatusDetails = document.getElementById("siba-status-details");
    const sibaStatusClose = document.getElementById("siba-status-close");
    const sibaReconcileActions = document.getElementById("siba-reconcile-actions");
    const sibaReconcileAccepted = document.getElementById("siba-reconcile-accepted");
    const sibaReconcileNotReceived = document.getElementById("siba-reconcile-not-received");

    preencherSelect(inputNacionalidade, window.SIBA_NATIONALITIES, "Selecione uma nacionalidade");
    preencherSelect(inputPaisResidencia, window.SIBA_COUNTRIES, "Selecione um país");
    preencherSelect(inputPaisEmissao, window.SIBA_COUNTRIES, "Selecione um país");

    function submitForm() {
        const token = obterTokenReserva();
        const lista = JSON.stringify(hospedes);
        const gravacao = gravacaoPendente.then(async () => {
            if (lista !== ultimaListaGuardada) {
                await postJSON("/forms/submit/" + encodeURIComponent(token), { guests: JSON.parse(lista) });
                ultimaListaGuardada = lista;
            }
            return token;
        });
        gravacaoPendente = gravacao.catch(() => {});
        return gravacao;
    }

    function guardarSeCompleto() {
        clearTimeout(temporizadorGravacao);
        if (!validarHospedes(false)) {
            return;
        }
        submitForm().catch((error) => {
            console.error("Erro ao guardar os hóspedes:", error);
            alert("Não foi possível guardar os dados dos hóspedes.");
        });
    }

    function preencherSelect(select, options, placeholder) {
        select.innerHTML = `<option value="">${placeholder}</option>`;
        options.forEach(({ code, name }) => {
            const option = document.createElement("option");
            option.value = code;
            option.textContent = `${name} (${code})`;
            select.appendChild(option);
        });
    }

    function salvarAtual() {
        if (hospedes[indiceAtual]) {
            hospedes[indiceAtual].full_name = inputNome.value;
            hospedes[indiceAtual].birth_date = inputNascimento.value;
            hospedes[indiceAtual].nationality = inputNacionalidade.value;
            hospedes[indiceAtual].country_of_residence = inputPaisResidencia.value;
            hospedes[indiceAtual].city_of_residence = inputCidadeResidencia.value;
            hospedes[indiceAtual].id_type = inputTipoDocumento.value;
            hospedes[indiceAtual].id_number = inputDoc.value;
            hospedes[indiceAtual].country_of_issue = inputPaisEmissao.value;
        }
    }

    function registarEdicao() {
        salvarAtual();
        houveEdicao = true;
        clearTimeout(temporizadorGravacao);
        temporizadorGravacao = setTimeout(guardarSeCompleto, 700);
    }

    for (const campo of [
        inputNome, inputNascimento, inputNacionalidade, inputPaisResidencia,
        inputCidadeResidencia, inputTipoDocumento, inputDoc, inputPaisEmissao
    ]) {
        campo.addEventListener("input", registarEdicao);
        campo.addEventListener("change", registarEdicao);
    }

    function validarHospedes(mostrarErro = true) {
        const camposObrigatorios = [
            ["full_name", "nome completo"],
            ["birth_date", "data de nascimento"],
            ["nationality", "nacionalidade"],
            ["country_of_residence", "país de residência"],
            ["city_of_residence", "cidade de residência"],
            ["id_type", "tipo de documento"],
            ["id_number", "número do documento"],
            ["country_of_issue", "país emissor"],
        ];

        for (let index = 0; index < hospedes.length; index += 1) {
            const hospede = hospedes[index];
            const campoEmFalta = camposObrigatorios.find(([campo]) => !String(hospede[campo] || "").trim());

            if (campoEmFalta) {
                if (mostrarErro) {
                    indiceAtual = index;
                    renderizar();
                    alert(`Preencha o campo "${campoEmFalta[1]}" do Hóspede ${index + 1}.`);
                }
                return false;
            }
        }

        return true;
    }

    function renderizar() {
        const atual = hospedes[indiceAtual];
        inputNome.value = atual ? atual.full_name || atual.nome || "" : "";
        inputNascimento.value = atual ? atual.birth_date || atual.nascimento || "" : "";
        inputNacionalidade.value = atual ? atual.nationality || atual.nacionalidade || "" : "";
        inputPaisResidencia.value = atual ? atual.country_of_residence || atual.paisResidencia || "" : "";
        inputCidadeResidencia.value = atual ? atual.city_of_residence || atual.cidadeResidencia || "" : "";
        inputTipoDocumento.value = atual ? atual.id_type || atual.tipoDocumento || "" : "";
        inputDoc.value = atual ? atual.id_number || atual.documento || "" : "";
        inputPaisEmissao.value = atual ? atual.country_of_issue || atual.paisEmissao || "" : "";

        btnAnterior.disabled = indiceAtual === 0;
        btnAnterior.classList.toggle("opacity-50", indiceAtual === 0);
        btnSeguinte.disabled = indiceAtual === hospedes.length - 1;
        btnSeguinte.classList.toggle("opacity-50", indiceAtual === hospedes.length - 1);

        tabsContainer.innerHTML = "";
        hospedes.forEach((_, idx) => {
            const tab = document.createElement("button");
            tab.type = "button";
            tab.textContent = `Hóspede ${idx + 1}`;
            tab.className = `text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                idx === indiceAtual
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`;
            tab.addEventListener("click", () => {
                salvarAtual();
                houveEdicao = true;
                guardarSeCompleto();
                indiceAtual = idx;
                renderizar();
            });
            tabsContainer.appendChild(tab);
        });
    }

    btnRemove.addEventListener("click", () => {
        if (hospedes.length > 1) {
            salvarAtual();
            hospedes.splice(indiceAtual, 1);
            if (indiceAtual >= hospedes.length) {
                indiceAtual = hospedes.length - 1;
            }
            houveEdicao = true;
            guardarSeCompleto();
            renderizar();
        }
    });

    btnAdd.addEventListener("click", () => {
        salvarAtual();
        guardarSeCompleto();
        hospedes.push(criarHospede());
        houveEdicao = true;
        indiceAtual = hospedes.length - 1;
        renderizar();
    });

    btnAnterior.addEventListener("click", () => {
        if (indiceAtual > 0) {
            salvarAtual();
            houveEdicao = true;
            guardarSeCompleto();
            indiceAtual--;
            renderizar();
        }
    });

    btnSeguinte.addEventListener("click", () => {
        if (indiceAtual < hospedes.length - 1) {
            salvarAtual();
            houveEdicao = true;
            guardarSeCompleto();
            indiceAtual++;
            renderizar();
        }
    });

    
    if (returnBtn) {
        returnBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }

    function atualizarEstadoSiba({
        title,
        message,
        details = "",
        concluido = false,
        sucesso = false,
        reconciliar = false,
    }) {
        sibaStatusTitle.textContent = title;
        sibaStatusMessage.textContent = message;
        sibaStatusDetails.textContent = details;
        sibaStatusDetails.classList.toggle("hidden", !details);
        sibaReconcileActions.classList.toggle("hidden", !reconciliar);
        sibaStatusTitle.className = `text-lg font-bold ${
            sucesso ? "text-emerald-700" : concluido ? "text-red-700" : "text-slate-800"
        }`;
        sibaStatusClose.classList.toggle("hidden", !concluido);
    }

    function abrirEstadoSiba() {
        sibaStatusModal.classList.remove("hidden");
        sibaStatusModal.classList.add("flex");
        atualizarEstadoSiba({
            title: "A aguardar o SIBA",
            message: "O envio está a ser processado. Aguarde, por favor."
        });
    }

    function fecharEstadoSiba() {
        sibaStatusModal.classList.add("hidden");
        sibaStatusModal.classList.remove("flex");
    }

    function mostrarResultadoEnvio(resultado) {
        if (!resultado.success) {
            atualizarEstadoSiba({
                title: "Envio concluído com erro",
                message: "O SIBA rejeitou os dados enviados.",
                details: [
                    resultado.code ? `Código(s): ${resultado.code}` : "",
                    resultado.description || ""
                ].filter(Boolean).join("\n"),
                concluido: true
            });
            return;
        }

        atualizarEstadoSiba({
            title: "Envio concluído",
            message: "Os dados foram enviados com sucesso para o SIBA.",
            concluido: true,
            sucesso: true
        });
    }

    async function reconciliarEnvio(decision) {
        if (
            decision === "not_received" &&
            document.body.dataset.sibaEnvironment === "prod" &&
            !window.confirm("Vai autorizar um novo envio para o SIBA de PRODUÇÃO. Confirmar?")
        ) {
            return;
        }

        sibaReconcileAccepted.disabled = true;
        sibaReconcileNotReceived.disabled = true;
        const token = obterTokenReserva();
        try {
            await postJSON(`/forms/resolve/${encodeURIComponent(token)}`, { decision });
            if (decision === "accepted") {
                atualizarEstadoSiba({
                    title: "Envio confirmado",
                    message: "Assinalado como recebido no SIBA. Não foi feito um novo envio.",
                    concluido: true,
                    sucesso: true
                });
                return;
            }

            atualizarEstadoSiba({
                title: "A aguardar o SIBA",
                message: "A tentar novamente com um novo número de ficheiro."
            });
            const response = await postJSON(`/forms/get-xml/${encodeURIComponent(token)}`);
            mostrarResultadoEnvio(await response.json());
        } catch (error) {
            console.error("Erro ao reconciliar o envio para o SIBA:", error);
            const resultadoIncerto = error.message && error.message.includes("(502)");
            atualizarEstadoSiba({
                title: "Não foi possível reconciliar o envio",
                message: "Confirme o estado no portal do SIBA antes de voltar a tentar.",
                details: error.message || "Ocorreu um erro inesperado.",
                concluido: true,
                reconciliar: resultadoIncerto
            });
        } finally {
            sibaReconcileAccepted.disabled = false;
            sibaReconcileNotReceived.disabled = false;
        }
    }


    if (btnSendSiba) {
        btnSendSiba.addEventListener("click", async () => {
            if (
                document.body.dataset.sibaEnvironment === "prod" &&
                !window.confirm("Vai enviar estes dados para o SIBA de PRODUÇÃO. Confirmar?")
            ) {
                return;
            }
            clearTimeout(temporizadorGravacao);
            salvarAtual();
            houveEdicao = true;
            if (!validarHospedes()) {
                return;
            }

            abrirEstadoSiba();
            btnSendSiba.disabled = true;
            btnSendSiba.classList.add("opacity-50", "cursor-not-allowed");
            try {
                const token = await submitForm();
                const response = await postJSON("/forms/get-xml/" + encodeURIComponent(token));
                mostrarResultadoEnvio(await response.json());
            } catch (error) {
                console.error("Erro ao enviar os dados para o SIBA:", error);
                const resultadoIncerto = error.message && error.message.includes("(502)");
                atualizarEstadoSiba({
                    title: "Envio concluído com erro",
                    message: "Não foi possível concluir o envio para o SIBA.",
                    details: error.message || "Ocorreu um erro inesperado.",
                    concluido: true,
                    reconciliar: resultadoIncerto
                });
            } finally {
                btnSendSiba.disabled = false;
                btnSendSiba.classList.remove("opacity-50", "cursor-not-allowed");
            }
        });
    }

    if (sibaStatusClose) {
        sibaStatusClose.addEventListener("click", fecharEstadoSiba);
    }

    sibaReconcileAccepted.addEventListener("click", () => reconciliarEnvio("accepted"));
    sibaReconcileNotReceived.addEventListener("click", () => reconciliarEnvio("not_received"));

    renderizar();

    carregarHospedes()
        .then((hospedesCarregados) => {
            if (!houveEdicao) {
                hospedes = hospedesCarregados;
                ultimaListaGuardada = JSON.stringify(hospedes);
                renderizar();
            }
        })
        .catch((error) => {
            console.error("Erro ao carregar os dados guardados:", error);
        });
});
