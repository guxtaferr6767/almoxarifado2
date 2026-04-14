// --- CONFIGURAÇÃO SUPABASE ---
// Substitua pelos seus dados reais do painel do Supabase
const supabaseUrl = 'https://hxchnmqlytjfzluzatrt.supabase.co';
const supabaseKey = 'sb_publishable_ncReiBGjGm5YBhaI2zln1Q_RKLlCKeY';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Variáveis de estado (Globais)
let estoque = [];
let usuarios = [];
let historico = [];
let usuarioLogado = "admin"; // Padrão caso algo falhe no login

// --- INICIALIZAÇÃO ---
async function carregarDadosIniciais() {
    try {
        // Busca estoque atualizado
        const { data: dataEstoque } = await _supabase.from('estoque').select('*').order('nome');
        estoque = dataEstoque || [];

        // Busca usuários
        const { data: dataUsuarios } = await _supabase.from('usuarios').select('*');
        usuarios = dataUsuarios || [];

        // Busca histórico (do mais recente para o mais antigo)
        const { data: dataHistorico } = await _supabase.from('historico').select('*').order('created_at', { ascending: false });
        historico = dataHistorico || [];

        // Atualiza todas as tabelas na tela
        renderizarEstoque();
        renderizarUsuarios();
        renderizarHistorico();
    } catch (error) {
        console.error("Erro ao carregar dados:", error.message);
    }
}

// --- LÓGICA DE LOGIN ---
document.querySelector('#btnEntrar').addEventListener('click', async () => {
    const nome = document.querySelector('#loginNome').value;
    const senha = document.querySelector('#loginSenha').value;

    const { data: user, error } = await _supabase
        .from('usuarios')
        .select('*')
        .eq('nome', nome)
        .eq('senha', senha)
        .single();

    if (user) {
        usuarioLogado = user.nome; // Salva o nome de quem entrou para o histórico
        document.querySelector('#tela-login').style.display = 'none';
        document.querySelector('#sistema-principal').style.display = 'block';
        carregarDadosIniciais();
    } else {
        alert("Usuário ou senha incorretos!");
    }
});

function fazerLogout() { location.reload(); }

// --- CONTROLE DE ABAS ---
function abrirAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const abaAlvo = document.getElementById(idAba);
    if(abaAlvo) abaAlvo.classList.add('active');
    
    // Marca o botão clicado como ativo
    if(event && event.currentTarget) event.currentTarget.classList.add('active');
}

// --- GESTÃO DE ESTOQUE ---

// Filtro de pesquisa em tempo real
document.querySelector('#inputBusca').addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    const filtrados = estoque.filter(i => i.nome.toLowerCase().includes(termo));
    renderizarEstoque(filtrados);
});

function renderizarEstoque(listaParaExibir = estoque) {
    const tabela = document.querySelector('#tabelaItens');
    if (!tabela) return;
    tabela.innerHTML = '';
    
    listaParaExibir.forEach((item) => {
        tabela.innerHTML += `
            <tr>
                <td>${item.nome}</td>
                <td><strong>${item.qtd}</strong></td>
                <td>
                    <button onclick="darBaixa(${item.id}, ${item.qtd}, '${item.nome}')" style="background: #e67e22; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">⬇️ Baixa</button>
                    <button onclick="removerItem(${item.id}, '${item.nome}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">❌</button>
                </td>
            </tr>`;
    });
}

document.querySelector('#btnAdicionar').addEventListener('click', async () => {
    const nomeInput = document.querySelector('#nomeItem');
    const qtdInput = document.querySelector('#qtdItem');
    const nome = nomeInput.value.trim();
    const qtd = parseInt(qtdInput.value);

    if (nome && !isNaN(qtd) && qtd > 0) {
        const itemExistente = estoque.find(i => i.nome.toLowerCase() === nome.toLowerCase());

        if (itemExistente) {
            const novaQtd = itemExistente.qtd + qtd;
            await _supabase.from('estoque').update({ qtd: novaQtd }).eq('id', itemExistente.id);
            await registrarAcao("Entrada", nome, qtd, itemExistente.id);
        } else {
            const { data: novoItem } = await _supabase.from('estoque').insert([{ nome, qtd }]).select().single();
            if (novoItem) await registrarAcao("Entrada", nome, qtd, novoItem.id);
        }

        await carregarDadosIniciais();
        nomeInput.value = '';
        qtdInput.value = '';
        abrirAba('estoque');
    }
});

