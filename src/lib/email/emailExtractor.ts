export interface EmailExtractionResult {
  emails: string[];
  metadata: {
    totalFound: number;
    uniqueEmails: number;
    domains: string[];
    extractionTime: number;
  };
}

export class EmailExtractor {
  private readonly emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  extractFromText(text: string): EmailExtractionResult {
    const startTime = Date.now();
    const emails = new Set<string>();
    const domains = new Set<string>();
    
    // Enhanced email patterns for different contexts
    const patterns = [
      // Standard email pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Email with Greek characters in domain
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-αβγδεζηθικλμνξοπρστυφχψωάέήίόύώ]+\.[A-Z|a-z]{2,}\b/gi,
      // Email in parentheses or quotes
      /[\(\["'][A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}[\)\]"']/g,
      // Email after common prefixes
      /(?:email|e-mail|mail|contact|επικοινωνία|ηλεκτρονικό)[\s:]*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the match
          const cleanEmail = match.replace(/^[\(\["']|[\)\]"']$/g, '').toLowerCase().trim();
          if (this.isValidEmail(cleanEmail)) {
            emails.add(cleanEmail);
            const domain = cleanEmail.split('@')[1];
            if (domain) domains.add(domain);
          }
        });
      }
    });
    
    const extractionTime = Date.now() - startTime;
    const emailArray = Array.from(emails);
    
    return {
      emails: emailArray,
      metadata: {
        totalFound: emailArray.length,
        uniqueEmails: emailArray.length,
        domains: Array.from(domains),
        extractionTime
      }
    };
  }
  
  private isValidEmail(email: string): boolean {
    // Basic validation
    if (!email || email.length < 5) return false;
    if (!email.includes('@') || !email.includes('.')) return false;
    
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    
    const [local, domain] = parts;
    if (local.length === 0 || domain.length === 0) return false;
    
    // Check for valid domain structure
    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;
    
    return true;
  }
  
  extractFromPDF(text: string): EmailExtractionResult {
    // PDF-specific extraction with OCR error handling
    let cleanedText = text;
    
    // Common OCR errors for email addresses
    const ocrCorrections = [
      [/\b([A-Za-z0-9._%+-]+)©([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g, '$1@$2'], // © instead of @
      [/\b([A-Za-z0-9._%+-]+)\(at\)([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g, '$1@$2'], // (at) instead of @
      [/\b([A-Za-z0-9._%+-]+)\[at\]([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g, '$1@$2'], // [at] instead of @
      [/\b([A-Za-z0-9._%+-]+)AT([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g, '$1@$2'], // AT instead of @
    ];
    
    ocrCorrections.forEach(([pattern, replacement]) => {
      cleanedText = cleanedText.replace(pattern as RegExp, replacement as string);
    });
    
    return this.extractFromText(cleanedText);
  }
}