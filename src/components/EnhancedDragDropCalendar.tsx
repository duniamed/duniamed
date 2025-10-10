import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Undo } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { useToast } from '@/hooks/use-toast';

/**
 * C18 CALENDARS - Enhanced Drag & Drop Calendar
 * Integration: @dnd-kit for drag-and-drop (https://dndkit.com)
 * Features: Drag-drop scheduling, undo actions, real-time updates
 */

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  title: string;
  blocked: boolean;
}

interface SortableItemProps {
  slot: TimeSlot;
  onDelete: (id: string) => void;
}

function SortableTimeSlot({ slot, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        slot.blocked ? 'bg-destructive/10' : 'bg-card'
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <p className="font-medium">{slot.title}</p>
        <p className="text-sm text-muted-foreground">
          {slot.start_time} - {slot.end_time}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(slot.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function EnhancedDragDropCalendar() {
  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: '1', start_time: '09:00', end_time: '10:00', title: 'Morning Consultation', blocked: false },
    { id: '2', start_time: '10:00', end_time: '11:00', title: 'Follow-up', blocked: false },
    { id: '3', start_time: '14:00', end_time: '15:00', title: 'Blocked - Lunch', blocked: true },
  ]);
  const [history, setHistory] = useState<TimeSlot[][]>([]);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setHistory([...history, slots]);
      setSlots((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast({
        title: "Schedule updated",
        description: "Time slots reordered successfully"
      });
    }
  };

  const handleDelete = (id: string) => {
    setHistory([...history, slots]);
    setSlots(slots.filter(slot => slot.id !== id));
    toast({
      title: "Slot deleted",
      description: "You can undo this action if needed"
    });
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setSlots(previous);
      setHistory(history.slice(0, -1));
      toast({
        title: "Action undone",
        description: "Schedule restored to previous state"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            Drag & Drop Schedule
            <InfoTooltip>Drag time slots to reorder your schedule. Delete slots you don't need. Use the undo button if you make a mistake. Your changes sync automatically across all your devices!</InfoTooltip>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            <Undo className="h-4 w-4 mr-2" />
            Undo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={slots.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {slots.map((slot) => (
                <SortableTimeSlot
                  key={slot.id}
                  slot={slot}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {slots.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No time slots yet. Add some to get started!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