window.darBaixa = async (id, qtdAtual, nome) => {
    const qtdBaixa = parseInt(prompt(`Quantas unidades de "${nome}" deseja retirar?`));
    
    if (!isNaN(qtdBaixa) && qtdBaixa > 0) {
        if (qtdBaixa <= qtdAtual) {
            const novaQtd = qtdAtual - qtdBaixa;
            await _supabase.from('estoque').update({ qtd: novaQtd }).eq('id', id);
            await registrarAcao("Saída (Pedido)", nome, qtdBaixa, id);
            await carregarDadosIniciais();
        } else {
            alert("Quantidade insuficiente em estoque!");
        }
    }
};

window.removerItem = async (id, nome) => {
    if(confirm(`Remover "${nome}" permanentemente?`)) {
        try {
            // Registra no histórico ANTES de deletar para evitar erro de chave estrangeira
            await registrarAcao("Exclusão", nome, 0, id);
            await _supabase.from('estoque').delete().eq('id', id);
            await carregarDadosIniciais();
        } catch (e) {
            console.error("Erro ao excluir item:", e);
        }
    }
};

// --- GESTÃO DE USUÁRIOS ---
function renderizarUsuarios() {
    const tabelaU = document.querySelector('#tabelaUsuarios');
    if (!tabelaU) return;
    tabelaU.innerHTML = '';
    usuarios.forEach((u) => {
        const acaoHtml = u.nome.toLowerCase() === 'admin' 
            ? `🛡️` 
            : `<button onclick="removerUsuario(${u.id})" style="background:none; border:none; cursor:pointer;">❌</button>`;

        tabelaU.innerHTML += `<tr><td>${u.nome}</td><td>${u.cargo}</td><td>••••</td><td style="text-align:center">${acaoHtml}</td></tr>`;
    });
}

document.querySelector('#btnAdicionarUsuario').addEventListener('click', async () => {
    const nome = document.querySelector('#nomeUsuario').value;
    const cargo = document.querySelector('#cargoUsuario').value;
    const senha = document.querySelector('#senhaUsuario').value;

    if (nome && cargo && senha) {
        await _supabase.from('usuarios').insert([{ nome, cargo, senha }]);
        await carregarDadosIniciais();
        document.querySelector('#nomeUsuario').value = '';
        document.querySelector('#cargoUsuario').value = '';
        document.querySelector('#senhaUsuario').value = '';
    }
});

window.removerUsuario = async (id) => {
    const alvo = usuarios.find(u => u.id === id);
    if (alvo && alvo.nome.toLowerCase() === 'admin') {
        alert("O admin não pode ser removido!");
        return;
    }
    if(confirm(`Remover usuário ${alvo.nome}?`)) {
        await _supabase.from('usuarios').delete().eq('id', id);
        await carregarDadosIniciais();
    }
};

// --- HISTÓRICO E FILTROS ---

async function registrarAcao(acao, nome_item, qtd, id_do_item = null) {
    try {
        await _supabase.from('historico').insert([
            { 
                acao: acao, 
                nome_item: nome_item, 
                qtd: parseInt(qtd),
                item_id: id_do_item,
                usuario_nome: usuarioLogado
            }
        ]);
    } catch (err) {
        console.error("Erro histórico:", err);
    }
}

function filtrarHistorico() {
    const tipoFiltro = document.querySelector('#filtroTipo').value;
    if (tipoFiltro === "Todos") {
        renderizarHistorico(historico);
    } else {
        const filtrados = historico.filter(h => h.acao === tipoFiltro);
        renderizarHistorico(filtrados);
    }
}

function renderizarHistorico(listaParaExibir = historico) {
    const tabelaH = document.querySelector('#tabelaHistorico');
    if (!tabelaH) return;
    tabelaH.innerHTML = '';

    listaParaExibir.forEach(h => {
        const data = new Date(h.created_at).toLocaleString('pt-BR');
        let corAcao = "#2c3e50";
        if (h.acao === 'Entrada') corAcao = "#27ae60";
        if (h.acao.includes('Saída')) corAcao = "#e67e22";
        if (h.acao === 'Exclusão') corAcao = "#e74c3c";

        tabelaH.innerHTML += `
            <tr>
                <td style="font-size: 0.85rem; color: #7f8c8d;">${data}</td>
                <td><span style="color: ${corAcao}; font-weight: bold;">${h.acao}</span></td>
                <td>${h.nome_item}</td>
                <td>${h.qtd}</td>
                <td><small>👤 ${h.usuario_nome || 'Sistema'}</small></td>
            </tr>`;
    });
}

window.limparHistorico = async () => {
    if(confirm("Deseja apagar todo o histórico?")) {
        await _supabase.from('historico').delete().neq('id', 0);
        await carregarDadosIniciais();
    }
};