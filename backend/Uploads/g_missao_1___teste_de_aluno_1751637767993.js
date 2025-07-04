// crie uma função p criar o baralho
function criarBaralho() {
  // nela faça um 'let' baralho contendo um array vazio
  let baralho = [];

  // faça uma 'const' com os naipes ♣️♥️♦️♠️
  const naipes = ["♣️", "♥️", "♦️", "♠️"];

  //crie uma 'const' com os valores
  // 2,3,4,5,6,7,8,9,10,J,Q,K,A
  const valores = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

  // para cada naipe acrescente os valores em baralho
  for (let naipe of naipes) {
    for (let valor of valores) {
      // faca com que os valor sejam acrescentados da var baralho
      baralho.push({ naipe, valor });
    }
  }

  return baralho;
}

// faça uma função para embaralhar o baralho
function embaralharBaralho(baralho) {
  for (let i = baralho.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
  }
}

// faça uma função para retornar o valor de cartas
function valorCarta(carta) {
  // se o valor dela for A = 1, KJQ = 10, e os outros valores são eles mesmos
  if (carta.valor === "A") {
    return 1;
  } else if (["K", "Q", "J"].includes(carta.valor)) {
    return 10;
  } else {
    return parseInt(carta.valor);
  }
}

function obterPontuacao(mao) {
  let pontuacao = 0;
  let possuiAs = false;

  for (let carta of mao) {
    pontuacao += valorCarta(carta);
    if(carta.valor === "A") {
      possuiAs = true;
    }
  }

  if (pontuacao > 21 && possuiAs) {
    pontuacao -= 10; // Considera o Ás como 1
  }

  return pontuacao;
}

function estourou(mao) {
  return obterPontuacao(mao) > 21;
}

function obterProximaCarta() {
  // o pop serve para retirar o último elemento do array
  return baralho.pop();
}

function mostrarMao(mao, elementoId) {
  const elementoMao = document.getElementById(elementoId);
  elementoMao.innerHTML = ''; // Limpa o conteúdo anterior

  for(let carta of mao){
    const elementoCarta = document.createElement('div');
    elementoCarta.className = 'card';
    elementoCarta.textContent = `${carta.valor} ${carta.naipe}`;
    elementoMao.appendChild(elementoCarta);
  }
}

function contarTotalCartas(mao){
  let total = 0;
  for(let carta of mao){
    total += valorCarta(carta);
  }
  return total;
}

function atualizarTotalCartas() {
  const totalBanca = contarTotalCartas(maoBanca);
  const totalJogador = contarTotalCartas(maoJogador);

  document.getElementById('total-cartas-banca').textContent = `Total Banca: ${totalBanca}`;
  document.getElementById('total-cartas-jogador').textContent = `Total Jogador: ${totalJogador}`;
}

function mostrarMaos(){
  mostrarMao(maoBanca, 'cartas-banca');
  mostrarMao(maoJogador, 'cartas-jogador');
  atualizarTotalCartas();
}

function fimJogo(){
  document.getElementById('jogar').disabled = false;
  document.getElementById('comprar').disabled = true;
  document.getElementById('parar').disabled = true;

  mostrarMaos();

  if(estourou(maoJogador)){
    document.getElementById('resultado').textContent = 'Você estourou! A banca ganhou.';
    vitoriasBanca++;
  } else if(estourou(maoBanca)){
    document.getElementById('resultado').textContent = 'A banca estourou! Você ganhou.';
    vitoriasJogador++;
  } else if (obterPontuacao(maoJogador) > obterPontuacao(maoBanca)) {
    document.getElementById('resultado').textContent = 'Você ganhou!';
    vitoriasJogador++;
  } else if (obterPontuacao(maoJogador) < obterPontuacao(maoBanca)) {
    document.getElementById('resultado').textContent = 'A banca ganhou!';
    vitoriasBanca++;
  } else {
    document.getElementById('resultado').textContent = 'Empate!';
  }

  atualizarContadoresVitorias();
}

function turnoDealer(){
  while (obterPontuacao(maoBanca) < 17) {
    maoBanca.push(obterProximaCarta());
  }

  fimJogo();
}

function atualizarContadoresVitorias(){
  document.getElementById('vitorias-jogador').textContent = `Vitórias do Jogador: ${vitoriasJogador}`;
  document.getElementById('vitorias-banca').textContent = `Vitórias da Banca: ${vitoriasBanca}`;
}

function iniciarJogo(){
  baralho = criarBaralho();
  embaralharBaralho(baralho);
  maoBanca = [obterProximaCarta(), obterProximaCarta()];  // manda 2 cartas
  maoJogador = [obterProximaCarta(), obterProximaCarta()]; // manda 2 cartas

  document.getElementById('jogar').disabled = true;
  document.getElementById('comprar').disabled = false;
  document.getElementById('parar').disabled = false;
  document.getElementById('resultado').textContent = '';

  mostrarMaos();
}

// variáveis globais
let baralho = [];
let maoBanca = [];
let maoJogador = [];
let vitoriasJogador = 0;
let vitoriasBanca = 0;

// adiciona um evento de clique ao botao "distribuir"
document.getElementById('jogar').addEventListener('click', iniciarJogo);

// adiciona um evento de clique ao botao "comprar"
document.getElementById('comprar').addEventListener('click', 
  function() {
    maoJogador.push(obterProximaCarta());
    mostrarMaos();
    if (estourou(maoJogador)) {
      fimJogo();
    }
  }
);

// adiciona um evento de clique ao botao "parar"
document.getElementById('parar').addEventListener('click', function() {
  turnoDealer();
});

//inicia o jogo ao carregar a página
iniciarJogo();
