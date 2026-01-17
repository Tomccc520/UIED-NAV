import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    env: {
      DATABASE_URL: 'file:./test.db',
      NODE_ENV: 'test',
    },
    setupFiles: ['./src/__tests__/setup.js'],
    // 串行运行测试，避免数据库竞争
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      shuffle: false,
    },
  },
});
