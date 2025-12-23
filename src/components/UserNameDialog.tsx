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
import { isValidUsername, normalizeUsername } from '@/hooks/useUserId';

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
  const [error, setError] = useState<string | null>(null);

  // Deduplicate existing names and sort
  const uniqueNames = useMemo(() => {
    return Array.from(new Set(existingNames)).sort();
  }, [existingNames]);

  const handleContinue = () => {
    if (useNewName) {
      // For new names, validate
      const normalized = normalizeUsername(newName.trim());
      if (!normalized || !isValidUsername(normalized)) {
        setError('Use 3-30 chars: letters, numbers, underscores.');
        return;
      }
      onSelectName(normalized);
    } else if (selectedExistingName) {
      // For existing names, use as-is (they're already valid)
      onSelectName(selectedExistingName);
    } else {
      // Should not happen due to canContinue check, but handle gracefully
      return;
    }
    
    // Reset form
    setSelectedExistingName('');
    setNewName('');
    setUseNewName(false);
    setError(null);
  };

  const handleSkip = () => {
    onSkip();
    setSelectedExistingName('');
    setNewName('');
    setUseNewName(false);
    setError(null);
  };

  const canContinue = selectedExistingName.length > 0 || (useNewName && newName.trim().length > 0);

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
            Choose a username to start voting. Allowed: letters, numbers, underscores (3–30 chars).
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
              placeholder="e.g. party_host"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value.trim().length > 0) {
                  setUseNewName(true);
                  setSelectedExistingName('');
                }
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canContinue) {
                  handleContinue();
                }
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
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

