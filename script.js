// FUNÇÃO PARA TROCAR ABAS
function abrirAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(idAba).classList.add('active');
    event.currentTarget.classList.add('active');
}

// LÓGICA DO SISTEMA
const tabela = document.querySelector('#tabelaItens');
const btnAdicionar = document.querySelector('#btnAdicionar');
const inputBusca = document.querySelector('#inputBusca');

let estoque = JSON.parse(localStorage.getItem('meuEstoque')) || [];

function renderizarTabela(dadosParaExibir = estoque) {
    tabela.innerHTML = '';
    dadosParaExibir.forEach((item, index) => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${item.nome}</td>
            <td>${item.qtd}</td>
            <td><button class="btn-remover" onclick="removerItem(${index})">❌</button></td>
        `;
        tabela.appendChild(linha);
    });
}

btnAdicionar.addEventListener('click', () => {
    const nome = document.querySelector('#nomeItem').value;
    const qtd = document.querySelector('#qtdItem').value;

    if (nome && qtd) {
        estoque.push({ nome, qtd });
        localStorage.setItem('meuEstoque', JSON.stringify(estoque));
        
        // Limpa campos e volta para a aba de estoque
        document.querySelector('#nomeItem').value = '';
        document.querySelector('#qtdItem').value = '';
        renderizarTabela();
        abrirAba('estoque');
        alert("Item cadastrado!");
    }
});

window.removerItem = (index) => {
    estoque.splice(index, 1);
    localStorage.setItem('meuEstoque', JSON.stringify(estoque));
    renderizarTabela();
};

inputBusca.addEventListener('input', () => {
    const termo = inputBusca.value.toLowerCase();
    const filtrados = estoque.filter(i => i.nome.toLowerCase().includes(termo));
    renderizarTabela(filtrados);
});

renderizarTabela();