# FastAPI_CoopAgroBrasil

API para gerenciamento de Cooperativas com operações CRUD completas.

## Pré-requisitos

- Python 3.8+
- Git
- Pip
- PostgreSQL (ou outro banco de dados configurado)
# Plataforma de Gestão para Cooperativas Agrícolas

Plataforma web desenvolvida para auxiliar na gestão de cooperativas agrícolas, centralizando o controle de **pessoas, recursos, produtos e informações financeiras**.

## Tecnologias utilizadas

* **Back-end:** Python, API REST
* **Front-end:** React + Vite
* **Banco de dados:** PostgreSQL
* **Banco local:** PostgreSQL + pgAdmin 4
* **Banco em nuvem:** Neon
* **Integração:** Comunicação entre front-end e back-end por meio de API REST

## Funcionalidades

* Cadastro e gerenciamento de pessoas e associados
* Controle de produtos e recursos
* Gerenciamento de informações financeiras
* Operações de consulta, cadastro, atualização e exclusão de dados (CRUD)
* Integração entre front-end, API REST e banco de dados
* Persistência de dados em ambiente local e em nuvem
* Organização das informações para auxiliar a gestão das cooperativas

## Arquitetura

A aplicação utiliza uma arquitetura separando **front-end, back-end e banco de dados**. O front-end desenvolvido em React e Vite realiza o consumo dos endpoints disponibilizados pela API REST em Python, responsável pela lógica de negócio e comunicação com o PostgreSQL.

O projeto utiliza PostgreSQL tanto localmente, com gerenciamento através do pgAdmin 4, quanto em ambiente de nuvem utilizando o Neon.

   
