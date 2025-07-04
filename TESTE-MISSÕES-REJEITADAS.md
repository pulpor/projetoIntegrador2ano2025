# Teste de Missões Rejeitadas

## Como testar o comportamento de missões rejeitadas:

### Pré-requisitos:
1. Servidor backend rodando: `cd backend && node server.js`
2. Usuário "g" logado (senha: "g123")
3. Pelo menos uma missão submetida pelo usuário

### Passos para testar:

#### 1. Como Aluno (g):
1. Acesse `frontend/student.html`
2. Faça login com usuário "g" e senha "g123"
3. Submeta uma missão qualquer
4. Verifique que a missão desaparece do painel principal
5. Vá para a aba "Meu Histórico" e veja a missão com status "Pendente"

#### 2. Como Mestre:
1. Acesse `frontend/master.html`
2. Faça login com usuário "mestre" e senha "fullstack123"
3. Vá para a seção de submissões
4. Encontre a submissão do usuário "g"
5. **Rejeite a submissão** com feedback

#### 3. Como Aluno novamente:
1. Volte para `frontend/student.html` (ou recarregue a página)
2. **Verifique que a missão rejeitada voltou para o painel principal**
3. A missão deve ter:
   - Badge laranja "Rejeitada - Reenvie"
   - Borda lateral laranja
   - Mensagem explicativa sobre poder submeter novamente
4. Vá para "Meu Histórico" e veja a missão com status "Rejeitada" e feedback do mestre

### Comportamento esperado:

#### No Painel Principal:
- ✅ Missões nunca submetidas: aparecem normalmente
- ✅ Missões rejeitadas: aparecem com indicação visual especial
- ❌ Missões pendentes: não aparecem (ficam só no histórico)
- ❌ Missões aprovadas: não aparecem (ficam só no histórico)

#### No Histórico:
- ✅ Todas as submissões aparecem com status correto
- ✅ Missões rejeitadas mostram feedback do mestre

### Logs a verificar no console:
```
[DEBUG STUDENT] Submissões por status:
[DEBUG STUDENT] - Pendentes: X
[DEBUG STUDENT] - Aprovadas: X  
[DEBUG STUDENT] - Rejeitadas: X
[DEBUG STUDENT] Missões removidas do painel (pendentes + aprovadas): [IDs]
[DEBUG STUDENT] Missões que voltam para o painel (rejeitadas): [IDs]
```

### Dados de teste atuais:
- Usuário "g" (ID: 2) já tem submissões:
  - Missão 6: múltiplas submissões (aprovada, rejeitada, pendente)
  - Missão 8: pendente

Se você rejeitar mais uma submissão, ela deve voltar ao painel automaticamente.
