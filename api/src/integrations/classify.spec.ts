import { classify } from './classify';

describe('classify', () => {
  it('treats shots fired as a priority 1 medical call', () => {
    expect(classify('shots fired, person down near the alley')).toEqual({ type: 'medical', priority: 1 });
  });

  it('treats structure fires as priority 1', () => {
    expect(classify('structure fire at the gas station')).toEqual({ type: 'fire', priority: 1 });
  });

  it('treats a noise complaint as a routine disturbance', () => {
    expect(classify('loud music from the apartment')).toEqual({ type: 'disturbance', priority: 3 });
  });
});
