'use client';
import { useState } from 'react';
import type { DietPreference } from '../types/diet.model';
import { CurrentDietCard } from './current-diet-card';
import { DietWizard } from './diet-wizard';

/** Keeps the editor mounted while a first save refreshes the surrounding profile query. */
export function DietProfileSection({ preference }: { preference: DietPreference | null }) {
  const [editing, setEditing] = useState(!preference);
  const [saved, setSaved] = useState<DietPreference | null>(null);
  const current =
    preference && (!saved || preference.dietaryRevision >= saved.dietaryRevision)
      ? preference
      : saved;
  if (editing || !current)
    return (
      <DietWizard
        initial={current}
        onCancel={current ? () => setEditing(false) : undefined}
        onSaved={(result) => {
          setSaved(result);
          setEditing(false);
        }}
      />
    );
  return <CurrentDietCard summary={current} onChangeDiet={() => setEditing(true)} />;
}
