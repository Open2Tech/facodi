import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TeachingFigure } from './TeachingFigure';

it('updates the remaining invoice balance as the learner changes the receipt', () => {
  render(<TeachingFigure language="en" figure={{ title:'Invoice', caption:'Training example', chart:{kind:'payment',invoice:150,initial:90,received:'Received',remaining:'Outstanding'} }} />);
  expect(screen.getByRole('status')).toHaveTextContent('Outstanding · €60');
  fireEvent.change(screen.getByRole('slider', {name:/Received/}), {target:{value:'150'}});
  expect(screen.getByRole('status')).toHaveTextContent('Outstanding · €0');
});
