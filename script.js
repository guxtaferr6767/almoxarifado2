// DADOS
let estoque = JSON.parse(localStorage.getItem('meuEstoque')) || [];
let usuarios = JSON.parse(localStorage.getItem('meusUsuarios')) || [];

// --- LÓGICA DE LOGIN ---
document.querySelector('#btnEntrar').addEventListener('click', () => {
    const nome = document.querySelector('#loginNome').value;
    const senha = document.querySelector('#loginSenha').value;

    // Procura se existe um usuário com esse nome e senha
    const usuarioValido = usuarios.find(u => u.nome === nome && u.senha === senha);

    if (usuarioValido || (nome === 'admin' && senha === '123')) { // Admin padrão caso esteja vazio
        document.querySelector('#tela-login').style.display = 'none';
        document.querySelector('#sistema-principal').style.display = 'block';
        renderizarEstoque();
        renderizarUsuarios();
    } else {
        alert("Usuário ou senha incorretos!");
    }
});

function fazerLogout() {
    location.reload(); // Recarrega a página e volta para o login
}

// --- CONTROLE DE ABAS ---
function abrirAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idAba).classList.add('active');
}

// --- LOGICA DE ESTOQUE ---
function renderizarEstoque() {
    const tabela = document.querySelector('#tabelaItens');
    tabela.innerHTML = '';
    estoque.forEach((item, index) => {
        tabela.innerHTML += `<tr><td>${item.nome}</td><td>${item.qtd}</td><td><button onclick="removerItem(${index})">❌</button></td></tr>`;
    });
}

document.querySelector('#btnAdicionar').addEventListener('click', () => {
    const nome = document.querySelector('#nomeItem').value;
    const qtd = document.querySelector('#qtdItem').value;
    if (nome && qtd) {
        estoque.push({ nome, qtd });
        localStorage.setItem('meuEstoque', JSON.stringify(estoque));
        renderizarEstoque();
        abrirAba('estoque');
        document.querySelector('#nomeItem').value = '';
        document.querySelector('#qtdItem').value = '';
    }
});

window.removerItem = (index) => {
    estoque.splice(index, 1);
    localStorage.setItem('meuEstoque', JSON.stringify(estoque));
    renderizarEstoque();
};

// --- LOGICA DE USUÁRIOS ---
function renderizarUsuarios() {
    const tabelaU = document.querySelector('#tabelaUsuarios');
    tabelaU.innerHTML = '';
    usuarios.forEach((u, index) => {
        tabelaU.innerHTML += `<tr><td>${u.nome}</td><td>${u.cargo}</td><td>••••</td><td><button onclick="removerUsuario(${index})">❌</button></td></tr>`;
    });
}

document.querySelector('#btnAdicionarUsuario').addEventListener('click', () => {
    const nome = document.querySelector('#nomeUsuario').value;
    const cargo = document.querySelector('#cargoUsuario').value;
    const senha = document.querySelector('#senhaUsuario').value;
    if (nome && cargo && senha) {
        usuarios.push({ nome, cargo, senha });
        localStorage.setItem('meusUsuarios', JSON.stringify(usuarios));
        renderizarUsuarios();
        document.querySelector('#nomeUsuario').value = '';
        document.querySelector('#cargoUsuario').value = '';
        document.querySelector('#senhaUsuario').value = '';
    }
});

window.removerUsuario = (index) => {
    usuarios.splice(index, 1);
    localStorage.setItem('meusUsuarios', JSON.stringify(usuarios));
    renderizarUsuarios();
};
// No início do arquivo, adicione a lista de histórico
let historico = JSON.parse(localStorage.getItem('meuHistorico')) || [];

// Função para registrar um evento
function registrarAcao(acao, item, qtd) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString() + " " + agora.toLocaleTimeString();
    
    historico.unshift({ data: dataFormatada, acao, item, qtd }); // Adiciona no topo
    localStorage.setItem('meuHistorico', JSON.stringify(historico));
    renderizarHistorico();
}

// Função para desenhar a tabela de histórico
function renderizarHistorico() {
    const tabelaH = document.querySelector('#tabelaHistorico');
    if (!tabelaH) return;
    tabelaH.innerHTML = '';
    historico.forEach(h => {
        tabelaH.innerHTML += `
            <tr>
                <td>${h.data}</td>
                <td>${h.acao}</td>
                <td>${h.item}</td>
                <td>${h.qtd}</td>
            </tr>`;
    });
}

// ATUALIZAÇÃO NO BOTÃO ADICIONAR ITEM:
// Dentro do evento 'click' do btnAdicionar, antes de limpar os campos, adicione:
registrarAcao("Entrada", nome, qtd);

// ATUALIZAÇÃO NA FUNÇÃO REMOVER ITEM:
// Dentro da função removerItem, antes do splice, adicione:
registrarAcao("Saída", estoque[index].nome, estoque[index].qtd);

// Função para limpar histórico
window.limparHistorico = () => {
    if(confirm("Deseja apagar todo o histórico?")) {
        historico = [];
        localStorage.setItem('meuHistorico', JSON.stringify(historico));
        renderizarHistorico();
    }
};

// Não esqueça de chamar no final do arquivo:
renderizarHistorico();