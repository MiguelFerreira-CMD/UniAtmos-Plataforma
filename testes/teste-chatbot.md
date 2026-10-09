# Plano de Testes - Chatbot Atmos (UniAtmos)

Este documento reúne os casos de teste estruturados para validar as respostas, o foco e a precisão do assistente virtual **Atmos**, garantindo que ele responda corretamente sobre meteorologia no contexto do Brasil e das unidades da UNIP.

---

## 1. Perguntas Básicas

### Teste 1.1: Conceito de Temperatura
* **Pergunta:** "O que é temperatura?"
* **Resposta Esperada:** Explicação clara e objetiva de que a temperatura mede o grau de agitação das moléculas, indicando o nível de calor ou frio na atmosfera.
* **Resposta Real do Atmos:** 

---

### Teste 1.2: Conceito de Umidade do Ar
* **Pergunta:** "O que é umidade do ar?"
* **Resposta Esperada:** Explicação sobre a quantidade de vapor de água presente na atmosfera e sua importância para a saúde e para o clima.
* **Resposta Real do Atmos:** 

---

### Teste 1.3: O que é Chuva
* **Pergunta:** "Como ocorre a chuva?"
* **Resposta Esperada:** Explicação sucinta sobre o ciclo da água: evaporação, condensação do vapor em nuvens e precipitação em forma de gotas.
* **Resposta Real do Atmos:** 

---

### Teste 1.4: O que é Vento
* **Pergunta:** "O que causa o vento?"
* **Resposta Esperada:** Explicação de que o vento é o deslocamento do ar provocado por diferenças de pressão e temperatura na atmosfera.
* **Resposta Real do Atmos:** 

---

## 2. Perguntas Intermediárias

### Teste 2.1: Diferença entre Clima e Tempo
* **Pergunta:** "Qual é a diferença entre tempo e clima?"
* **Resposta Esperada:** Diferenciar que **tempo** é o estado momentâneo da atmosfera (ex: "está chovendo agora"), enquanto **clima** é o padrão observado ao longo de muitos anos.
* **Resposta Real do Atmos:** 

---

### Teste 2.2: Formação de Nuvens
* **Pergunta:** "Como se formam as nuvens?"
* **Resposta Esperada:** Explicação sobre o resfriamento do ar quente e úmido que sobe, fazendo o vapor se condensar em pequenas gotas ou cristais de gelo.
* **Resposta Real do Atmos:** 

---

### Teste 2.3: Frente Fria
* **Pergunta:** "O que é uma frente fria?"
* **Resposta Esperada:** Descrição da zona de transição onde uma massa de ar frio avança e empurra uma massa de ar quente, causando queda de temperatura e eventuais chuvas.
* **Resposta Real do Atmos:** 

---

## 3. Perguntas Fora do Assunto (Teste de Foco do Chatbot)

### Teste 3.1: Matemática
* **Pergunta:** "Quanto é 15 x 8?"
* **Resposta Esperada:** O Atmos deve recusar educadamente, reforçando que é um assistente focado exclusivamente em meteorologia e condições climáticas.
* **Resposta Real do Atmos:** 

---

### Teste 3.2: Futebol
* **Pergunta:** "Quem é o líder do Campeonato Brasileiro?"
* **Resposta Esperada:** O Atmos deve informar que não possui dados esportivos e redirecionar a conversa para assuntos de tempo e clima.
* **Resposta Real do Atmos:** 

---

### Teste 3.3: Tecnologia / Programação
* **Pergunta:** "Como criar uma função em JavaScript?"
* **Resposta Esperada:** O Atmos deve direcionar o usuário para dúvidas de meteorologia, recusando tópicos de programação.
* **Resposta Real do Atmos:** 

---

## 4. Perguntas Ambíguas

### Teste 4.1: Temperatura Local Sem Contexto
* **Pergunta:** "Está frio hoje?"
* **Resposta Esperada:** O Atmos deve solicitar a cidade ou a unidade da UNIP sobre a qual o usuário deseja saber a temperatura.
* **Resposta Real do Atmos:** 

---

### Teste 4.2: Previsão Genérica
* **Pergunta:** "Vai chover?"
* **Resposta Esperada:** O Atmos deve perguntar qual é a região ou cidade de interesse para consultar a previsão do tempo.
* **Resposta Real do Atmos:** 

---

## 5. Perguntas de Dados Atuais (Teste de Fallback / Alucinação)

### Teste 5.1: Temperatura em Tempo Real
* **Pergunta:** "Qual é a temperatura agora no campus de Sorocaba?"
* **Resposta Esperada:** 
  * *Com API conectada:* Retornar a temperatura atualizada via API.
  * *Sem API conectada:* Informar honestamente que os dados em tempo real ainda não estão integrados, sem inventar valores fictícios.
* **Resposta Real do Atmos:**