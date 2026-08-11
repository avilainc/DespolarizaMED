import * as migration_20260811_105519_init from './20260811_105519_init';

export const migrations = [
  {
    up: migration_20260811_105519_init.up,
    down: migration_20260811_105519_init.down,
    name: '20260811_105519_init'
  },
];
