import sqlite3 from 'sqlite3';
import path from 'path';

export class Database {
  private db: sqlite3.Database;
  
  constructor(dbPath: string = './medvault.db') {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.initializeTables();
      }
    });
  }

  private async initializeTables(): Promise<void> {
    try {
      // Create doctors table
      await this.run(`
        CREATE TABLE IF NOT EXISTS doctors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          speciality TEXT NOT NULL,
          wallet_address TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create patients table
      await this.run(`
        CREATE TABLE IF NOT EXISTS patients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pseudonym TEXT NOT NULL,
          wallet_address TEXT UNIQUE NOT NULL,
          medical_record_cid TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create notifications table
      await this.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doctor_id INTEGER NOT NULL,
          patient_id INTEGER NOT NULL,
          requested_fields TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (doctor_id) REFERENCES doctors (id),
          FOREIGN KEY (patient_id) REFERENCES patients (id)
        )
      `);

      // Create smart contracts table for tracking contract states
      await this.run(`
        CREATE TABLE IF NOT EXISTS smart_contracts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_wallet TEXT NOT NULL,
          doctor_wallet TEXT NOT NULL,
          contract_address TEXT,
          approved_fields TEXT,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'revoked')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Insert default doctor data
      await this.insertDefaultDoctor();
      
      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  private async insertDefaultDoctor(): Promise<void> {
    try {
      // Check if doctor already exists
      const existingDoctor = await this.get('SELECT id FROM doctors WHERE wallet_address = ?', 
        ['0x1234567890abcdef1234567890abcdef12345678']);
      
      if (!existingDoctor) {
        await this.run(`
          INSERT INTO doctors (name, speciality, wallet_address) 
          VALUES (?, ?, ?)
        `, ['Dr. Sara Johnson', 'Cardiologist', '0x1234567890abcdef1234567890abcdef12345678']);
        
        console.log('Default doctor inserted successfully');
      }
    } catch (error) {
      console.error('Error inserting default doctor:', error);
    }
  }


  public getDb(): sqlite3.Database {
    return this.db;
  }

  public async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  public async get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  public close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

export const database = new Database();
