"use client";

import { addTimelineEvent } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TimelineEventItem = {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  isAutomatic: boolean;
};

export function Timeline({
  applicationId,
  events,
}: {
  applicationId: string;
  events: TimelineEventItem[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {[...events]
            .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
            .map((event) => (
              <li key={event.id} className="border-l-2 pl-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {event.eventDate.toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="font-medium">{event.title}</p>
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
              </li>
            ))}
        </ol>
      )}

      <form
        action={addTimelineEvent.bind(null, applicationId)}
        className="flex flex-col gap-3 border-t pt-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="timeline-title">Add event</Label>
          <Input id="timeline-title" name="title" placeholder="e.g. Recruiter call scheduled" required />
        </div>
        <Textarea name="description" placeholder="Notes (optional)" rows={2} />
        <div>
          <Button type="submit" variant="outline" size="sm">
            Add
          </Button>
        </div>
      </form>
    </div>
  );
}
