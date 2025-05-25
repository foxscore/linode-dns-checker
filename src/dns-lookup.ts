import { promises as dns } from 'dns';
import * as dgram from 'dgram';
import * as dnsPacket from 'dns-packet';
import ora from 'ora';
import chalk from 'chalk';

// Define Linode DNS server list
const LINODE_DNS_SERVERS = [
    'ns1.linode.com',
    'ns2.linode.com',
    'ns3.linode.com',
    'ns4.linode.com',
    'ns5.linode.com'
];

interface ServerResult {
    server: string;
    success: boolean;
    addresses: string[];
    error?: string;
}

interface LookupResult {
    serverResults: ServerResult[];
    uniqueAddresses: string[];
}

/**
 * Performs a DNS lookup on a specific nameserver using raw DNS packets
 */
async function lookupOnServer(domain: string, recordType: string, server: string): Promise<ServerResult> {
    try {
        // First resolve the nameserver hostname to IP
        const serverIPs = await dns.resolve4(server);
        const serverIP = serverIPs[0];

        // Create DNS query packet
        const query = dnsPacket.encode({
            type: 'query',
            id: Math.floor(Math.random() * 65536),
            flags: dnsPacket.RECURSION_DESIRED,
            questions: [{
                type: recordType.toUpperCase() as any,
                name: domain
            }]
        });

        return new Promise((resolve) => {
            const client = dgram.createSocket('udp4');

            // Set timeout
            const timeout = setTimeout(() => {
                client.close();
                resolve({
                    server,
                    success: false,
                    addresses: [],
                    error: 'Timeout'
                });
            }, 5000);

            client.on('message', (msg) => {
                clearTimeout(timeout);
                client.close();

                try {
                    const response = dnsPacket.decode(msg);
                    const addresses: string[] = [];

                    if (response.answers) {
                        for (const answer of response.answers) {
                            if (answer.type === recordType.toUpperCase()) {
                                switch (answer.type) {
                                    case 'A':
                                        if ('data' in answer && typeof answer.data === 'string') {
                                            addresses.push(answer.data);
                                        }
                                        break;
                                    case 'AAAA':
                                        if ('data' in answer && typeof answer.data === 'string') {
                                            addresses.push(answer.data);
                                        }
                                        break;
                                    case 'MX':
                                        if ('data' in answer && answer.data && typeof answer.data === 'object') {
                                            const mx = answer.data as any;
                                            addresses.push(`${mx.priority} ${mx.exchange}`);
                                        }
                                        break;
                                    case 'TXT':
                                        if ('data' in answer && answer.data) {
                                            if (Array.isArray(answer.data)) {
                                                addresses.push(answer.data.join(' '));
                                            } else if (typeof answer.data === 'string') {
                                                addresses.push(answer.data);
                                            }
                                        }
                                        break;
                                    case 'CNAME':
                                    case 'NS':
                                        if ('data' in answer && typeof answer.data === 'string') {
                                            addresses.push(answer.data);
                                        }
                                        break;
                                    case 'SOA':
                                        if ('data' in answer && answer.data && typeof answer.data === 'object') {
                                            const soa = answer.data as any;
                                            addresses.push(`${soa.mname} ${soa.rname} (${soa.serial})`);
                                        }
                                        break;
                                    default:
                                        if ('data' in answer && answer.data) {
                                            if (typeof answer.data === 'string') {
                                                addresses.push(answer.data);
                                            } else {
                                                addresses.push(String(answer.data));
                                            }
                                        }
                                }
                            }
                        }
                    }

                    resolve({
                        server,
                        success: true,
                        addresses
                    });
                } catch (parseError) {
                    resolve({
                        server,
                        success: false,
                        addresses: [],
                        error: `Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`
                    });
                }
            });

            client.on('error', (err) => {
                clearTimeout(timeout);
                client.close();
                resolve({
                    server,
                    success: false,
                    addresses: [],
                    error: err.message
                });
            });

            // Send the query
            client.send(query, 53, serverIP);
        });
    } catch (error) {
        return {
            server,
            success: false,
            addresses: [],
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Performs DNS lookup on all Linode servers and returns unique results
 */
export async function lookupAllServers(domain: string, recordType: string = 'A'): Promise<LookupResult> {
    const serverResults: ServerResult[] = [];
    const uniqueAddressSet = new Set<string>();

    // Create an array of promises for concurrent lookups
    const spinnerLookup = ora('Preparing DNS lookups...').start();

    try {
        const lookupPromises = LINODE_DNS_SERVERS.map(async (server) => {
            spinnerLookup.text = `Querying ${chalk.cyan(server)}...`;
            const result = await lookupOnServer(domain, recordType, server);

            // Add to server results
            serverResults.push(result);

            // Add addresses to unique set
            if (result.success) {
                result.addresses.forEach(addr => uniqueAddressSet.add(addr));
            }

            return result;
        });

        // Wait for all lookups to complete
        await Promise.all(lookupPromises);

        // Convert set back to array
        const uniqueAddresses = Array.from(uniqueAddressSet);
        spinnerLookup.succeed('All DNS lookups completed');

        return {
            serverResults,
            uniqueAddresses
        };
    } catch (error) {
        spinnerLookup.fail('DNS lookup failed');
        throw error;
    }
}
