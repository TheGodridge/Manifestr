import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/formatCurrency";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onConfirm: () => void;
}

export function DepositModal({ open, onOpenChange, amount, onConfirm }: DepositModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-night-sky border-aurora-purple/30">
        <DialogHeader>
          <DialogTitle className="text-gold-primary font-poppins text-xl">
            Deposit to Manifestr Bank?
          </DialogTitle>
          <DialogDescription className="text-mist-lavender text-base">
            You're about to bank {formatCents(amount)} of focused energy.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-aurora-purple text-gold-primary border-pulse-purple/20 hover:bg-pulse-purple h-[50px] rounded-xl"
            data-testid="button-keep-going"
          >
            Keep Going
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-gold-primary text-night-sky hover:bg-gold-pressed h-[54px] rounded-[14px] font-medium tracking-cta"
            style={{
              boxShadow: "0 0 30px rgba(59, 10, 102, 0.3)",
            }}
            data-testid="button-deposit-confirm"
          >
            Deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
