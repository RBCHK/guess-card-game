import {
  activateJokerAbility,
  applyRedJokerBonus,
  checkShieldProtection,
} from '@/lib/game/joker';
import type { JokerCard } from '@/lib/game/types';

// ---------------------------------------------------------------------------
// activateJokerAbility
// ---------------------------------------------------------------------------

describe('activateJokerAbility', () => {
  it('red → bufferMultiplier 1.3', () => {
    const joker: JokerCard = { type: 'joker', variant: 'red' };
    const result = activateJokerAbility(joker);
    expect(result.type).toBe('red');
    expect(result.effect.bufferMultiplier).toBe(1.3);
    expect(result.effect.shieldActive).toBeUndefined();
  });

  it('black → shieldActive true', () => {
    const joker: JokerCard = { type: 'joker', variant: 'black' };
    const result = activateJokerAbility(joker);
    expect(result.type).toBe('black');
    expect(result.effect.shieldActive).toBe(true);
    expect(result.effect.bufferMultiplier).toBeUndefined();
  });

  it('green → placeholder (empty effect)', () => {
    const joker: JokerCard = { type: 'joker', variant: 'green' };
    const result = activateJokerAbility(joker);
    expect(result.type).toBe('green');
    expect(result.effect).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// applyRedJokerBonus
// ---------------------------------------------------------------------------

describe('applyRedJokerBonus', () => {
  it('1000 × 1.3 = 1300', () => expect(applyRedJokerBonus(1000)).toBe(1300));
  it('0 × 1.3 = 0', () => expect(applyRedJokerBonus(0)).toBe(0));
  it('1 × 1.3 = 1 (floors)', () => expect(applyRedJokerBonus(1)).toBe(1));
  it('100 × 1.3 = 130', () => expect(applyRedJokerBonus(100)).toBe(130));
  it('333 × 1.3 = 432 (floors 432.9)', () => expect(applyRedJokerBonus(333)).toBe(432));
});

// ---------------------------------------------------------------------------
// checkShieldProtection
// ---------------------------------------------------------------------------

describe('checkShieldProtection', () => {
  it('shield active + miss → buffer protected, shield consumed', () => {
    const r = checkShieldProtection(true, true);
    expect(r.bufferProtected).toBe(true);
    expect(r.shieldRemaining).toBe(false);
  });

  it('shield active + hit → shield stays, no protection needed', () => {
    const r = checkShieldProtection(true, false);
    expect(r.bufferProtected).toBe(false);
    expect(r.shieldRemaining).toBe(true);
  });

  it('no shield + miss → no protection', () => {
    const r = checkShieldProtection(false, true);
    expect(r.bufferProtected).toBe(false);
    expect(r.shieldRemaining).toBe(false);
  });

  it('no shield + hit → nothing happens', () => {
    const r = checkShieldProtection(false, false);
    expect(r.bufferProtected).toBe(false);
    expect(r.shieldRemaining).toBe(false);
  });
});
