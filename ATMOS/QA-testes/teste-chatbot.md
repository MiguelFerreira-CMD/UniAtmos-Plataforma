Plano de Testes - Chatbot Atmos (UniAtmos)

Este documento reúne os casos de teste estruturados para validar as respostas, o foco, a precisão e a integração de dados meteorológicos do assistente virtual Atmos, com foco exclusivo no campus da UNIP Sorocaba.

1. Consultas de Clima e Previsão em Tempo Real (Funcionalidade Principal)

Teste 1.1: Temperatura do Dia (Hoje)

Pergunta: "Qual é a temperatura de hoje no campus da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve consultar a API e retornar a temperatura atual em °C, sensação térmica e as condições gerais do céu na região do campus.

Resposta Real do Atmos:

Teste 1.2: Clima Atual no Campus

Pergunta: "Como está o clima agora no campus UNIP Sorocaba?"

Resposta Esperada: O Atmos deve identificar a localização exata da unidade, consultar os dados atuais e responder com temperatura, umidade e condição do tempo para o campus.

Resposta Real do Atmos:

Teste 1.3: Previsão para Outros Dias (Amanhã / Final de Semana)

Pergunta: "Qual vai ser a temperatura amanhã na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve retornar a previsão de temperatura máxima e mínima para o dia seguinte na região do campus, acompanhada da probabilidade de chuva.

Resposta Real do Atmos:

Teste 1.4: Previsão de Chuva para Data Específica

Pergunta: "Vai chover no próximo sábado na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve informar a previsão de chuva (porcentagem ou volume em mm) e as temperaturas esperadas para o próximo sábado no campus.

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

Teste 4.1: Consulta de Temperatura Sem Localização

Pergunta: "Está frio hoje?"

Resposta Esperada: O Atmos deve confirmar se o usuário se refere ao campus UNIP Sorocaba ou pedir a confirmação do local para verificar os dados.

Resposta Real do Atmos:

Teste 4.2: Consulta de Chuva Sem Data

Pergunta: "Vai chover?"

Resposta Esperada: O Atmos deve solicitar o dia ou período de interesse para apresentar a previsão precisa para a UNIP Sorocaba.

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

Pergunta: "Qual é a temperatura agora na UNIP Sorocaba?"

Resposta Esperada (Caso a API esteja indisponível): O Atmos deve informar honestamente que não conseguiu obter os dados em tempo real no momento, sem alucinar ou inventar valores numéricos fictícios.

Resposta Real do Atmos:

7. Cenários Específicos: Clima e Tempo no Campus Sorocaba

Teste 7.1: Calor Extremo no Campus

Pergunta: "Vai fazer muito calor hoje na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve trazer a temperatura máxima prevista para o dia no campus e dar uma recomendação útil relacionada (ex: hidratação ou cuidados com o sol).

Resposta Real do Atmos:

Teste 7.2: Alerta de Chuva Súbita (Indo pra Aula)

Pergunta: "Preciso levar guarda-chuva para ir pra aula na UNIP Sorocaba hoje à noite?"

Resposta Esperada: O Atmos deve checar a porcentagem de precipitação (chuva) para o período noturno no campus e responder de forma direta.

Resposta Real do Atmos:

Teste 7.3: Sensação Térmica e Vento

Pergunta: "Como está o vento e a sensação térmica agora na região da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve detalhar a velocidade do vento (wind_kph) e a sensação térmica (feelslike_c) na área do campus.

Resposta Real do Atmos:

Teste 7.4: Variação Climática no Dia (Manhã vs Noite)

Pergunta: "O tempo vai mudar muito de hoje para amanhã no campus da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve comparar rapidamente a tendência térmica na região do campus.

Resposta Real do Atmos:

8. Cenários Avançados e Cotidianos (UNIP Sorocaba)

Teste 8.1: Previsão de Chuva Rápida (Pancadas Isoladas)

Pergunta: "Tem previsão de pancadas de chuva isoladas hoje perto da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve diferenciar chuva contínua de pancadas rápidas, informando a probabilidade e o horário mais provável no campus.

Resposta Real do Atmos:

Teste 8.2: Umidade Baixa (Tempo Seco)

Pergunta: "O ar está muito seco hoje na UNIP Sorocaba? Devo me preocupar com hidratação no campus?"

Resposta Esperada: O Atmos deve verificar a umidade relativa do ar (humidity). Se estiver abaixo de 30%, deve emitir um alerta amigável recomendando beber água.

Resposta Real do Atmos:

Teste 8.3: Comparação de Temperatura entre Horários no Campus

Pergunta: "Vai estar mais quente na UNIP Sorocaba de manhã ou à tarde hoje?"

Resposta Esperada: O Atmos deve comparar os blocos de horário do dia para a localização do campus e indicar em qual período fará mais calor.

Resposta Real do Atmos:

Teste 8.4: Índice UV e Proteção Solar (Indo pra Aula de Dia)

Pergunta: "O sol está muito forte agora na UNIP Sorocaba? Preciso de protetor solar para ir para a aula?"

Resposta Esperada: O Atmos deve checar o índice UV atual ou a claridade do céu na região e dar uma dica prática sobre radiação solar.

