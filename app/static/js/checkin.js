document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "siba_hospedes_draft";
    let hospedes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
        { nome: "", documento: "" }
    ];
    let indiceAtual = 0;

    // Elementos do DOM
    const tabsContainer = document.getElementById("tabs-container");
    const inputNome = document.getElementById("campo-nome");
    const inputDoc = document.getElementById("campo-doc");
    const btnAdd = document.getElementById("btn-add-hospede");
    const btnRemove = document.getElementById("btn-remove-hospede");
    const btnAnterior = document.getElementById("btn-anterior");
    const btnSeguinte = document.getElementById("btn-seguinte");
    const btnFinalizar = document.getElementById("checkin");

    //Save array & localStorage
    function salvarAtual() {
        if (hospedes[indiceAtual]) {
            hospedes[indiceAtual].nome = inputNome.value;
            hospedes[indiceAtual].documento = inputDoc.value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(hospedes));
        }
    }

    // Render form & guest
    function renderizar() {
        
        const atual = hospedes[indiceAtual];
        inputNome.value = atual ? atual.nome : "";
        inputDoc.value = atual ? atual.documento : "";

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
    inputDoc.addEventListener("input", salvarAtual);
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
        hospedes.push({ nome: "", documento: "" });
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

    btnFinalizar.addEventListener("click", () => {
        salvarAtual();
        console.log("Payload pronto para o backend:", hospedes);
        alert(`Sucesso! ${hospedes.length} hóspede(s) gravado(s) no localStorage.`);
    });

    
    renderizar();
});