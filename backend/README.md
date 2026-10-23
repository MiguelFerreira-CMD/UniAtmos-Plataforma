# UniAtmos — Backend

Backend do UniAtmos, responsável pelo processamento das requisições, integração com APIs meteorológicas e comunicação com o chatbot Atmos.

## Tecnologias

- Python
- FastAPI
- Uvicorn
- API Open-Meteo
- API Groq

## Instalação

Na pasta principal do projeto, execute:

```bash
pip install -r backend/requirements.txt
```

## Executar o servidor

Na pasta principal do projeto, execute:

```bash
python -m uvicorn backend.main:app --reload --port 3001
```

O backend estará disponível em `http://localhost:3001`.

A documentação da API pode ser acessada em `http://localhost:3001/docs`.

## Observação

Configure as variáveis de ambiente necessárias no arquivo `.env`. Não compartilhe chaves de API nem envie o arquivo `.env` para o GitHub.