document.addEventListener("DOMContentLoaded", () => {
    const botao = document.getElementById("btn-teste");
    const mensagem = document.getElementById("mensagem-resposta");

    botao.addEventListener("click", () => {
        mensagem.textContent = "JavaScript carregado e a correr com sucesso no navegador!";
        mensagem.classList.remove("hidden");
    });
});
