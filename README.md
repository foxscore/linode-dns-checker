# Linode DNS Checker

A beautiful CLI tool to query all five Linode DNS servers for a domain and collect unique results.

![Demo](demo.gif)

## Features

- 🚀 Query all five Linode DNS servers simultaneously
- ✨ Beautiful, animated command-line interface
- 🧩 Support for different DNS record types (A, AAAA, MX, TXT, CNAME, NS, SOA)
- 📊 Summarize unique results across all servers
- 🔄 Interactive prompts when run without arguments

## Installation

### Option 1: Install globally from npm

```bash
npm install -g linode-dns-checker
```

### Option 2: Use Docker

```bash
docker run --rm ghcr.io/foxscore/linode-dns-checker:latest <arguments>
```

### Option 3: Clone and build from source

```bash
# Clone the repository
git clone https://github.com/yourusername/linode-dns-checker.git
cd linode-dns-checker

# Install dependencies
npm install

# Build the project
npm run build

# Link for development
npm link
```

## Usage

### Basic usage

```bash
linode-dns-checker example.com
```

### Specify DNS record type

```bash
linode-dns-checker example.com --type MX
```

or using the short option:

```bash
linode-dns-checker example.com -t MX
```

### Interactive mode

Simply run the command without any arguments:

```bash
linode-dns-checker
```

This will prompt you for a domain name and record type.

## Supported Record Types

- `A` - IPv4 address records (default)
- `AAAA` - IPv6 address records
- `MX` - Mail exchange records
- `TXT` - Text records
- `CNAME` - Canonical name records
- `NS` - Name server records
- `SOA` - Start of authority records

## Development

### Available scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run the project in development mode
- `npm run lint` - Run ESLint on source files
- `npm test` - Run tests
