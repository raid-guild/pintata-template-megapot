# Lottery Agent

Lottery Agent is a Megapot lottery assistant for Base. It helps a user set up a dedicated wallet, monitor Base ETH and USDC, configure daily Megapot ticket purchases, track spend and winnings, and claim prizes after explicit confirmation.

The template includes a TypeScript helper CLI powered by `viem` for contract reads and writes. It uses the verified Megapot Jackpot and Random Ticket Buyer ABIs, buys random tickets through `JackpotRandomTicketBuyer.buyTickets`, buys fixed-number tickets through `Jackpot.buyTickets`, and claims winnings through `Jackpot.claimWinnings`.

Core functionality:

- Securely guides the user to add `BASE_PRIVATE_KEY` through Pinata Secrets, never chat
- Reports wallet address, Base ETH gas balance, Base USDC balance, and USDC allowances
- Configures daily ticket purchases from 1 to 10 tickets
- Supports random daily tickets or fixed manual numbers
- Runs a daily scheduled purchase before the Megapot drawing window
- Uses bounded one-week USDC approvals by default and never unlimited approvals
- Tracks purchase history, total spend, claim history, and skipped-run reasons
- Answers questions about the current drawing, ticket price, prize pool, draw time, and lock state
- Pauses and resumes daily purchases on request
- Claims winnings only after explicit user confirmation

This agent is designed around a limited hot wallet. Users should create a dedicated wallet and fund only the USDC they are comfortable spending on lottery tickets.

[MegaPot](https://megapot.io/play)
[MegaPot Docs](https://docs.megapot.io/)

# agent-templates

Central repository for Pinata agent template examples

### What are Pinata Agents

Pinata Agents are hosted AI agent instances that can run code, search the web, manage files, and connect to external services. Each agent runs in its own isolated container with a persistent workspace.

### What are Agent Templates?

Templates are the fastest way to get a working agent. Instead of configuring everything yourself, pick a template that does what you need - it comes with the right skills, settings, and personality already set up. Just add your API keys and deploy.

## 🎨 VoltAgent Design Integration

We now support [VoltAgent's awesome-design-md](https://github.com/VoltAgent/awesome-design-md), a collection of `DESIGN.md` files inspired by popular brand design systems (like Stripe, Vercel, Linear, Apple, etc.).

Our **[Web Master](./openclaw/interaction-and-interfaces/web-master)** agent is fully equipped to read these files and instantly adapt its UI to match the requested brand. Just browse the [full list of available designs](https://github.com/VoltAgent/awesome-design-md) and tell the Web Master agent which one you want to use (e.g., "Use the Linear design"). The agent uses the `npx getdesign` CLI internally to fetch the exact design and apply it.

## 🤖 Agent Types

Templates are organized by **agent type** — the underlying runtime or framework that powers the agent. Each agent type has its own folder at the top level, and within it, templates are grouped by the role the agent plays.

### [OpenClaw](./openclaw)

OpenClaw agents run in isolated containers with a persistent workspace. They can run code, search the web, manage files, and connect to external services.

---

_More agent types coming soon._

## 📦 Template Categories

Within each agent type, templates are grouped based on the _role the agent plays_ in a system.

### 0. 🧱 Basic

Starter templates that provide a vanilla foundation for building any kind of agent.

**Use this for:**

- Getting started with Pinata Agents
- Learning the manifest and workspace structure
- Scaffolding a new agent from scratch

**Examples:**

- Useful Assistant

---

### 1. 🛰️ Monitoring & Alerts

Agents that observe systems, detect changes, and notify or trigger actions.

**Use this for:**

- Price / market monitoring
- Wallet or transaction tracking
- System health checks
- Event detection and alerting

**Examples:**

- Financial tracker
- API uptime monitor
- Activity alert agent

---

### 2. ⚙️ Actions & Transactions

Agents that take actions on behalf of a user or system, especially involving external services or state changes.

**Use this for:**

- Purchasing / payments
- Executing workflows
- Writing to external systems
- Triggering side effects

**Examples:**

- Purchasing agent
- Trading agent
- CRM update agent
- [Lottery Agent](./openclaw/actions-and-transactions/lottery-agent)

---

### 3. 🔎 Data Extraction & Summarization

Agents that read, process, and condense information into usable outputs.

**Use this for:**

- Summarization
- Parsing structured/unstructured data
- Report generation
- Indexing / transforming data

**Examples:**

- Graph summarizer
- PDF summarization agent
- Log analysis agent

---

### 4. 💬 Interaction & Interfaces

Agents that directly interact with users or act as an interface layer.

**Use this for:**

- Chatbots
- Assistants
- Conversational workflows
- User-facing AI tools

**Examples:**

- Slack assistant
- Customer support bot

---

### 5. 🧩 Orchestration & Multi-Agent Systems

Agents that coordinate other agents, tools, or workflows.

**Use this for:**

- Multi-step pipelines
- Agent coordination
- Tool routing / decision engines
- Complex workflow composition

**Examples:**

- Research pipeline orchestrator
- Multi-agent task runner
- Tool selection / routing agent

---

## How can I create a template?

See here: https://docs.pinata.cloud/agents/templates/creating

## How can I get my template on the Pinata Agent marketplace?

Currently marketplace inclusion is limited to ecosystem partners. Reach out to partnerships@pinata.cloud for partner information

## 🚀 Contributing a Template

We welcome contributions from the community! To submit a new agent template, follow the process below.

### 1. Fork the Repository

1. Create a fork of this repository and clone it locally

```bash
git clone https://github.com/YOUR-USERNAME/pinata-agent-templates.git
cd pinata-agent-templates

2) Create your agent template inside the appropriate agent type folder (e.g., `openclaw/`)

3) Submit a PR to the repository
```
