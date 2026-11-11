import { useState, type FormEvent } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
    MEETING_DATE_MAX,
    MEETING_DATE_MIN,
    MEETING_LOCATION_DEFAULT,
    validateMeetingStart,
} from '@/lib/meetings/store';
import type { MeetingInput } from '@/hooks/useMeetings';

interface MeetingFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    counterpartName: string;
    onSubmit: (input: MeetingInput) => Promise<void>;
}

/**
 * Small form to propose a meeting. Date is limited to the Breakpoint window
 * (Nov 15–17, 2026) — the date input is clamped with min/max and the submit
 * is validated again, so a date outside the range is rejected with a clear
 * message instead of being saved.
 */
const MeetingForm = ({ open, onOpenChange, counterpartName, onSubmit }: MeetingFormProps) => {
    const [date, setDate] = useState(MEETING_DATE_MIN);
    const [time, setTime] = useState('10:00');
    const [location, setLocation] = useState(MEETING_LOCATION_DEFAULT);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const close = () => {
        if (!busy) onOpenChange(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!date || !time) {
            setError('Pick a date and time for the meeting.');
            return;
        }
        const startTime = new Date(`${date}T${time}:00`).toISOString();
        const validationError = validateMeetingStart(startTime);
        if (validationError) {
            setError(validationError);
            return;
        }
        setBusy(true);
        try {
            await onSubmit({ startTime, location: location.trim() || MEETING_LOCATION_DEFAULT });
            toast({ title: `Meeting proposed to ${counterpartName}` });
            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not propose the meeting.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
                <DialogTitle className="font-display text-lg font-semibold">
                    Propose a meeting with {counterpartName}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                    Meetings can only be booked during Breakpoint, Nov 15–17, 2026.
                </DialogDescription>
                <form onSubmit={handleSubmit} noValidate className="mt-2 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="meeting-date" className="text-sm font-medium">
                                Date
                            </label>
                            <Input
                                id="meeting-date"
                                type="date"
                                value={date}
                                min={MEETING_DATE_MIN}
                                max={MEETING_DATE_MAX}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border-border"
                                required
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="meeting-time" className="text-sm font-medium">
                                Time
                            </label>
                            <Input
                                id="meeting-time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="rounded-xl border-border"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="meeting-location" className="text-sm font-medium">
                            Location
                        </label>
                        <Input
                            id="meeting-location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={MEETING_LOCATION_DEFAULT}
                            className="rounded-xl border-border"
                        />
                    </div>
                    {error && (
                        <p role="alert" className="flex items-start gap-2 text-sm font-medium text-destructive">
                            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                        </p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" className="rounded-xl" onClick={close} disabled={busy}>
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-xl" disabled={busy}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                            Propose meeting
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default MeetingForm;
