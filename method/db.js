import pg from 'pg';
import format from 'pg-format';


const connectionString = 'postgres://neondb_owner:npg_iS3Czt8vNjce@ep-rough-art-a1f12jye-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
export async function initializeDatabase(dbSchema) {
    const client = new pg.Client({
        connectionString: connectionString,
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

        if (dbSchema.description) {
            await client.query(format(
                'COMMENT ON TABLE %I IS %L',
                tableName,
                dbSchema.description
            ));
        }

    } catch (error) {
        console.error('Initialization failed:', error);
        throw error;
    } finally {
        await client.end();
        console.log('Database connection closed');
    }
}

export async function getTables() {
    const client = new pg.Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        const result = await client.query(query);
        return result.rows.map(row => row.table_name);
    } catch (error) {
        throw error;
    } finally {
        await client.end();
    }
}