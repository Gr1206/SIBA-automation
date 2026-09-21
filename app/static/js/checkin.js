document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "siba_hospedes_draft";
    let hospedes = (lerRascunho() || [criarHospede()])
        .map(normalizarHospede);
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
            return JSON.parse(localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            console.warn("Rascunho de check-in inválido; a iniciar um novo.", error);
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
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

    // Elementos do DOM
    const tabsContainer = document.getElementById("tabs-container");
    const formCheckin = document.getElementById("form-checkin");
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
    const btnFinalizar = document.getElementById("checkin");

    //Save array & localStorage
    async function salvarAtual() {
        if (hospedes[indiceAtual]) {
            hospedes[indiceAtual].full_name = inputNome.value;
            hospedes[indiceAtual].birth_date = inputNascimento.value;
            hospedes[indiceAtual].nationality = inputNacionalidade.value;
            hospedes[indiceAtual].country_of_residence = inputPaisResidencia.value;
            hospedes[indiceAtual].city_of_residence = inputCidadeResidencia.value;
            hospedes[indiceAtual].id_type = inputTipoDocumento.value;
            hospedes[indiceAtual].id_number = inputDoc.value;
            hospedes[indiceAtual].country_of_issue = inputPaisEmissao.value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hospedes));
        }
        
    }

    // Render form & guest
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

        // button state
        btnAnterior.disabled = indiceAtual === 0;
        btnAnterior.classList.toggle("opacity-50", indiceAtual === 0);

        btnSeguinte.disabled = indiceAtual === hospedes.length - 1;
        btnSeguinte.classList.toggle("opacity-50", indiceAtual === hospedes.length - 1);

        // containers with guest number
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
                indiceAtual = idx; //new guest chosen
                renderizar();
            });
            tabsContainer.appendChild(tab);
        });
    }

    //receives the guest list without the removed guest and updates localStorage
    function removeGuest(guestList) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(guestList));
    }

    //clicks
    inputNome.addEventListener("input", salvarAtual);
    inputNascimento.addEventListener("input", salvarAtual);
    inputNacionalidade.addEventListener("input", salvarAtual);
    inputPaisResidencia.addEventListener("input", salvarAtual);
    inputCidadeResidencia.addEventListener("input", salvarAtual);
    inputTipoDocumento.addEventListener("change", salvarAtual);
    inputDoc.addEventListener("input", salvarAtual);
    inputPaisEmissao.addEventListener("input", salvarAtual);
    btnRemove.addEventListener("click", async () => {
        if (hospedes.length > 1) {
            hospedes.splice(indiceAtual, 1);
            if (indiceAtual >= hospedes.length) {
                indiceAtual = hospedes.length - 1;
            }
            removeGuest(hospedes);
            renderizar();
            await salvarAtual();
        }
    });
    btnAdd.addEventListener("click", () => {
        salvarAtual();
        hospedes.push(criarHospede());
        indiceAtual = hospedes.length - 1; //new guest
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

    formCheckin.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!formCheckin.checkValidity()) {
            formCheckin.reportValidity();
            return;
        }
        await salvarAtual();
        const pathSegments = window.location.pathname.split("/").filter(Boolean);
        const token = pathSegments[pathSegments.length - 1];
        try {
            const response = await fetch("/forms/submit/" + token, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ guests: hospedes })
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`Erro ao enviar os dados (${response.status}): ${errorBody}`);
            }
            localStorage.removeItem(STORAGE_KEY);
            alert("Check-in realizado com sucesso!");
            window.location.href = "/checkinSuccess/"; 
        }
        catch (error) {
            console.error("Erro ao enviar os dados:", error);
            alert("Ocorreu um erro ao enviar os dados. Por favor, tente novamente.");
            return;
        }

    });

    
    renderizar();
});