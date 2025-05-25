#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import inquirer from 'inquirer';
import { lookupAllServers } from './dns-lookup';
import { version } from '../package.json';

// Display header with figlet
console.log(
    chalk.cyan(
        figlet.textSync('Linode DNS', { horizontalLayout: 'full' })
    )
);
console.log(chalk.cyan('Check DNS records across all Linode nameservers\n'));

const program = new Command();

program
    .version(version)
    .description('A beautiful CLI DNS checker for Linode nameservers')
    .argument('[domain]', 'Domain to lookup')
    .option('-t, --type <type>', 'DNS record type', 'A')
    .action(async (domain, options) => {
        let domainToLookup = domain;
        let recordType = options.type;

        // If no domain provided, prompt for one
        if (!domainToLookup) {
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'domain',
                    message: 'What domain would you like to lookup?',
                    default: 'example.com',
                    validate: (input) => input.length > 0 || 'Please enter a domain'
                },
                {
                    type: 'list',
                    name: 'recordType',
                    message: 'What DNS record type?',
                    choices: ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'SOA'],
                    default: 'A'
                }
            ]);

            domainToLookup = answers.domain;
            recordType = answers.recordType;
        }

        const spinner = createSpinner('Starting DNS lookup...').start();

        try {
            const results = await lookupAllServers(domainToLookup, recordType);
            spinner.success({ text: 'DNS lookup completed!' });

            // Display summary of unique IPs found
            console.log(chalk.green('\n✅ Summary of unique addresses found:'));

            if (results.uniqueAddresses.length === 0) {
                console.log(chalk.yellow(`  No addresses found for ${domainToLookup}`));
            } else {
                results.uniqueAddresses.forEach(ip => {
                    console.log(chalk.white(`  ${ip}`));
                });
            }

            console.log(chalk.blue('\nServer Details:'));
            results.serverResults.forEach(result => {
                if (result.success) {
                    console.log(chalk.green(`  ${result.server}: ${result.addresses.length} records found`));
                } else {
                    console.log(chalk.red(`  ${result.server}: ${result.error}`));
                }
            });
        } catch (error) {
            spinner.error({ text: 'An error occurred during lookup' });
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    });

program.parse();
