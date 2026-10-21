# Plano de Testes da Interface Web - UniAtmos

Documento voltado para a validação da interface visual, responsividade, navegação e integração do componente de chat do assistente **Atmos**.

---

## 1. Navegação e Estrutura (Navbar & Footer)

### Teste 1.1: Links do Menu Superior (Navbar)
* **Ação:** Clicar nos links da barra de navegação (**Ajuda**, **Sobre**, **Créditos**).
* **Resultado Esperado:** O site deve rolar suavemente ou navegar para as respectivas seções sem erros de link quebrado (404).
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado

### Teste 1.2: Rodapé (Footer)
* **Ação:** Verificar o carregamento das informações e links do rodapé da página.
* **Resultado Esperado:** O rodapé deve estar alinhado no fim da página sem cobrir a caixa do chat.
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado

---

## 2. Seleção de Unidades da UNIP (Foco no Brasil)

### Teste 2.1: Filtro/Seleção por Unidade Federativa / Campus
* **Ação:** Selecionar somente a unip de sorocaba.
* **Resultado Esperado:** O site deve atualizar as informações meteorológicas da região correspondente ao campus selecionado.
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado

---

## 3. Interface do Chatbot Atmos

### Teste 3.1: Exibição Central do Chat
* **Ação:** Acessar a área do chatbot no centro da tela.
* **Resultado Esperado:** O chat deve estar bem posicionado, responsivo e com a mensagem de apresentação do Atmos visível.
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado

### Teste 3.2: Envio e Recebimento de Mensagens
* **Ação:** Digitar uma mensagem e pressionar a tecla "Enter" ou clicar no botão de enviar.
* **Resultado Esperado:** A mensagem do usuário deve ser exibida no balão de conversa e a resposta do Atmos deve ser renderizada corretamente.
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado

---

## 4. Responsividade

### Teste 4.1: Visualização em Dispositivos Móveis
* **Ação:** Redimensionar o navegador ou abrir o site em telas pequenas (smartphones e tablets).
* **Resultado Esperado:** O layout, o menu e a caixa de chat devem se ajustar sem quebrar elementos ou ocultar botões importantes.
* **Status:** [ ] Pendente | [ ] Aprovado | [ ] Reprovado