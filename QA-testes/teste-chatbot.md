# Plano de Testes - Chatbot Atmos (UniAtmos)

Este documento reúne os casos de teste estruturados para validar as respostas, o foco, a precisão e a integração de dados meteorológicos do assistente virtual **Atmos**, com foco nas unidades da UNIP e cidades do Brasil.

---

## 1. Consultas de Clima e Previsão em Tempo Real (Funcionalidade Principal)

### Teste 1.1: Temperatura do Dia (Hoje)
* **Pergunta:** "Qual é a temperatura de hoje em Sorocaba?"
* **Resposta Esperada:** O Atmos deve consultar a API e retornar a temperatura atual em °C, sensação térmica e as condições gerais do céu (ex: "Agora em Sorocaba faz 28°C, com sensação térmica de 29°C e tempo ensolarado").
* **Resposta Real do Atmos:** 

---

### Teste 1.2: Clima do Dia em Campus Específico da UNIP
* **Pergunta:** "Como está o clima hoje no campus UNIP Sorocaba?"
* **Resposta Esperada:** O Atmos deve identificar a localização da unidade da UNIP, consultar os dados atuais e responder com temperatura, umidade e condição do tempo para o campus.
* **Resposta Real do Atmos:** 

---

### Teste 1.3: Previsão para Outros Dias (Amanhã / Final de Semana)
* **Pergunta:** "Qual vai ser a temperatura amanhã em São Paulo?"
* **Resposta Esperada:** O Atmos deve retornar a previsão de temperatura máxima e mínima para o dia seguinte, acompanhada da probabilidade de chuva.
* **Resposta Real do Atmos:** 

---

### Teste 1.4: Previsão de Chuva para Data Específica
* **Pergunta:** "Vai chover no próximo sábado na UNIP Anchieta?"
* **Resposta Esperada:** O Atmos deve informar a previsão de chuva (porcentagem ou volume em mm) e as temperaturas esperadas para a data solicitada na região da unidade.
* **Resposta Real do Atmos:** 

---

## 2. Perguntas Conceituais e Educacionais (Básicas)

### Teste 2.1: Conceito de Temperatura
* **Pergunta:** "O que é temperatura?"
* **Resposta Esperada:** Explicação simples de que a temperatura mede o grau de agitação das moléculas na atmosfera, indicando o nível de calor ou frio.
* **Resposta Real do Atmos:** 

---

### Teste 2.2: Conceito de Umidade do Ar
* **Pergunta:** "O que é umidade do ar?"
* **Resposta Esperada:** Explicação sobre a quantidade de vapor de água na atmosfera e seu impacto na saúde e no bem-estar humano.
* **Resposta Real do Atmos:** 

---

### Teste 2.3: Conceito de Chuva
* **Pergunta:** "Como ocorre a chuva?"
* **Resposta Esperada:** Explicação sucinta sobre o ciclo da água: evaporação, condensação nas nuvens e precipitação.
* **Resposta Real do Atmos:** 

---

### Teste 2.4: Conceito de Vento
* **Pergunta:** "O que causa o vento?"
* **Resposta Esperada:** Explicação de que o vento é o movimento do ar provocado por variações de pressão e temperatura atmosférica.
* **Resposta Real do Atmos:** 

---

## 3. Perguntas Intermediárias (Meteorologia Aplicada)

### Teste 3.1: Diferença entre Clima e Tempo
* **Pergunta:** "Qual é a diferença entre tempo e clima?"
* **Resposta Esperada:** Diferenciar que **tempo** é o estado momentâneo da atmosfera (ex: "está chovendo agora"), enquanto **clima** é o padrão histórico observado ao longo de vários anos.
* **Resposta Real do Atmos:** 

---

### Teste 3.2: Formação de Nuvens
* **Pergunta:** "Como se formam as nuvens?"
* **Resposta Esperada:** Explicação sobre a subida do ar quente e úmido, seu resfriamento e a condensação em gotículas de água.
* **Resposta Real do Atmos:** 

---

### Teste 3.3: Frente Fria
* **Pergunta:** "O que é uma frente fria?"
* **Resposta Esperada:** Descrição da zona de transição onde uma massa de ar frio avança sobre uma massa de ar quente, gerando queda de temperatura e eventuais chuvas.
* **Resposta Real do Atmos:** 

---

## 4. Perguntas Ambíguas e Sem Localização

### Teste 4.1: Consulta de Temperatura Sem Cidade
* **Pergunta:** "Está frio hoje?"
* **Resposta Esperada:** O Atmos deve pedir educadamente que o usuário informe qual é a cidade ou o campus da UNIP desejado para verificar os dados.
* **Resposta Real do Atmos:** 

---

### Teste 4.2: Consulta de Chuva Sem Cidade ou Data
* **Pergunta:** "Vai chover?"
* **Resposta Esperada:** O Atmos deve solicitar a localização e o dia de interesse para apresentar a previsão precisa.
* **Resposta Real do Atmos:** 

---

## 5. Teste de Escopo e Foco (Perguntas Fora do Assunto)

### Teste 5.1: Matemática
* **Pergunta:** "Quanto é 15 x 8?"
* **Resposta Esperada:** O Atmos deve recusar educadamente, lembrando que é um assistente focado em clima e meteorologia.
* **Resposta Real do Atmos:** 

---

### Teste 5.2: Futebol
* **Pergunta:** "Quem ganhou o último jogo do Brasileirão?"
* **Resposta Esperada:** O Atmos deve reforçar que não possui informações esportivas e redirecionar para dúvidas climáticas.
* **Resposta Real do Atmos:** 

---

### Teste 5.3: Programação / Geral
* **Pergunta:** "Como criar um código em JavaScript?"
* **Resposta Esperada:** O Atmos deve informar gentilmente que seu objetivo é auxiliar exclusivamente com informações e conceitos meteorológicos.
* **Resposta Real do Atmos:** 

---

## 6. Teste de Resiliência (Sem Integração / Falha de API)

### Teste 6.1: Fallback Sem Dados da API
* **Pergunta:** "Qual é a temperatura agora em Sorocaba?"
* **Resposta Esperada (Caso a API esteja indisponível):** O Atmos deve informar honestamente que não conseguiu obter os dados em tempo real no momento, sem alucinar ou inventar valores numéricos fictícios.
* **Resposta Real do Atmos:**