# Pesquisa e Comparativo de APIs Meteorológicas - UniAtmos

Análise técnica e validação prática de APIs meteorológicas para suporte ao assistente virtual **Atmos**, cobrindo dados de temperatura, umidade, vento, chuva, previsão do tempo e alertas para as unidades da UNIP no Brasil.

---

## 1. WeatherAPI.com

* **Nome da API:** WeatherAPI
* **Dados fornecidos:** Tempo atual, previsão diária/horária, umidade, velocidade e direção do vento, precipitação, índice UV, dados astronômicos (fases da lua, nascer/pôr do sol) e qualidade do ar.
* **Possui dados em tempo real:** Sim.
* **Possui previsão do tempo:** Sim (até 3 dias no plano gratuito).
* **Plano gratuito:** Sim (100.000 requisições por mês, sem necessidade de cartão de crédito).
* **Limitações:** Históricos mais antigos e previsões estendidas (acima de 3 dias) exigem plano pago.
* **Suporte a cidades do Brasil:** Excelente (busca por nome de cidade, sigla de estado, CEP, coordenadas ou nome de campus).
* **Link da documentação:** [https://www.weatherapi.com/docs/](https://www.weatherapi.com/docs/)

---

## 2. Open-Meteo

* **Nome da API:** Open-Meteo Weather API
* **Dados fornecidos:** Temperatura, umidade relativa, precipitação, rajadas de vento, pressão atmosférica, cobertura de nuvens, radiação solar e variáveis agrícolas.
* **Possui dados em tempo real:** Sim.
* **Possui previsão do tempo:** Sim (até 16 dias de previsão).
* **Plano gratuito:** Sim (100% gratuita para uso não comercial, até 10.000 chamadas/dia, sem necessidade de chave de API).
* **Limitações:** Exige coordenadas geográficas (latitude/longitude), necessitando de geocodificação prévia para pesquisas feitas diretamente pelo nome da cidade.
* **Suporte a cidades do Brasil:** Muito bom (utiliza dados de modelos globais de alta resolução como ECMWF e GFS).
* **Link da documentação:** [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)

---

## 3. HG Brasil Weather

* **Nome da API:** HG Brasil Weather
* **Dados fornecidos:** Temperatura atual, descrição do clima, umidade, velocidade do vento, data/hora e previsão para os próximos dias.
* **Possui dados em tempo real:** Sim.
* **Possui previsão do tempo:** Sim (até 10 dias de previsão).
* **Plano gratuito:** Sim (limite gratuito diário para desenvolvimento).
* **Limitações:** Limite de requisições menor no plano gratuito quando comparado a provedores internacionais.
* **Suporte a cidades do Brasil:** Excelente e nativo (suporta buscas por `city_name=Sorocaba,SP`).
* **Link da documentação:** [https://hgbrasil.com/status/weather](https://hgbrasil.com/status/weather)

---

## 4. OpenWeatherMap (Current & Forecast)

* **Nome da API:** OpenWeatherMap
* **Dados fornecidos:** Condições atuais, previsão por hora e por dia, umidade, pressão, sensação térmica, ponto de orvalho e alertas meteorológicos.
* **Possui dados em tempo real:** Sim.
* **Possui previsão do tempo:** Sim.
* **Plano gratuito:** Sim (1.000 chamadas gratuitas por dia na API One Call 3.0 / 60 chamadas por minuto na API básica de tempo atual).
* **Limitações:** Chaves de API novas levam até 2 horas para sincronização e ativação inicial nos servidores. A API One Call exige cadastro de cartão de crédito para ativação da chave.
* **Suporte a cidades do Brasil:** Excelente e consolidado.
* **Link da documentação:** [https://openweathermap.org/api](https://openweathermap.org/api)

---

## 5. Tomorrow.io

* **Nome da API:** Tomorrow.io Weather API
* **Dados fornecidos:** Temperatura, umidade, vento, precipitação, índice UV e índice de qualidade do ar (EPA).
* **Possui dados em tempo real:** Sim.
* **Possui previsão do tempo:** Sim.
* **Plano gratuito:** Sim (500 chamadas por dia / limite de 30 chamadas por hora).
* **Limitações:** Limite diário de requisições muito reduzido para uso em produção.
* **Suporte a cidades do Brasil:** Bom suporte por geolocalização.
* **Link da documentação:** [https://docs.tomorrow.io/reference/welcome](https://docs.tomorrow.io/reference/welcome)

---

## Tabela Comparativa

| API | Chave de API | Limite Gratuito | Endpoint Unificado | Suporte a Português (`pt`) | Recomendada para o UniAtmos |
|---|---|---|---|---|---|
| **WeatherAPI** | Sim | 100.000 req/mês | Sim (`forecast.json`) | Sim (`lang=pt`) | ⭐ **Ideal (1ª Opção)** |
| **Open-Meteo** | Não | 10.000 req/dia | Sim (via parâmetros HTTP) | Não (retorna valores brutos) | ⭐ **Alternativa Prática** |
| **HG Brasil** | Sim | Cota diária free | Sim (`/weather`) | Sim (Nativo) | ⭐ **Excelente p/ Brasil** |
| **OpenWeather** | Sim (exige cartão) | 1.000 req/dia | Sim (One Call) | Sim (`lang=pt_br`) | Parcial |
| **Tomorrow.io** | Sim | 500 req/dia | Sim | Sim | Não (Limite baixo) |

---

## 6. Resultados das Validações Práticas via Postman

Todos os testes práticos foram executados com foco no município de **Sorocaba - SP** (localização de um dos campus da UNIP):

1. **WeatherAPI.com:**
   * **Status HTTP:** `200 OK`
   * **URL Testada:** `http://api.weatherapi.com/v1/forecast.json?key={API_KEY}&q=Sorocaba&days=3&aqi=yes&alerts=yes&lang=pt`
   * **Resultado:** Resposta rápida e unificada. Retornou localização, clima atual (temperatura, umidade, vento), qualidade do ar e previsão traduzida para o português em uma única chamada JSON.

2. **Open-Meteo:**
   * **Status HTTP:** `200 OK`
   * **URL Testada:** `https://api.open-meteo.com/v1/forecast?latitude=-23.5015&longitude=-47.4526&current=temperature_2m,relative_humidity_2m&timezone=America/Sao_Paulo`
   * **Resultado:** Não exige autenticação por chave. Resposta extremamente rápida, perfeita para testes imediatos de backend via coordenadas geográficas.

3. **HG Brasil Weather:**
   * **Status HTTP:** `200 OK`
   * **URL Testada:** `https://api.hgbrasil.com/weather?key={API_KEY}&city_name=Sorocaba,SP`
   * **Resultado:** Validação bem-sucedida (`"valid_key": true`). Retornou descrições climáticas nativas em português ("Tempo nublado", temperatura em °C) sem necessidade de parâmetros de tradução.

4. **OpenWeatherMap:**
   * **Status HTTP:** `401 Unauthorized` (durante janela de ativação)
   * **Observação de Teste:** Identificado o comportamento de que chaves novas levam até 2 horas para propagação global nos servidores da plataforma.

---

## Recomendação Final para a Equipe de Desenvolvimento

1. **Escolha Principal para Produção: WeatherAPI.com**
   * **Motivo:** Cota gratuita robusta (100 mil requisições/mês), suporte a busca direta pelo nome das cidades das unidades da UNIP, tradução nativa em português (`lang=pt`) e dados completos (clima + previsão + qualidade do ar) retornados numa única chamada.

2. **Escolha Secundária para Protótipos: Open-Meteo**
   * **Motivo:** Dispensa cadastro e criação de chaves, permitindo que a equipe de backend faça testes e integrações locais imediatas.