Resposta Real do Atmos:

Teste 8.5: Madrugada / Turno da Noite (Queda de Temperatura)

Pergunta: "A temperatura vai cair muito de madrugada quando eu sair da aula na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve analisar a variação horária da previsão para o período noturno e orientar sobre a necessidade de casaco.

Resposta Real do Atmos:

Teste 8.6: Nevoeiro ou Visibilidade Reduzida

Pergunta: "Tem neblina ou fumaça atrapalhando a visibilidade hoje no entorno da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve verificar os dados de visibilidade ou qualidade do ar (air_quality) e informar se há fatores comprometendo a visão nas vias de acesso ao campus.

Resposta Real do Atmos:

Teste 8.7: Fim de Semana / Planejamento no Campus

Pergunta: "Como vai ficar o tempo no próximo fim de semana na região da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve consultar a previsão de médio prazo para o município de Sorocaba, informando o clima para sábado e domingo.

Resposta Real do Atmos:

Teste 8.8: Mudança Abrupta de Tempo (Frente Fria Chegando)

Pergunta: "Vai vir frente fria para a região da UNIP Sorocaba nos próximos dias?"

Resposta Esperada: O Atmos deve identificar queda acentuada na temperatura ou aumento de nuvens na previsão estendida local.

Resposta Real do Atmos:

Teste 8.9: Consulta de Máxima e Mínima Absoluta do Dia

Pergunta: "Qual vai ser a maior e a menor temperatura registrada hoje na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve extrair diretamente os valores de temperatura máxima (temp_max) e mínima (temp_min) previstas para o dia no campus.

Resposta Real do Atmos:

Teste 8.10: Condição Climática na Saída da Aula Noturna

Pergunta: "Como vai estar o tempo hoje às 22h na saída das aulas da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve puxar a previsão horária específica para as 22h, informando temperatura e chance de chuva exatas para a saída das aulas.

Resposta Real do Atmos:

9. Cenários Diversificados de Resposta Rápida (UNIP Sorocaba)

Teste 9.1: Recomendação de Vestuário (Roupas do Dia)

Pergunta: "Devo ir de casaco ou camiseta para a UNIP Sorocaba hoje?"

Resposta Esperada: O Atmos deve avaliar a temperatura e sensação térmica no campus e orientar sobre o vestuário ideal.

Resposta Real do Atmos:

Teste 9.2: Atividades Físicas no Campus

Pergunta: "Dá para praticar esportes na quadra da UNIP Sorocaba à tarde sem pegar chuva?"

Resposta Esperada: O Atmos deve checar a probabilidade de precipitação à tarde para a localização do campus e responder objetivamente.

Resposta Real do Atmos:

Teste 9.3: Rajadas e Alerta de Vento Forte

Pergunta: "Está ventando muito forte na UNIP Sorocaba agora?"

Resposta Esperada: O Atmos deve consultar a velocidade do vento (wind_kph) na região e informar se há ventos fortes ou clima calmo.

Resposta Real do Atmos:

Teste 9.4: Nascer e Pôr do Sol (Horário de Luz)

Pergunta: "A que horas o sol vai se pôr hoje no campus da UNIP Sorocaba?"

Resposta Esperada: O Atmos deve extrair os dados astronômicos (sunset) do dia para informar o horário exato do pôr do sol local.

Resposta Real do Atmos:

Teste 9.5: Pressão Atmosférica no Campus

Pergunta: "Qual é a pressão atmosférica atual na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve retornar o valor numérico exato em hPa/mbar obtido da API para a área do campus.

Resposta Real do Atmos:

Teste 9.6: Sensação Térmica no Almoço

Pergunta: "Qual é a sensação térmica prevista para o meio-dia na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve informar a sensação térmica (feelslike_c) para o horário do almoço no campus.

Resposta Real do Atmos:

Teste 9.7: Alertas Oficiais de Tempestade ou Raios

Pergunta: "Existe algum alerta de tempestade ou raios emitido para a UNIP Sorocaba hoje?"

Resposta Esperada: O Atmos deve consultar a seção de alertas oficiais (alerts) e informar se há avisos meteorológicos ativos para Sorocaba.

Resposta Real do Atmos:

Teste 9.8: Tendência Térmica da Semana no Campus

Pergunta: "A semana na UNIP Sorocaba vai ser mais quente ou mais fria do que a passada?"

Resposta Esperada: O Atmos deve analisar a média da previsão estendida e indicar a tendência para o campus.

Resposta Real do Atmos:

Teste 9.9: Clima para Deslocamento até o Campus

Pergunta: "Como estão as condições do tempo para ir até o campus da UNIP Sorocaba agora?"

Resposta Esperada: O Atmos deve resumir visibilidade, chuva e vento na região de Sorocaba de forma sucinta para o deslocamento dos alunos.

Resposta Real do Atmos:

Teste 9.10: Pergunta Direta sobre Mínima Noturna

Pergunta: "Qual vai ser a temperatura mínima na madrugada na UNIP Sorocaba?"

Resposta Esperada: O Atmos deve extrair a menor temperatura prevista para a madrugada no campus.

Resposta Real do Atmos:
