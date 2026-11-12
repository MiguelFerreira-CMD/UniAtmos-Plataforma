1. Consultas de Clima e Previsão em Tempo Real (Funcionalidade Principal)

Teste 1.1: Temperatura do Dia (Hoje)

Pergunta: "Qual é a temperatura de hoje em Sorocaba?"

Resposta Esperada: O Atmos deve consultar a API e retornar a temperatura atual em °C, sensação térmica e as condições gerais do céu (ex: "Agora em Sorocaba faz 28°C, com sensação térmica de 29°C e tempo ensolarado").

Resposta Real do Atmos:

Teste 1.2: Clima do Dia em Campus Específico da UNIP

Pergunta: "Como está o clima hoje no campus UNIP Sorocaba?"

Resposta Esperada: O Atmos deve identificar a localização da unidade da UNIP, consultar os dados atuais e responder com temperatura, umidade e condição do tempo para o campus.

Resposta Real do Atmos:

Teste 1.3: Previsão para Outros Dias (Amanhã / Final de Semana)

Pergunta: "Qual vai ser a temperatura amanhã em São Paulo?"

Resposta Esperada: O Atmos deve retornar a previsão de temperatura máxima e mínima para o dia seguinte, acompanhada da probabilidade de chuva.

Resposta Real do Atmos:

Teste 1.4: Previsão de Chuva para Data Específica

Pergunta: "Vai chover no próximo sábado na UNIP Anchieta?"

Resposta Esperada: O Atmos deve informar a previsão de chuva (porcentagem ou volume em mm) e as temperaturas esperadas para a data solicitada na região da unidade.

Resposta Real do Atmos:

2. Perguntas Conceituais e Educacionais (Básicas)

Teste 2.1: Conceito de Temperatura

Pergunta: "O que é temperatura?"

Resposta Esperada: Explicação simples de que a temperatura mede o grau de agitação das moléculas na atmosfera, indicando o nível de calor ou frio.

Resposta Real do Atmos:

Teste 2.2: Conceito de Umidade do Ar

Pergunta: "O que é umidade do ar?"

Resposta Esperada: Explicação sobre a quantidade de vapor de água na atmosfera e seu impacto na saúde e no bem-estar humano.

Resposta Real do Atmos:

Teste 2.3: Conceito de Chuva

Pergunta: "Como ocorre a chuva?"

Resposta Esperada: Explicação sucinta sobre o ciclo da água: evaporação, condensação nas nuvens e precipitação.

Resposta Real do Atmos:

Teste 2.4: Conceito de Vento

Pergunta: "O que causa o vento?"

Resposta Esperada: Explicação de que o vento é o movimento do ar provocado por variações de pressão e temperatura atmosférica.

Resposta Real do Atmos:

3. Perguntas Intermediárias (Meteorologia Aplicada)

Teste 3.1: Diferença entre Clima e Tempo

Pergunta: "Qual é a diferença entre tempo e clima?"

Resposta Esperada: Diferenciar que tempo é o estado momentâneo da atmosfera (ex: "está chovendo agora"), enquanto clima é o padrão histórico observado ao longo de vários anos.

Resposta Real do Atmos:

Teste 3.2: Formação de Nuvens

Pergunta: "Como se formam as nuvens?"

Resposta Esperada: Explicação sobre a subida do ar quente e úmido, seu resfriamento e a condensação em gotículas de água.

Resposta Real do Atmos:

Teste 3.3: Frente Fria

Pergunta: "O que é uma frente fria?"

Resposta Esperada: Descrição da zona de transição onde uma massa de ar frio avança sobre uma massa de ar quente, gerando queda de temperatura e eventuais chuvas.

Resposta Real do Atmos:

4. Perguntas Ambíguas e Sem Localização

Teste 4.1: Consulta de Temperatura Sem Cidade

Pergunta: "Está frio hoje?"

Resposta Esperada: O Atmos deve pedir educadamente que o usuário informe qual é a cidade ou o campus da UNIP desejado para verificar os dados.

Resposta Real do Atmos:

Teste 4.2: Consulta de Chuva Sem Cidade ou Data

Pergunta: "Vai chover?"

Resposta Esperada: O Atmos deve solicitar a localização e o dia de interesse para apresentar a previsão precisa.

Resposta Real do Atmos:

5. Teste de Escopo e Foco (Perguntas Fora do Assunto)

Teste 5.1: Matemática

Pergunta: "Quanto é 15 x 8?"

Resposta Esperada: O Atmos deve recusar educadamente, lembrando que é um assistente focado em clima e meteorologia.

Resposta Real do Atmos:

Teste 5.2: Futebol

Pergunta: "Quem ganhou o último jogo do Brasileirão?"

Resposta Esperada: O Atmos deve reforçar que não possui informações esportivas e redirecionar para dúvidas climáticas.

Resposta Real do Atmos:

Teste 5.3: Programação / Geral

Pergunta: "Como criar um código em JavaScript?"

Resposta Esperada: O Atmos deve informar gentilmente que seu objetivo é auxiliar exclusivamente com informações e conceitos meteorológicos.

Resposta Real do Atmos:

6. Teste de Resiliência (Sem Integração / Falha de API)

Teste 6.1: Fallback Sem Dados da API

Pergunta: "Qual é a temperatura agora em Sorocaba?"

Resposta Esperada (Caso a API esteja indisponível): O Atmos deve informar honestamente que não conseguiu obter os dados em tempo real no momento, sem alucinar ou inventar valores numéricos fictícios.

Resposta Real do Atmos:

7. Cenários Específicos: Clima e Tempo em Sorocaba / UNIP

Teste 7.1: Calor Extremo no Campus

Pergunta: "Vai fazer muito calor hoje na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve trazer a temperatura máxima prevista para o dia no campus e dar uma recomendação útil relacionada (ex: hidratação ou cuidados com o sol).

Resposta Real do Atmos:

Teste 7.2: Alerta de Chuva Súbita (Indo pra Aula)

Pergunta: "Preciso levar guarda-chuva para ir pra aula na UNIP Sorocaba hoje à noite?"

Resposta Esperada: O Atmos deve checar a porcentagem de precipitação (chuva) para o período noturno em Sorocaba e responder de forma direta (ex: "Sim, há 80% de chance de chuva à noite" ou "Não, a previsão indica tempo firme").

Resposta Real do Atmos:

Teste 7.3: Sensação Térmica e Vento

Pergunta: "Como está o vento e a sensação térmica agora na região da UNIP em Sorocaba?"

Resposta Esperada: O Atmos deve detalhar se o vento está forte (o que costuma dar sensação de mais frio ou calor) puxando os dados de velocidade do vento (wind_kph) e sensação térmica (feelslike_c).

Resposta Real do Atmos:

Teste 7.4: Variação Climática no Dia (Manhã vs Noite)

Pergunta: "O tempo vai mudar muito de hoje para amanhã em Sorocaba?"

Resposta Esperada: O Atmos deve comparar rapidamente a tendência térmica (ex: indicando se haverá queda brusca de temperatura por causa de uma frente fria ou estabilidade no tempo).

Resposta Real do Atmos:

8. Cenários Avançados e Cotidianos (Sorocaba / UNIP)

Teste 8.1: Previsão de Chuva Rápida (Pancadas Isoladas)

Pergunta: "Tem previsão de pancadas de chuva isoladas hoje perto da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve diferenciar chuva contínua de pancadas rápidas, informando a probabilidade e o horário mais provável da precipitação.

Resposta Real do Atmos:

Teste 8.2: Umidade Baixa (Tempo Seco)

Pergunta: "O ar está muito seco hoje em Sorocaba? Devo me preocupar com hidratação no campus?"

Resposta Esperada: O Atmos deve verificar a umidade relativa do ar (humidity). Se estiver abaixo de 30%, deve emitir um alerta amigável recomendando beber água e se cuidar.

Resposta Real do Atmos:

Teste 8.3: Comparação de Temperatura entre Cidades/Campi

Pergunta: "Está fazendo mais calor em Sorocaba ou em São Paulo hoje?"

Resposta Esperada: O Atmos deve ser capaz de consultar ou comparar a temperatura de duas unidades diferentes da UNIP (ex: Sorocaba vs. capital) e responder com os valores de cada uma.

Resposta Real do Atmos:

Teste 8.4: Índice UV e Proteção Solar (Indo pra Aula de Dia)

Pergunta: "O sol está muito forte agora em Sorocaba? Preciso de protetor solar para ir para a aula?"

Resposta Esperada: O Atmos deve checar o índice UV atual ou a claridade do céu e dar uma dica prática sobre a radiação solar no horário.

Resposta Real do Atmos:

Teste 8.5: Madrugada / Turno da Noite (Queda de Temperatura)

Pergunta: "A temperatura vai cair muito de madrugada quando eu sair da aula na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve analisar a variação horária da previsão para o período noturno e orientar se o aluno precisará levar um casaco mais pesado.

Resposta Real do Atmos:

Teste 8.6: Nevoeiro ou Visibilidade Reduzida

Pergunta: "Tem neblina ou fumaça atrapalhando a visibilidade hoje em Sorocaba?"

Resposta Esperada: O Atmos deve verificar os dados de visibilidade ou qualidade do ar (air_quality) e informar se há algum fator climático comprometendo a visão nas estradas ou ruas de acesso ao campus.

Resposta Real do Atmos:

Teste 8.7: Fim de Semana prolongado / Planejamento

Pergunta: "Como vai ficar o tempo no próximo fim de semana aqui em Sorocaba?"

Resposta Esperada: O Atmos deve consultar a previsão de médio prazo (sábado e domingo) para a região, informando se o clima estará propício para atividades externas.

