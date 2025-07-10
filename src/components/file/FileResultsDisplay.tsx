import { Card } from '@/components/ui/card';
import { FileSpreadsheet, Users, Mail } from 'lucide-react';

interface ProcessingResult {
  type: 'pdf' | 'rtf' | 'csv' | 'excel';
  content?: File;
  contacts?: any[];
  emails?: string[];
  text?: string;
  error?: string;
}

interface FileResultsDisplayProps {
  result: ProcessingResult;
}

export const FileResultsDisplay = ({ result }: FileResultsDisplayProps) => {
  return (
    <Card className="w-full p-6">
      <div className="space-y-6">
        <div className="text-center">
          <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold">
            {result.type === 'csv' ? 'CSV' : 'Excel'} Αρχείο Επεξεργασμένο
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Επαφές</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {result.contacts?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">επαφές βρέθηκαν</p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Emails</h3>
            </div>
            <p className="text-2xl font-bold text-primary">
              {result.emails?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">μοναδικά emails</p>
          </Card>
        </div>
        
        {result.contacts && result.contacts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Πρώτες 5 επαφές:</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
              {result.contacts.slice(0, 5).map((contact, index) => (
                <div key={index} className="border-b last:border-b-0 pb-1 last:pb-0">
                  {contact.name && <span className="font-medium">{contact.name}</span>}
                  {contact.email && <span className="text-muted-foreground ml-2">{contact.email}</span>}
                  {contact.company && <span className="text-muted-foreground ml-2">({contact.company})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};