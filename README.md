# 💜 Nexora | Carreira inteligente, oportunidades reais

**Sua próxima oportunidade começa aqui.**

O Nexora é uma plataforma web desenvolvida com inteligência artificial para ajudar profissionais em transição de carreira a encontrar oportunidades, analisar a compatibilidade com vagas e criar versões personalizadas do currículo em formato ATS friendly.

🌐 **Aplicação:** https://image-twin-tracker.lovable.app/

💻 **GitHub:** https://github.com/nunesagabi/dio-nexora-ats

## O problema

Muitos profissionais encontram dificuldades para adaptar seus currículos às exigências de cada vaga. Isso pode prejudicar a identificação de competências relevantes durante processos seletivos que utilizam sistemas ATS.

## A solução

O Nexora reúne ferramentas para apoiar a busca por emprego e a preparação de candidaturas.

A proposta inclui:

- Cadastro de perfil profissional.
- Busca de vagas brasileiras e internacionais remotas.
- Análise de compatibilidade entre perfil e vaga com IA.
- Identificação de palavras-chave, requisitos atendidos e lacunas.
- Geração de currículos personalizados e adequados à leitura por ATS.
- Exportação em PDF.
- Gestão de candidaturas e dashboard de carreira.

**Regra principal:** a IA pode melhorar a apresentação das informações, mas nunca inventar experiências, habilidades ou qualificações.

## Como funciona a análise ATS

1. O usuário informa seu perfil ou currículo.
2. Seleciona uma vaga ou insere sua descrição.
3. A IA compara os requisitos da vaga com as informações profissionais.
4. A plataforma apresenta a compatibilidade estimada, pontos fortes e lacunas.
5. O usuário gera e revisa uma versão personalizada do currículo.
6. O currículo pode ser exportado em PDF.

A pontuação é uma estimativa de compatibilidade, não uma garantia de aprovação no ATS ou de contratação.

## Desenvolvimento com IA

O projeto foi planejado com auxílio do ChatGPT, utilizado para estruturar o mega prompt, a experiência do usuário, os requisitos funcionais e as regras de segurança.

A aplicação foi construída no Lovable, utilizando componentes shadcn/ui e recursos de backend.

O mega prompt solicitou uma plataforma com identidade minimalista premium, perfil profissional, busca de vagas, match com IA, currículo ATS, gestão de candidaturas e dashboard.

## Identidade visual

- Roxo: `#5546A3`
- Lavanda: `#B9ACF5`
- Off-white: `#F6F4FF`
- Grafite: `#282536`

Design minimalista premium, com foco em usabilidade, clareza e acessibilidade.

## Tecnologias

- Lovable
- React e TypeScript
- Tailwind CSS
- shadcn/ui
- Lovable Cloud
- Integrações de IA e APIs externas

## Evolução do projeto

O escopo inicial foi ampliado para atender profissionais em transição de carreira, incluindo funcionalidades de busca de vagas, identificação de competências transferíveis e acompanhamento de candidaturas.

A busca de vagas internacionais utiliza a fonte Remotive. A integração de vagas brasileiras via Adzuna depende da configuração de credenciais externas.

## Testes e evidências

Os fluxos prioritários para validação são:

- Cadastro e autenticação.
- Preenchimento do perfil.
- Análise de compatibilidade.
- Geração e edição do currículo.
- Exportação em PDF.
- Gestão de candidaturas.
- Persistência dos dados.

As evidências visuais e o registro das correções devem ser adicionados conforme os testes forem concluídos.

## Próximos passos

- Validar os fluxos completos com usuários.
- Concluir a configuração da API Adzuna.
- Refinar as análises e a experiência de geração de currículos.
- Ampliar as fontes de vagas.

---

**Projeto desenvolvido para o desafio de criação de aplicação ATS com Lovable, da DIO.**