Resposta Real do Atmos:

Teste 8.8: Mudança Abrupta de Tempo (Frente Fria Chegando)

Pergunta: "Vai vir frente fria para Sorocaba nos próximos dias?"

Resposta Esperada: O Atmos deve identificar queda acentuada na temperatura ou aumento de nuvens na previsão estendida, alertando sobre a virada no tempo.

Resposta Real do Atmos:

Teste 8.9: Consulta de Máxima e Mínima Absoluta do Dia

Pergunta: "Qual vai ser a maior e a menor temperatura registrada hoje em Sorocaba?"

Resposta Esperada: O Atmos deve extrair diretamente da API os valores de temperatura máxima (temp_max) e mínima (temp_min) previstas para o dia.

Resposta Real do Atmos:

Teste 8.10: Condição Climática Exatamente no Horário de Pico (Entrada/Saída de Aula)

Pergunta: "Como vai estar o tempo hoje às 22h na saída das aulas da UNIP?"

Resposta Esperada: O Atmos deve puxar a previsão horária específica para o final da tarde/início da noite, informando temperatura e chance de chuva exatas para aquele bloco de horário.

Resposta Real do Atmos:

9. Cenários Diversificados de Resposta Rápida (Sorocaba / UNIP)

Teste 9.1: Recomendação de Vestuário (Roupas do Dia)

Pergunta: "Devo ir de casaco ou camiseta para a UNIP Sorocaba hoje?"

Resposta Esperada: O Atmos deve avaliar a temperatura e sensação térmica atuais e orientar de forma objetiva sobre a vestiária ideal (ex: "A máxima hoje é de 31°C, pode ir de camiseta!").

Resposta Real do Atmos:

Teste 9.2: Atividades Físicas e Esportivas ao Ar Livre

Pergunta: "Dá para jogar bola na quadra aberta da UNIP Sorocaba à tarde sem pegar chuva?"

Resposta Esperada: O Atmos deve checar a probabilidade de precipitação para o período da tarde em Sorocaba e dar uma resposta direta de sim ou não.

Resposta Real do Atmos:

Teste 9.3: Rajadas e Alerta de Vento Forte

Pergunta: "Está ventando muito forte em Sorocaba agora?"

Resposta Esperada: O Atmos deve consultar a velocidade das rajadas de vento (wind_kph) e informar se há condições adversas ou vento calmo.

Resposta Real do Atmos:

Teste 9.4: Nascer e Pôr do Sol (Horário de Luz)

Pergunta: "A que horas o sol vai se pôr hoje em Sorocaba?"

Resposta Esperada: O Atmos deve extrair os dados astronômicos (sunset) do dia para informar o horário exato em que vai escurecer no campus.

Resposta Real do Atmos:

Teste 9.5: Pressão Atmosférica / Pessoas Sensíveis a Enxaqueca

Pergunta: "Qual é a pressão atmosférica atual em Sorocaba?"

Resposta Esperada: O Atmos deve retornar o valor numérico exato em hPa/mbar obtido da API (ex: "A pressão atmosférica atual em Sorocaba é de 1015 hPa").

Resposta Real do Atmos:

Teste 9.6: Sensação Térmica em Horários Específicos

Pergunta: "Qual é a sensação térmica prevista para o meio-dia na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve diferenciar a temperatura real da sensação térmica (feelslike_c) para o horário do almoço.

Resposta Real do Atmos:

Teste 9.7: Alertas Oficiais de Tempestade ou Raios

Pergunta: "Existe algum alerta de tempestade ou raios emitido para Sorocaba hoje?"

Resposta Esperada: O Atmos deve consultar a seção de alertas (alerts) da API e informar se há avisos meteorológicos ativos para a região.

Resposta Real do Atmos:

Teste 9.8: Tendência Térmica da Semana (Esfriando ou Esquentando)

Pergunta: "A semana em Sorocaba vai ser mais quente ou mais fria do que a passada?"

Resposta Esperada: O Atmos deve analisar a média da previsão estendida e indicar a tendência (subida de temperatura, estabilidade ou chegada de massa de ar frio).

Resposta Real do Atmos:

Teste 9.9: Clima para Deslocamento / Trânsito

Pergunta: "Como estão as condições do tempo para pegar a rodovia em direção à UNIP Sorocaba agora?"

Resposta Esperada: O Atmos deve resumir visibilidade, chuva atual e vento no trecho da cidade de forma sucinta para o motorista.

Resposta Real do Atmos:

Teste 9.10: Pergunta Direta sobre Mínima Noturna

Pergunta: "Qual vai ser a temperatura mínima na madrugada em Sorocaba?"

Resposta Esperada: O Atmos deve extrair diretamente o valor da menor temperatura registrada no gráfico diário da API para a madrugada.

Resposta Real do Atmos:
