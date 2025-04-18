import pg from 'pg';
import format from 'pg-format';
import fs from 'fs';

async function initializeDatabase(dbSchema) {
    const client = new pg.Client({
        connectionString: env.postgreurl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const tableName = dbSchema.dbname;
        const columns = dbSchema.table.map(column => {
            // 类型映射
            const pgType = {
                'integer': 'INTEGER',
                'decimal': 'DECIMAL',
                'text': 'VARCHAR(60)',
                'timestamp': 'TIMESTAMP'
            }[column.type] || 'TEXT'; // 默认类型

            return format('%I %s', column.key, pgType);
        }).join(', ');

        const createTableQuery = format(
            'CREATE TABLE IF NOT EXISTS %I (%s)',
            tableName,
            columns
        );

        await client.query(createTableQuery);
        console.log(`Table ${tableName} created/verified`);

        if (dbSchema.description) {
            await client.query(format(
                'COMMENT ON TABLE %I IS %L',
                tableName,
                dbSchema.description
            ));
            console.log(`Added table comment: ${dbSchema.description}`);
        }

    } catch (error) {
        console.error('Initialization failed:', error);
        throw error;
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

const dbList = fs.readdirSync("./db");
dbList.forEach(db => {
    const fileData = fs.readFileSync(`./db/${db}`, 'utf-8').toString();
    const dbSchema = JSON.parse(fileData);
    initializeDatabase(dbSchema)
        .then(() => console.log(`Database ${db} initialized successfully`))
        .catch(err => console.error(`Initialization error in ${db}:`, err));
});