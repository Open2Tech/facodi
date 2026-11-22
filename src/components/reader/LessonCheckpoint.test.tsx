import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { LessonCheckpoint } from './LessonCheckpoint';
import { readCheckpoint, readOdooScreen } from '@/entities/course/lessonReader';

const checkpoint = {
  question: 'What remains?', choices: [
    { label: '€130', correct: false, explanation: 'This is the amount received.' },
    { label: '€110', correct: true, explanation: 'Subtract €130 from €240.' },
  ],
};
it('shows only the submitted explanation and lets the learner try another answer', () => {
  render(<LessonCheckpoint checkpoint={checkpoint} language="en" />);
  const submit = screen.getByRole('button');
  expect(submit).toBeDisabled();
  fireEvent.click(screen.getByLabelText('€130'));
  fireEvent.click(submit);
  expect(screen.getByRole('status')).toHaveTextContent('This is the amount received.');
  fireEvent.click(screen.getByLabelText('€110'));
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  fireEvent.click(submit);
  expect(screen.getByRole('status')).toHaveTextContent('Subtract €130 from €240.');
});
it('ignores a checkpoint with multiple correct answers or a screenshot outside the media folder', () => {
  expect(readCheckpoint({ checkpoint: { ...checkpoint, choices: checkpoint.choices.map(item => ({ ...item, correct: true })) } })).toBeUndefined();
  expect(readOdooScreen({odoo_screen:{asset:'../secret',original:'bank.png',alt:'Bank',caption:'Compare',width:50,height:20}})).toBeUndefined();
});
