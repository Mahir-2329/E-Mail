const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
require('dotenv').config({ path: '.env' });

async function setup() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Creating tables...');

        // Create recipients table
        await client.query(`
      CREATE TABLE IF NOT EXISTS recipients (
        id SERIAL PRIMARY KEY,
        company VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        target_role VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pending',
        last_contacted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create logs table for tracking email history
        await client.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        recipient_id INTEGER REFERENCES recipients(id) ON DELETE CASCADE,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        error_message TEXT
      );
    `);

        console.log('Tables created successfully.');

        // Seed data from CSV if table is empty
        const res = await client.query('SELECT COUNT(*) FROM recipients');
        const count = parseInt(res.rows[0].count);

        if (count === 0) {
            console.log('Recipients table is empty. Seeding from CSV...');

            const csvPath = path.join(__dirname, '..', 'public', 'data.csv');
            if (fs.existsSync(csvPath)) {
                let csvContent = fs.readFileSync(csvPath, 'utf8');
                if (csvContent.charCodeAt(0) === 0xfeff) {
                    csvContent = csvContent.slice(1);
                }

                const records = parse(csvContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                });

                for (const record of records) {
                    const company = record['Company'];
                    const email = record['Contact Email'];
                    const role = record['Target Role'];
                    const status = record['Status'] || 'Pending';

                    if (company && email) {
                        await client.query(
                            'INSERT INTO recipients (company, contact_email, target_role, status) VALUES ($1, $2, $3, $4)',
                            [company, email, role, status]
                        );
                    }
                }
                console.log(`Seeded ${records.length} records from CSV.`);
            } else {
                console.log('No CSV file found at public/data.csv, skipping seed.');
            }
        } else {
            console.log(`Recipients table already has ${count} records. Skipping seed.`);
        }

    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await client.end();
    }
}

setup();
