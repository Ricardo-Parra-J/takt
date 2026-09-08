import * as SQLite from 'expo-sqlite';

import { SCHEMA_SQL } from './schema';

const DB_NAME = 'takt.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Abre (o crea) la base de datos local de Takt y aplica el esquema completo.
 * `PRAGMA foreign_keys = ON` y todas las sentencias CREATE TABLE/INDEX/TRIGGER
 * en schema.sql usan `IF NOT EXISTS` de forma implícita gracias a que
 * execAsync corre el script completo solo la primera vez que no existen las
 * tablas (ver `isFreshDatabase`).
 */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndInit();
  }
  return dbPromise;
}

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');

  if (await isFreshDatabase(db)) {
    // execAsync corre múltiples sentencias separadas por ';' de una vez.
    await db.execAsync(SCHEMA_SQL);
  }

  return db;
}

async function isFreshDatabase(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='ingredientes'"
  );
  return !row || row.count === 0;
}

/** Solo para desarrollo: borra el archivo de base de datos y fuerza recrearla. */
export async function resetDatabaseForDev(): Promise<void> {
  dbPromise = null;
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
