import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserNameDialogProps {
  open: boolean;
  existingNames: string[];
  onSelectName: (name: string) => void;
  onSkip: () => void;
}

export function UserNameDialog({
  open,
  existingNames,
  onSelectName,
  onSkip,
}: UserNameDialogProps) {
  const [selectedExistingName, setSelectedExistingName] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [useNewName, setUseNewName] = useState(false);

  // Deduplicate existing names and sort
  const uniqueNames = useMemo(() => {
    return Array.from(new Set(existingNames)).sort();
  }, [existingNames]);

  const handleContinue = () => {
    const nameToUse = useNewName ? newName.trim() : selectedExistingName.trim();
    if (nameToUse) {
      onSelectName(nameToUse);
      // Reset form
      setSelectedExistingName('');
      setNewName('');
      setUseNewName(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    // Reset form
    setSelectedExistingName('');
    setNewName('');
    setUseNewName(false);
  };

  const canContinue = useNewName ? newName.trim().length > 0 : selectedExistingName.length > 0;

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-[425px] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Select Your Name</DialogTitle>
          <DialogDescription>
            Choose your name to start voting on cocktails. You can select an existing name or enter a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Select existing name */}
          {uniqueNames.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="existing-name">Select existing name</Label>
              <Select
                value={selectedExistingName}
                onValueChange={(value) => {
                  setSelectedExistingName(value);
                  setUseNewName(false);
                }}
              >
                <SelectTrigger id="existing-name" className="w-full">
                  <SelectValue placeholder="Choose a name..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Divider */}
          {uniqueNames.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>
          )}

          {/* Enter new name */}
          <div className="space-y-2">
            <Label htmlFor="new-name">Enter new name</Label>
            <Input
              id="new-name"
              placeholder="Type your name..."
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setUseNewName(true);
                  setSelectedExistingName('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canContinue) {
                  handleContinue();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
            Skip
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="w-full sm:w-auto"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

