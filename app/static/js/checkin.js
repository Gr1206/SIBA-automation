import { postJSON } from "./helpers/utils.js";
document.addEventListener("DOMContentLoaded", () => {
    let hospedes = [criarHospede()];
    let indiceAtual = 0;

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

    function lerRascunho() {
        try {
            return JSON.parse(localStorage.getItem(obterStorageKey()));
        } catch (error) {
            console.warn("Rascunho de check-in inválido; a iniciar um novo.", error);
            localStorage.removeItem(obterStorageKey());
            return null;
        }
    }

    function obterTokenReserva() {
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        return pathSegments[pathSegments.length - 1];
    }

    function obterStorageKey() {
        return `siba_hospedes_draft_${obterTokenReserva()}`;
    }

    async function carregarHospedes() {
        const rascunho = lerRascunho();
        if (rascunho) {
            const hospedesGuardados = rascunho.map(normalizarHospede);
            return hospedesGuardados.length > 0 ? hospedesGuardados : [criarHospede()];
        }

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
    const formCheckin = document.getElementById("form-checkin");
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

    preencherSelect(inputNacionalidade, window.SIBA_NATIONALITIES, "Selecione uma nacionalidade");
    preencherSelect(inputPaisResidencia, window.SIBA_COUNTRIES, "Selecione um país");
    preencherSelect(inputPaisEmissao, window.SIBA_COUNTRIES, "Selecione um país");

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
            localStorage.setItem(obterStorageKey(), JSON.stringify(hospedes));
        }
    }

    function validarHospedes() {
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
                indiceAtual = index;
                renderizar();
                alert(`Preencha o campo "${campoEmFalta[1]}" do Hóspede ${index + 1}.`);
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
                indiceAtual = idx;
                renderizar();
            });
            tabsContainer.appendChild(tab);
        });
    }

    function removeGuest(guestList) {
        localStorage.setItem(obterStorageKey(), JSON.stringify(guestList));
    }

    inputNome.addEventListener("input", salvarAtual);
    inputNascimento.addEventListener("input", salvarAtual);
    inputNacionalidade.addEventListener("change", salvarAtual);
    inputPaisResidencia.addEventListener("change", salvarAtual);
    inputCidadeResidencia.addEventListener("input", salvarAtual);
    inputTipoDocumento.addEventListener("change", salvarAtual);
    inputDoc.addEventListener("input", salvarAtual);
    inputPaisEmissao.addEventListener("change", salvarAtual);

    btnRemove.addEventListener("click", () => {
        if (hospedes.length > 1) {
            salvarAtual();
            hospedes.splice(indiceAtual, 1);
            if (indiceAtual >= hospedes.length) {
                indiceAtual = hospedes.length - 1;
            }
            removeGuest(hospedes);
            renderizar();
        }
    });

    btnAdd.addEventListener("click", () => {
        salvarAtual();
        hospedes.push(criarHospede());
        indiceAtual = hospedes.length - 1;
        renderizar();
    });

    btnAnterior.addEventListener("click", () => {
        if (indiceAtual > 0) {
            salvarAtual();
            indiceAtual--;
            renderizar();
        }
    });

    btnSeguinte.addEventListener("click", () => {
        if (indiceAtual < hospedes.length - 1) {
            salvarAtual();
            indiceAtual++;
            renderizar();
        }
    });

    
    if (returnBtn) {
        returnBtn.addEventListener("click", () => {
            window.location.href = "/dashboard";
        });
    }

    async function submitForm() {
        salvarAtual();
        if (!validarHospedes()) {
            throw new Error("Existem campos obrigatórios por preencher.");
        }

        const token = obterTokenReserva();

        await postJSON("/forms/submit/" + encodeURIComponent(token), { guests: hospedes });
        localStorage.removeItem(obterStorageKey());
        return token;
    }

    function atualizarEstadoSiba({ title, message, details = "", concluido = false, sucesso = false }) {
        sibaStatusTitle.textContent = title;
        sibaStatusMessage.textContent = message;
        sibaStatusDetails.textContent = details;
        sibaStatusDetails.classList.toggle("hidden", !details);
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


    formCheckin.addEventListener("submit", async (e) => {
        e.preventDefault();
        salvarAtual();
        if (!validarHospedes()) {
            return;
        }
        try {
            const token = await submitForm();
            window.location.href = "/checkinSuccess/?token=" + encodeURIComponent(token);
        } catch (error) {
            console.error("Erro ao enviar os dados:", error);
            alert("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
        }
    });

    if (btnSendSiba) {
        btnSendSiba.addEventListener("click", async () => {
            console.log("Botão 'Enviar para o SIBA' clicado");
            salvarAtual();
            if (!validarHospedes()) {
                return;
            }

            abrirEstadoSiba();
            btnSendSiba.disabled = true;
            btnSendSiba.classList.add("opacity-50", "cursor-not-allowed");
            try {
                const token = await submitForm();
                const response = await postJSON("/forms/get-xml/" + encodeURIComponent(token));
                const resultado = await response.json();

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
            } catch (error) {
                console.error("Erro ao enviar os dados para o SIBA:", error);
                atualizarEstadoSiba({
                    title: "Envio concluído com erro",
                    message: "Não foi possível concluir o envio para o SIBA.",
                    details: error.message || "Ocorreu um erro inesperado.",
                    concluido: true
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

    renderizar();

    carregarHospedes()
        .then((hospedesCarregados) => {
            hospedes = hospedesCarregados;
            renderizar();
        })
        .catch((error) => {
            console.error("Erro ao carregar os dados guardados:", error);
            hospedes = [criarHospede()];
            renderizar();
        });
});
