import { describe, expect, it } from 'vitest';
import { lessonNumber, readFigure, readerAlias, readerEditions } from './lessonReader';

describe('lesson reader', () => {
  it('keeps invalid deep links inside the outline', () => {
    for (const input of [null, '0', '-1', '99', '1.5', 'x']) expect(lessonNumber(input, 18)).toBe(1);
    expect(lessonNumber('18', 18)).toBe(18);
  });
  it('resolves legacy lessons to one internal course location', () => {
    expect(readerAlias({course_reader:{slug:'odoo-accounting',lesson:7}})).toBe('/resources/odoo-accounting?lesson=7');
    expect(readerAlias({course_reader:{slug:'//external.org',lesson:7}})).toBeUndefined();
    expect(readerEditions({presentation:{kind:'community_course'}})).toBeUndefined();
  });
  it('rejects invalid ledger data and a zero-size invoice', () => {
    expect(readFigure({teaching_figure:{title:'',caption:'',chart:{kind:'ledger',rows:[{label:'',debit:-1,credit:1}]}}})).toBeUndefined();
    expect(readFigure({teaching_figure:{title:'',caption:'',chart:{kind:'payment',invoice:0,initial:0,received:'',remaining:''}}})).toBeUndefined();
  });
});
