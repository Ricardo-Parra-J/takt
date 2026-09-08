import * as SQLite from 'expo-sqlite';

import { SCHEMA_SQL } from './schema';

const DB_NAME = 'takt.db';

/**
 * Sube este numero cada vez que cambie db/schema.sql. Todavia estamos en
 * desarrollo activo (sin usuarios reales ni datos que preservar entre
 * versiones del esquema), asi que en vez de migraciones incrementales, un
 * cambio de version simplemente recrea todas las tablas desde cero con el
 * esquema mas nuevo. Esto tambien corrige retroactivamente cualquier cambio
 * de schema.sql que se haya hecho despues de la primera vez que se abrio la
 * app (antes de que existiera este mecanismo, esos cambios quedaban sin
 * aplicar en una base de datos ya creada).
 */
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = openAndInit();
  }
  return dbPromise;
}

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = fila?.user_version ?? 0;

  if (versionActual < SCHEMA_VERSION) {
    await recrearEsquema(db);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
  }

  return db;
}

async function recrearEsquema(db: SQLite.SQLiteDatabase): Promise<void> {
  const tablas = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  for (const t of tablas) {
    await db.execAsync(`DROP TABLE IF EXISTS "${t.name}";`);
  }
  await db.execAsync('PRAGMA foreign_keys = ON;');
  // execAsync corre multiples sentencias separadas por ';' de una vez.
  await db.execAsync(SCHEMA_SQL);
}

/** Solo para desarrollo: borra el archivo de base de datos y fuerza recrearla. */
export async function resetDatabaseForDev(): Promise<void> {
  dbPromise = null;
  await SQLite.deleteDatabaseAsync(DB_NAME);
}
