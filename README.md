# NewsRum

NewsRum is a financial-news and portfolio intelligence web application. It combines trusted-source market news, live quote-based research signals, portfolio tracking, and transparent long-term projections.

## Features

- Live market prices and 30-day trends
- Trusted-source financial news feed
- Add, update, and remove portfolio positions
- Device-local portfolio persistence
- Transparent portfolio-growth scenarios
- Responsive tabbed interface

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm audit
npm run build
```

## Data and privacy

Portfolio holdings are stored in the browser's local storage and are not uploaded to a database. Market quotes may be delayed. NewsRum is for research and educational use and does not provide personalized financial advice.

## Security

The repository uses CodeQL analysis, dependency review, Dependabot updates, GitHub secret scanning, and automated vulnerability alerts. See [SECURITY.md](SECURITY.md) for reporting guidance.
