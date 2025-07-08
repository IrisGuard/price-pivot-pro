import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ContactData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  afm?: string;
  activity?: string;
}

export interface CSVProcessingResult {
  contacts: ContactData[];
  emails: string[];
  metadata: {
    fileName: string;
    fileType: 'csv' | 'excel';
    rowCount: number;
    columnCount: number;
    processingTime: number;
  };
}

export class CSVProcessor {
  async processCSVFile(file: File): Promise<CSVProcessingResult> {
    const startTime = Date.now();
    
    try {
      let data: any[][] = [];
      let fileType: 'csv' | 'excel' = 'csv';
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        data = await this.parseCSV(file);
        fileType = 'csv';
      } else if (file.name.toLowerCase().match(/\.(xlsx|xls)$/)) {
        data = await this.parseExcel(file);
        fileType = 'excel';
      } else {
        throw new Error('Μη υποστηριζόμενος τύπος αρχείου');
      }
      
      const contacts = this.extractContacts(data);
      const emails = this.extractEmails(data);
      
      const processingTime = Date.now() - startTime;
      
      return {
        contacts,
        emails,
        metadata: {
          fileName: file.name,
          fileType,
          rowCount: data.length,
          columnCount: data[0]?.length || 0,
          processingTime
        }
      };
    } catch (error) {
      throw new Error(`Σφάλμα επεξεργασίας αρχείου: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }
  
  private async parseCSV(file: File): Promise<any[][]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
            return;
          }
          resolve(results.data as any[][]);
        },
        error: (error) => {
          reject(new Error(`CSV error: ${error.message}`));
        },
        skipEmptyLines: true,
        encoding: 'UTF-8'
      });
    });
  }
  
  private async parseExcel(file: File): Promise<any[][]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to array of arrays
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false 
      }) as any[][];
      
      return data;
    } catch (error) {
      throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
    }
  }
  
  private extractContacts(data: any[][]): ContactData[] {
    if (data.length === 0) return [];
    
    // Detect headers
    const headers = data[0].map((h: any) => String(h).toLowerCase());
    const contacts: ContactData[] = [];
    
    // Column mapping patterns
    const columnMap = {
      name: this.findColumn(headers, ['name', 'όνομα', 'ονοματεπώνυμο', 'επωνυμία', 'ονομα']),
      email: this.findColumn(headers, ['email', 'e-mail', 'mail', 'ηλεκτρονικό', 'ημαιλ']),
      phone: this.findColumn(headers, ['phone', 'tel', 'telephone', 'τηλέφωνο', 'τηλ', 'κινητό']),
      company: this.findColumn(headers, ['company', 'εταιρία', 'εταιρεία', 'επιχείρηση']),
      address: this.findColumn(headers, ['address', 'διεύθυνση', 'οδός']),
      afm: this.findColumn(headers, ['afm', 'αφμ', 'tax', 'vat']),
      activity: this.findColumn(headers, ['activity', 'δραστηριότητα', 'επάγγελμα', 'κλάδος'])
    };
    
    // Extract contacts from data rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const contact: ContactData = {};
      
      if (columnMap.name !== -1) contact.name = String(row[columnMap.name] || '').trim();
      if (columnMap.email !== -1) contact.email = String(row[columnMap.email] || '').trim();
      if (columnMap.phone !== -1) contact.phone = String(row[columnMap.phone] || '').trim();
      if (columnMap.company !== -1) contact.company = String(row[columnMap.company] || '').trim();
      if (columnMap.address !== -1) contact.address = String(row[columnMap.address] || '').trim();
      if (columnMap.afm !== -1) contact.afm = String(row[columnMap.afm] || '').trim();
      if (columnMap.activity !== -1) contact.activity = String(row[columnMap.activity] || '').trim();
      
      // Only add if at least name or email exists
      if (contact.name || contact.email) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  }
  
  private extractEmails(data: any[][]): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = new Set<string>();
    
    // Search all cells for email patterns
    data.forEach(row => {
      row.forEach(cell => {
        const cellStr = String(cell || '');
        const matches = cellStr.match(emailRegex);
        if (matches) {
          matches.forEach(email => emails.add(email.toLowerCase()));
        }
      });
    });
    
    return Array.from(emails);
  }
  
  private findColumn(headers: string[], patterns: string[]): number {
    for (const pattern of patterns) {
      const index = headers.findIndex(h => h.includes(pattern));
      if (index !== -1) return index;
    }
    return -1;
  }
}