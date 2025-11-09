import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InfoModal({ open, onOpenChange }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-night-sky/95 backdrop-blur-xl border-pulse-purple/30">
        <DialogHeader>
          <DialogTitle className="text-gold-primary font-poppins text-2xl">
            About Manifestr
          </DialogTitle>
          <DialogDescription className="sr-only">
            Legal notice, copyright information, and developer notes about Manifestr meditation app
          </DialogDescription>
        </DialogHeader>

          <div className="space-y-6 text-mist-lavender">
            {/* Legal Notice */}
            <div>
              <h3 className="text-gold-soft font-semibold mb-2 text-sm uppercase tracking-wider">
                Legal Notice
              </h3>
              <p className="text-sm leading-relaxed">
                The virtual currency displayed in Manifestr is not legal tender and has no monetary value. 
                It is solely for motivation, gamification, and focus tracking purposes. 
                Manifestr does not offer financial services or real currency rewards.
              </p>
            </div>

            {/* Copyright */}
            <div>
              <h3 className="text-gold-soft font-semibold mb-2 text-sm uppercase tracking-wider">
                Copyright
              </h3>
              <p className="text-sm leading-relaxed">
                © {new Date().getFullYear()} Ridge Mallery. All rights reserved.
              </p>
            </div>

            {/* Developer Notes */}
            <div>
              <h3 className="text-gold-soft font-semibold mb-2 text-sm uppercase tracking-wider">
                Developer Notes
              </h3>
              <div className="text-sm leading-relaxed space-y-3">
                <p>
                  <strong className="text-gold-soft">Philosophy:</strong> Manifestr gamifies mindfulness by treating focus as currency. 
                  The longer you meditate, the more your earnings multiply—encouraging deeper, more meaningful sessions.
                </p>
                <p>
                  <strong className="text-gold-soft">Audio:</strong> All meditation soundscapes use binaural beats and natural ambience 
                  to enhance relaxation and mental clarity.
                </p>
                <p>
                  <strong className="text-gold-soft">Design:</strong> Inspired by premium meditation apps like Calm and Headspace, 
                  with cosmic visuals and smooth animations to create an immersive experience.
                </p>
                <p>
                  <strong className="text-gold-soft">Technology:</strong> Built with React, TypeScript, and Web Audio API. 
                  All data stored locally for privacy.
                </p>
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-theme-cta text-theme-cta-text hover:bg-theme-cta-hover h-[48px] rounded-xl font-medium"
              data-testid="button-close-info"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
  );
}
